#!/usr/bin/env python3
"""
Training and Dry-Run Script for Sinhala Sentence Simplification (Module 2 Level 4 - v2).

Fine-tunes google/mt5-small with PEFT LoRA on the Curated Hybrid dataset (simplification_hybrid_v2.csv).
Outputs are directed to ml/checkpoints/m2_text_simplification_v2/ preserving v1 checkpoints untouched.

Safety Notice:
    Running without arguments prints usage and exits safely.
    To run dry-run validation (forward-pass only, no parameter updates, no checkpoint writes):
        python ml/training/m2_text_simplification/train_simplification_v2.py --dry-run
    To run full training (when explicitly authorized):
        python ml/training/m2_text_simplification/train_simplification_v2.py --train
"""

import argparse
import json
import math
import os
import platform
import random
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Ensure platform.mac_ver does not return empty string on macOS 26+ for truststore compatibility
if platform.system() == "Darwin" and not platform.mac_ver()[0]:
    platform.mac_ver = lambda: ("26.2.0", ("", "", ""), "")

import numpy as np
import pandas as pd
import peft
import torch
from peft import LoraConfig, TaskType, get_peft_model
from torch.utils.data import DataLoader, Dataset
from transformers import (
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    get_linear_schedule_with_warmup,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
HYBRID_CSV_PATH = REPO_ROOT / "ml" / "data" / "sinhala_simplification" / "processed" / "simplification_hybrid_v2.csv"
V2_CHECKPOINT_DIR = REPO_ROOT / "ml" / "checkpoints" / "m2_text_simplification_v2"
V1_CHECKPOINT_DIR = REPO_ROOT / "ml" / "checkpoints" / "m2_text_simplification"

DEFAULT_MODEL_NAME = "google/mt5-small"
DEFAULT_PREFIX = "simplify Sinhala: "
DEFAULT_MAX_SOURCE_LEN = 192
DEFAULT_MAX_TARGET_LEN = 192

DEFAULT_LORA_R = 8
DEFAULT_LORA_ALPHA = 16
DEFAULT_LORA_DROPOUT = 0.05
DEFAULT_TARGET_MODULES = ["q", "v"]

DEFAULT_LR = 2e-4
DEFAULT_WEIGHT_DECAY = 0.01
DEFAULT_BATCH_SIZE = 1
DEFAULT_GRAD_ACCUM = 8
DEFAULT_MAX_EPOCHS = 6
DEFAULT_WARMUP_RATIO = 0.06
DEFAULT_PATIENCE = 2
DEFAULT_GRAD_NORM = 1.0
DEFAULT_SEED = 42


def set_seed(seed: int = DEFAULT_SEED) -> None:
    """Set random seed across random, numpy, and torch for complete determinism."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    if torch.backends.mps.is_available():
        torch.mps.manual_seed(seed)


def get_device() -> torch.device:
    """Select MPS if available on macOS, otherwise CUDA or CPU."""
    if torch.backends.mps.is_available() and torch.backends.mps.is_built():
        return torch.device("mps")
    elif torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


class SimplificationHybridDataset(Dataset):
    """PyTorch Dataset for (prefixed_source, target) simplification pairs from v2 hybrid data."""

    def __init__(
        self,
        df: pd.DataFrame,
        tokenizer: Any,
        prefix: str = DEFAULT_PREFIX,
        max_source_length: int = DEFAULT_MAX_SOURCE_LEN,
        max_target_length: int = DEFAULT_MAX_TARGET_LEN,
    ):
        self.df = df.reset_index(drop=True)
        self.tokenizer = tokenizer
        self.prefix = prefix
        self.max_source_length = max_source_length
        self.max_target_length = max_target_length

    def __len__(self) -> int:
        return len(self.df)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        row = self.df.iloc[idx]
        src_text = self.prefix + str(row["source_text"])
        tgt_text = str(row["target_text"])

        src_enc = self.tokenizer(
            src_text,
            max_length=self.max_source_length,
            truncation=True,
            padding=False,
            return_tensors=None,
        )

        tgt_enc = self.tokenizer(
            tgt_text,
            max_length=self.max_target_length,
            truncation=True,
            padding=False,
            return_tensors=None,
        )

        return {
            "source_id": row["source_id"],
            "source_raw": row["source_text"],
            "target_raw": row["target_text"],
            "input_ids": src_enc["input_ids"],
            "attention_mask": src_enc["attention_mask"],
            "labels": tgt_enc["input_ids"],
        }


def collate_fn(batch: List[Dict[str, Any]], pad_token_id: int) -> Dict[str, torch.Tensor]:
    """Dynamically pad input_ids, attention_mask, and labels to maximum batch length."""
    max_src_len = max(len(item["input_ids"]) for item in batch)
    max_tgt_len = max(len(item["labels"]) for item in batch)

    batch_input_ids = []
    batch_attention_mask = []
    batch_labels = []

    for item in batch:
        src_pad_len = max_src_len - len(item["input_ids"])
        tgt_pad_len = max_tgt_len - len(item["labels"])

        batch_input_ids.append(item["input_ids"] + [pad_token_id] * src_pad_len)
        batch_attention_mask.append(item["attention_mask"] + [0] * src_pad_len)

        # In HuggingFace Seq2Seq, -100 indicates ignored index in CrossEntropyLoss
        batch_labels.append(item["labels"] + [-100] * tgt_pad_len)

    return {
        "input_ids": torch.tensor(batch_input_ids, dtype=torch.long),
        "attention_mask": torch.tensor(batch_attention_mask, dtype=torch.long),
        "labels": torch.tensor(batch_labels, dtype=torch.long),
    }


def load_hybrid_data(csv_path: Path) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Load train and validation splits from the curated hybrid CSV, asserting 0 test rows."""
    if not csv_path.exists():
        raise FileNotFoundError(f"Curated hybrid dataset not found at: {csv_path}")

    df = pd.read_csv(csv_path)

    # Strict isolation: TEST split must never be loaded
    test_rows = df[df["split"] == "test"]
    assert len(test_rows) == 0, "TEST records detected in hybrid dataset! Test records must be 0."

    train_df = df[df["split"] == "train"].copy()
    val_df = df[df["split"] == "validation"].copy()

    # Integrity assertions
    assert len(train_df) > 0, "Train split is empty!"
    assert len(val_df) > 0, "Validation split is empty!"

    # Verify 0 cross-split leakage
    train_sources = set(train_df["source_id"])
    val_sources = set(val_df["source_id"])
    assert len(train_sources.intersection(val_sources)) == 0, "Source leakage between train and val!"

    return train_df, val_df


def build_model_and_tokenizer(
    model_name: str = DEFAULT_MODEL_NAME,
    lora_r: int = DEFAULT_LORA_R,
    lora_alpha: int = DEFAULT_LORA_ALPHA,
    lora_dropout: float = DEFAULT_LORA_DROPOUT,
    target_modules: List[str] = DEFAULT_TARGET_MODULES,
) -> Tuple[Any, Any]:
    """Load google/mt5-small and wrap with PEFT LoRA."""
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    base_model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

    lora_config = LoraConfig(
        task_type=TaskType.SEQ_2_SEQ_LM,
        r=lora_r,
        lora_alpha=lora_alpha,
        lora_dropout=lora_dropout,
        target_modules=target_modules,
        bias="none",
    )

    model = get_peft_model(base_model, lora_config)
    return model, tokenizer


def run_dry_run() -> None:
    """Perform a zero-update forward-pass dry run on the curated hybrid dataset."""
    print("=" * 65)
    print("MODEL 2 V2: DRY RUN VALIDATION (CURATED HYBRID)")
    print("=" * 65)

    set_seed(DEFAULT_SEED)
    device = get_device()
    print(f"Active compute device      : {device}")
    if device.type == "mps":
        print(f"MPS available and built    : True")

    # 1. Load data
    train_df, val_df = load_hybrid_data(HYBRID_CSV_PATH)
    print(f"Hybrid Train pairs         : {len(train_df)} (from {train_df['source_id'].nunique()} sources)")
    print(f"Hybrid Validation pairs    : {len(val_df)} (from {val_df['source_id'].nunique()} sources)")
    print(f"Test records loaded        : 0 (verified)")

    # 2. Build model and LoRA
    print(f"\nLoading base model: {DEFAULT_MODEL_NAME}...")
    model, tokenizer = build_model_and_tokenizer()
    model = model.to(device)

    trainable_params, all_params = model.get_nb_trainable_parameters()
    print(f"Base model parameters      : {all_params:,}")
    print(f"LoRA trainable parameters  : {trainable_params:,} ({100 * trainable_params / all_params:.4f}%)")
    assert trainable_params == 344064, f"Expected 344,064 trainable params, got {trainable_params}"

    # 3. Create dataset and sample batch
    train_dataset = SimplificationHybridDataset(train_df, tokenizer)
    train_loader = DataLoader(
        train_dataset,
        batch_size=1,
        shuffle=False,
        collate_fn=lambda b: collate_fn(b, tokenizer.pad_token_id),
    )

    sample_batch = next(iter(train_loader))
    input_ids = sample_batch["input_ids"].to(device)
    attention_mask = sample_batch["attention_mask"].to(device)
    labels = sample_batch["labels"].to(device)

    print("\nExecuting forward pass (no backward, no optimizer step)...")
    model.eval()
    with torch.no_grad():
        outputs = model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            labels=labels,
        )
        loss = outputs.loss.item()

    print(f"Forward pass output loss   : {loss:.4f}")
    assert not math.isnan(loss) and not math.isinf(loss), "Loss is NaN or infinite!"
    assert loss > 0.0, "Loss must be positive!"
    print("Loss verification          : FINITE AND VALID")

    # 4. Assert v1 adapter safety
    v1_adapter_path = V1_CHECKPOINT_DIR / "best_adapter" / "adapter_model.safetensors"
    assert v1_adapter_path.exists(), f"V1 adapter missing: {v1_adapter_path}"
    print(f"V1 frozen adapter verified : INTACT at {v1_adapter_path}")
    print(f"Future V2 checkpoint target: {V2_CHECKPOINT_DIR / 'best_adapter'}")

    # 5. Training math calculation
    updates_per_epoch = math.ceil(len(train_df) / DEFAULT_GRAD_ACCUM)
    total_planned_updates = updates_per_epoch * DEFAULT_MAX_EPOCHS
    warmup_steps = int(total_planned_updates * DEFAULT_WARMUP_RATIO)

    print("\n" + "=" * 65)
    print("CALCULATED V2 TRAINING MATH")
    print("=" * 65)
    print(f"Train pairs                : {len(train_df)}")
    print(f"Batch size                 : {DEFAULT_BATCH_SIZE}")
    print(f"Gradient accumulation steps: {DEFAULT_GRAD_ACCUM}")
    print(f"Effective batch size       : {DEFAULT_BATCH_SIZE * DEFAULT_GRAD_ACCUM}")
    print(f"Updates per epoch          : {updates_per_epoch}")
    print(f"Max epochs                 : {DEFAULT_MAX_EPOCHS}")
    print(f"Total planned update steps : {total_planned_updates}")
    print(f"Warmup ratio               : {DEFAULT_WARMUP_RATIO}")
    print(f"Warmup steps               : {warmup_steps}")
    print(f"Learning rate              : {DEFAULT_LR}")
    print("=" * 65)
    print("DRY RUN PASSED SUCCESSFULLY. Model 2 v2 is ready for training.")


def run_training(args: argparse.Namespace) -> None:
    """Execute full LoRA fine-tuning for Model 2 v2."""
    print("=" * 65)
    print("STARTING FULL TRAINING: MODEL 2 V2 (CURATED HYBRID)")
    print("=" * 65)

    set_seed(args.seed)
    device = get_device()
    print(f"Compute device: {device}")

    train_df, val_df = load_hybrid_data(HYBRID_CSV_PATH)
    print(f"Train pairs: {len(train_df)} | Validation pairs: {len(val_df)}")

    # 1. Assert exact expected dataset counts
    train_sources_count = train_df["source_id"].nunique()
    val_sources_count = val_df["source_id"].nunique()
    assert train_sources_count == 784, f"Expected 784 train sources, got {train_sources_count}"
    assert len(train_df) == 1532, f"Expected 1532 train pairs, got {len(train_df)}"
    assert val_sources_count == 98, f"Expected 98 validation sources, got {val_sources_count}"
    assert len(val_df) == 191, f"Expected 191 validation pairs, got {len(val_df)}"
    assert (V2_CHECKPOINT_DIR / "best_adapter").resolve() != (V1_CHECKPOINT_DIR / "best_adapter").resolve(), "V2 must not overwrite V1!"

    print(f"Verified dataset counts:")
    print(f"  Train sources = {train_sources_count}, Train pairs = {len(train_df)}")
    print(f"  Validation sources = {val_sources_count}, Validation pairs = {len(val_df)}")
    print(f"  Test records = 0 (strictly isolated)")

    model, tokenizer = build_model_and_tokenizer(
        model_name=args.model_name,
        lora_r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
    )
    model = model.to(device)

    trainable_params, all_params = model.get_nb_trainable_parameters()
    assert trainable_params == 344064, f"Expected 344,064 trainable params, got {trainable_params}"

    train_dataset = SimplificationHybridDataset(
        train_df, tokenizer, prefix=args.prefix,
        max_source_length=args.max_source_length,
        max_target_length=args.max_target_length,
    )
    val_dataset = SimplificationHybridDataset(
        val_df, tokenizer, prefix=args.prefix,
        max_source_length=args.max_source_length,
        max_target_length=args.max_target_length,
    )

    train_loader = DataLoader(
        train_dataset, batch_size=args.batch_size, shuffle=True,
        collate_fn=lambda b: collate_fn(b, tokenizer.pad_token_id),
    )
    val_loader = DataLoader(
        val_dataset, batch_size=args.batch_size, shuffle=False,
        collate_fn=lambda b: collate_fn(b, tokenizer.pad_token_id),
    )

    updates_per_epoch = math.ceil(len(train_df) / args.grad_accum)
    total_update_steps = updates_per_epoch * args.epochs
    warmup_steps = int(total_update_steps * args.warmup_ratio)

    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=args.lr,
        weight_decay=args.weight_decay,
    )
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=warmup_steps,
        num_training_steps=total_update_steps,
    )

    best_val_loss = float("inf")
    best_epoch = -1
    patience_counter = 0
    epoch_history = []
    training_start_time = time.time()

    best_adapter_dir = V2_CHECKPOINT_DIR / "best_adapter"
    best_adapter_dir.mkdir(parents=True, exist_ok=True)

    for epoch in range(1, args.epochs + 1):
        epoch_start = time.time()
        model.train()
        train_loss_sum = 0.0
        train_steps = 0
        optimizer.zero_grad()

        for step, batch in enumerate(train_loader):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
            batch_loss = outputs.loss.item()
            if math.isnan(batch_loss) or math.isinf(batch_loss):
                raise ValueError(f"Training loss became NaN/Inf at epoch {epoch}, step {step}!")

            loss = outputs.loss / args.grad_accum
            loss.backward()

            train_loss_sum += batch_loss
            train_steps += 1

            if (step + 1) % args.grad_accum == 0 or (step + 1) == len(train_loader):
                torch.nn.utils.clip_grad_norm_(model.parameters(), args.max_grad_norm)
                optimizer.step()
                scheduler.step()
                optimizer.zero_grad()

        mean_train_loss = train_loss_sum / max(1, train_steps)

        # Validation pass
        model.eval()
        val_loss_sum = 0.0
        val_steps = 0
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["labels"].to(device)

                outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
                v_loss = outputs.loss.item()
                if math.isnan(v_loss) or math.isinf(v_loss):
                    raise ValueError(f"Validation loss became NaN/Inf at epoch {epoch}!")
                val_loss_sum += v_loss
                val_steps += 1

        mean_val_loss = val_loss_sum / max(1, val_steps)
        duration = time.time() - epoch_start
        current_lr = scheduler.get_last_lr()[0]

        epoch_entry = {
            "epoch": epoch,
            "train_loss": round(mean_train_loss, 4),
            "validation_loss": round(mean_val_loss, 4),
            "learning_rate": round(current_lr, 8),
            "duration_sec": round(duration, 2),
        }
        epoch_history.append(epoch_entry)

        print(
            f"Epoch {epoch:02d}/{args.epochs:02d} | Train Loss: {mean_train_loss:.4f} | "
            f"Val Loss: {mean_val_loss:.4f} | LR: {current_lr:.2e} | Time: {duration:.1f}s",
            end="",
        )

        if mean_val_loss < best_val_loss:
            best_val_loss = mean_val_loss
            best_epoch = epoch
            patience_counter = 0
            model.save_pretrained(best_adapter_dir)
            tokenizer.save_pretrained(best_adapter_dir)
            print(" -> [BEST V2 CHECKPOINT SAVED]")
        else:
            patience_counter += 1
            print(f" -> [No improvement: patience {patience_counter}/{args.patience}]")
            if patience_counter >= args.patience:
                print(f"Early stopping triggered at epoch {epoch}.")
                break

        # Flush MPS cache between epochs to keep memory low
        if torch.backends.mps.is_available():
            torch.mps.empty_cache()

    total_training_duration = time.time() - training_start_time

    # Save comprehensive metadata
    import transformers
    metadata = {
        "base_model": args.model_name,
        "task_prefix": args.prefix,
        "max_source_length": args.max_source_length,
        "max_target_length": args.max_target_length,
        "lora_config": {
            "r": args.lora_r,
            "alpha": args.lora_alpha,
            "dropout": args.lora_dropout,
            "target_modules": DEFAULT_TARGET_MODULES,
            "bias": "none",
            "trainable_parameters": trainable_params,
        },
        "dataset_path": str(HYBRID_CSV_PATH),
        "learning_rate": args.lr,
        "weight_decay": args.weight_decay,
        "batch_size": args.batch_size,
        "gradient_accumulation_steps": args.grad_accum,
        "effective_batch_size": args.batch_size * args.grad_accum,
        "max_grad_norm": args.max_grad_norm,
        "seed": args.seed,
        "epochs_planned": args.epochs,
        "actual_completed_epochs": len(epoch_history),
        "best_epoch": best_epoch,
        "best_validation_loss": round(best_val_loss, 4),
        "updates_per_epoch": updates_per_epoch,
        "total_planned_update_steps": total_update_steps,
        "warmup_steps": warmup_steps,
        "split_counts": {
            "train_sources": train_sources_count,
            "train_pairs": len(train_df),
            "validation_sources": val_sources_count,
            "validation_pairs": len(val_df),
            "test_pairs": 0,
        },
        "device": str(device),
        "precision": "float32",
        "total_training_time_sec": round(total_training_duration, 2),
        "package_versions": {
            "torch": torch.__version__,
            "transformers": transformers.__version__,
            "peft": peft.__version__,
        },
        "epoch_history": epoch_history,
    }

    metadata_path = V2_CHECKPOINT_DIR / "training_metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"\nTraining complete. Best checkpoint: {best_adapter_dir}")
    print(f"Metadata: {metadata_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Model 2 v2 Training & Dry-Run Script for Sinhala Sentence Simplification"
    )
    group = parser.add_mutually_exclusive_group(required=False)
    group.add_argument("--dry-run", action="store_true", help="Execute single forward-pass dry run without parameter updates")
    group.add_argument("--train", action="store_true", help="Execute full training on curated hybrid dataset")

    parser.add_argument("--model-name", type=str, default=DEFAULT_MODEL_NAME)
    parser.add_argument("--prefix", type=str, default=DEFAULT_PREFIX)
    parser.add_argument("--max-source-length", type=int, default=DEFAULT_MAX_SOURCE_LEN)
    parser.add_argument("--max-target-length", type=int, default=DEFAULT_MAX_TARGET_LEN)
    parser.add_argument("--lora-r", type=int, default=DEFAULT_LORA_R)
    parser.add_argument("--lora-alpha", type=int, default=DEFAULT_LORA_ALPHA)
    parser.add_argument("--lora-dropout", type=float, default=DEFAULT_LORA_DROPOUT)
    parser.add_argument("--lr", type=float, default=DEFAULT_LR)
    parser.add_argument("--weight-decay", type=float, default=DEFAULT_WEIGHT_DECAY)
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--grad-accum", type=int, default=DEFAULT_GRAD_ACCUM)
    parser.add_argument("--epochs", type=int, default=DEFAULT_MAX_EPOCHS)
    parser.add_argument("--warmup-ratio", type=float, default=DEFAULT_WARMUP_RATIO)
    parser.add_argument("--patience", type=int, default=DEFAULT_PATIENCE)
    parser.add_argument("--max-grad-norm", type=float, default=DEFAULT_GRAD_NORM)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)

    args = parser.parse_args()

    if not args.dry_run and not args.train:
        parser.print_help()
        print("\n[SAFETY NOTICE]: Specify --dry-run to test or --train to execute full fine-tuning.")
        sys.exit(0)

    if args.dry_run:
        run_dry_run()
    elif args.train:
        run_training(args)


if __name__ == "__main__":
    main()
