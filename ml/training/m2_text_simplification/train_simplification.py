#!/usr/bin/env python3
"""
Training and Dry-Run Script for Sinhala Text Simplification (Module 2 Level 4).

Fine-tunes google/mt5-small with PEFT LoRA on SiTSE simplification pairs.
Supports deterministic dry-run forward pass validation and full training on Apple Silicon MPS/CPU.

Safety Notice:
    Running without flags prints usage and exits safely.
    To run dry-run validation (forward-only, no parameter updates):
        python ml/training/m2_text_simplification/train_simplification.py --dry-run
    To run full training (requires explicit user authorization):
        python ml/training/m2_text_simplification/train_simplification.py --train --epochs 5 --batch-size 1 --grad-accum 16
"""

import argparse
import json
import math
import os
import random
import sys
import time
from pathlib import Path
from typing import Dict, List, Any, Tuple

import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    get_linear_schedule_with_warmup
)
import peft
from peft import (
    LoraConfig,
    get_peft_model,
    TaskType
)

PAIRS_CSV_PATH = Path("ml/data/sinhala_simplification/processed/simplification_pairs.csv")
CHECKPOINT_DIR = Path("ml/checkpoints/m2_text_simplification")
DEFAULT_PREFIX = "simplify Sinhala: "
DEFAULT_MAX_SOURCE_LEN = 192
DEFAULT_MAX_TARGET_LEN = 192


def set_seed(seed: int = 42) -> None:
    """Set random seed across random, numpy, and torch for determinism."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    if torch.backends.mps.is_available():
        torch.mps.manual_seed(seed)


def get_device() -> torch.device:
    """Select MPS if available on macOS, otherwise CPU."""
    if torch.backends.mps.is_available() and torch.backends.mps.is_built():
        return torch.device("mps")
    elif torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


class SimplificationDataset(Dataset):
    """PyTorch Dataset for (prefixed_source, target) simplification pairs."""

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

        # Tokenize source
        src_enc = self.tokenizer(
            src_text,
            max_length=self.max_source_length,
            truncation=True,
            padding=False,
            return_tensors=None
        )

        # Tokenize target
        tgt_enc = self.tokenizer(
            tgt_text,
            max_length=self.max_target_length,
            truncation=True,
            padding=False,
            return_tensors=None
        )

        return {
            "source_id": row["source_id"],
            "source_raw": row["source_text"],
            "target_raw": row["target_text"],
            "input_ids": src_enc["input_ids"],
            "attention_mask": src_enc["attention_mask"],
            "labels": tgt_enc["input_ids"]
        }


def collate_fn(batch: List[Dict[str, Any]], pad_token_id: int = 0) -> Dict[str, torch.Tensor]:
    """Dynamically pad input_ids, attention_mask, and labels (-100 masked)."""
    max_src_len = max(len(x["input_ids"]) for x in batch)
    max_tgt_len = max(len(x["labels"]) for x in batch)

    batch_input_ids = []
    batch_attention_mask = []
    batch_labels = []

    for item in batch:
        src_len = len(item["input_ids"])
        tgt_len = len(item["labels"])

        # Pad input
        pad_src_len = max_src_len - src_len
        batch_input_ids.append(item["input_ids"] + [pad_token_id] * pad_src_len)
        batch_attention_mask.append(item["attention_mask"] + [0] * pad_src_len)

        # Pad target with -100 so PyTorch cross-entropy loss ignores padding
        pad_tgt_len = max_tgt_len - tgt_len
        batch_labels.append(item["labels"] + [-100] * pad_tgt_len)

    return {
        "input_ids": torch.tensor(batch_input_ids, dtype=torch.long),
        "attention_mask": torch.tensor(batch_attention_mask, dtype=torch.long),
        "labels": torch.tensor(batch_labels, dtype=torch.long)
    }


def load_pairs_data(file_path: Path) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Load simplification pairs and enforce strict split separation.
    Asserts expected row counts:
    - train: 2,380
    - validation: 299
    - test: 306
    """
    if not file_path.exists():
        raise FileNotFoundError(f"Pairs dataset not found at {file_path}")

    df = pd.read_csv(file_path)

    train_df = df[df["split"] == "train"].copy()
    val_df = df[df["split"] == "validation"].copy()
    test_df = df[df["split"] == "test"].copy()

    assert len(train_df) == 2380, f"Expected 2380 train pairs, found {len(train_df)}"
    assert len(val_df) == 299, f"Expected 299 val pairs, found {len(val_df)}"
    assert len(test_df) == 306, f"Expected 306 test pairs, found {len(test_df)}"

    # Assert zero ID leakage
    assert len(set(train_df["source_id"]) & set(val_df["source_id"])) == 0, "Train and Val share source_id"
    assert len(set(train_df["source_id"]) & set(test_df["source_id"])) == 0, "Train and Test share source_id"
    assert len(set(val_df["source_id"]) & set(test_df["source_id"])) == 0, "Val and Test share source_id"

    return train_df, val_df, test_df


def inspect_truncation(df: pd.DataFrame, tokenizer: Any, prefix: str, max_src: int, max_tgt: int) -> Dict[str, Any]:
    """Measure how many examples in a split exceed max_source_length or max_target_length."""
    src_exceed = 0
    tgt_exceed = 0
    n = len(df)

    for _, row in df.iterrows():
        src_tokens = tokenizer.encode(prefix + str(row["source_text"]), add_special_tokens=True)
        tgt_tokens = tokenizer.encode(str(row["target_text"]), add_special_tokens=True)
        if len(src_tokens) > max_src:
            src_exceed += 1
        if len(tgt_tokens) > max_tgt:
            tgt_exceed += 1

    return {
        "count": n,
        "src_exceed": src_exceed,
        "src_exceed_pct": (src_exceed / n) * 100.0,
        "tgt_exceed": tgt_exceed,
        "tgt_exceed_pct": (tgt_exceed / n) * 100.0,
    }


def build_lora_model(
    model_name: str = "google/mt5-small",
    lora_r: int = 8,
    lora_alpha: int = 16,
    lora_dropout: float = 0.05
) -> Any:
    """Load base mt5-small and wrap with verified LoRA target modules ['q', 'v']."""
    base_model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
    
    lora_config = LoraConfig(
        r=lora_r,
        lora_alpha=lora_alpha,
        target_modules=["q", "v"],
        lora_dropout=lora_dropout,
        bias="none",
        task_type=TaskType.SEQ_2_SEQ_LM
    )
    
    peft_model = get_peft_model(base_model, lora_config)
    return peft_model


def run_dry_run(args: argparse.Namespace) -> None:
    """
    Execute dry-run forward pass validation.
    No backward step, no optimizer update, no epochs, no checkpoint saves.
    """
    print("=" * 65)
    print("M2 TEXT SIMPLIFICATION: DRY-RUN FORWARD PASS VALIDATION")
    print("=" * 65)

    device = get_device()
    print(f"Device: {device} (MPS available: {torch.backends.mps.is_available()})")

    # 1. Load data
    train_df, val_df, _ = load_pairs_data(PAIRS_CSV_PATH)
    print(f"Loaded pairs: Train={len(train_df)}, Validation={len(val_df)} (Test held-out)")

    # 2. Tokenizer
    tokenizer = AutoTokenizer.from_pretrained(args.model_name, use_fast=False)
    print(f"Loaded tokenizer: {args.model_name}")

    # 3. Truncation audit
    print("\nAuditing Truncation at length 192:")
    train_trunc = inspect_truncation(train_df, tokenizer, args.prefix, args.max_source_length, args.max_target_length)
    val_trunc = inspect_truncation(val_df, tokenizer, args.prefix, args.max_source_length, args.max_target_length)
    print(f"  Train Source Exceed (>192) : {train_trunc['src_exceed']}/{train_trunc['count']} ({train_trunc['src_exceed_pct']:.2f}%)")
    print(f"  Train Target Exceed (>192) : {train_trunc['tgt_exceed']}/{train_trunc['count']} ({train_trunc['tgt_exceed_pct']:.2f}%)")
    print(f"  Val Source Exceed (>192)   : {val_trunc['src_exceed']}/{val_trunc['count']} ({val_trunc['src_exceed_pct']:.2f}%)")
    print(f"  Val Target Exceed (>192)   : {val_trunc['tgt_exceed']}/{val_trunc['count']} ({val_trunc['tgt_exceed_pct']:.2f}%)")

    # 4. Model + LoRA
    print(f"\nLoading base model {args.model_name} and attaching LoRA...")
    model = build_lora_model(
        model_name=args.model_name,
        lora_r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout
    )
    model.to(device)
    model.eval()

    trainable_tensors = [(name, p.shape, p.numel()) for name, p in model.named_parameters() if p.requires_grad]
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p[2] for p in trainable_tensors)
    print(f"  Total parameters     : {total_params:,}")
    print(f"  Trainable tensors    : {len(trainable_tensors)} (48 LoRA A + 48 LoRA B)")
    print(f"  Trainable parameters : {trainable_params:,} ({100.0 * trainable_params / total_params:.4f}%)")

    # 5. One small train batch
    train_ds = SimplificationDataset(
        train_df,
        tokenizer,
        prefix=args.prefix,
        max_source_length=args.max_source_length,
        max_target_length=args.max_target_length
    )
    loader = DataLoader(
        train_ds,
        batch_size=2,
        shuffle=False,
        collate_fn=lambda b: collate_fn(b, pad_token_id=tokenizer.pad_token_id)
    )

    sample_batch = next(iter(loader))
    input_ids = sample_batch["input_ids"].to(device)
    attention_mask = sample_batch["attention_mask"].to(device)
    labels = sample_batch["labels"].to(device)

    print("\nForward Pass Tensor Shapes:")
    print(f"  input_ids shape      : {list(input_ids.shape)}")
    print(f"  attention_mask shape : {list(attention_mask.shape)}")
    print(f"  labels shape         : {list(labels.shape)}")

    # 6. Forward pass under torch.no_grad()
    with torch.no_grad():
        outputs = model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            labels=labels
        )
        loss = outputs.loss

    loss_val = loss.item()
    is_finite = bool(torch.isfinite(loss).item())
    print(f"\nForward Loss Result:")
    print(f"  Loss Value : {loss_val:.4f}")
    print(f"  Is Finite  : {is_finite}")
    assert is_finite, f"Loss is not finite: {loss_val}"

    # 7. Untrained sample generation check (3 train examples)
    print("\n" + "-" * 65)
    print("UNTRAINED MODEL GENERATION CHECK (At most 3 TRAIN examples)")
    print("-" * 65)

    for i in range(min(3, len(train_df))):
        raw_src = train_df.iloc[i]["source_text"]
        raw_tgt = train_df.iloc[i]["target_text"]
        prefixed_src = args.prefix + str(raw_src)

        inputs = tokenizer(
            prefixed_src,
            max_length=args.max_source_length,
            truncation=True,
            return_tensors="pt"
        ).to(device)

        with torch.no_grad():
            gen_tokens = model.generate(
                input_ids=inputs["input_ids"],
                attention_mask=inputs["attention_mask"],
                max_length=args.max_target_length,
                num_beams=args.beam_size,
                early_stopping=True
            )

        gen_text = tokenizer.decode(gen_tokens[0], skip_special_tokens=True)
        print(f"\n[Example {i+1}] (UNTRAINED Base + LoRA output)")
        print(f"  Prefixed Source  : {prefixed_src[:90]}...")
        print(f"  Ground Truth Tgt : {raw_tgt[:90]}...")
        print(f"  Generated (raw)  : '{gen_text}'")

    print("\n" + "=" * 65)
    print("✓ DRY RUN COMPLETED SUCCESSFULLY: NO UPDATES OR CHECKPOINTS SAVED.")
    print("=" * 65)


def train_model(args: argparse.Namespace) -> None:
    """
    Execute full supervised LoRA fine-tuning of google/mt5-small on SiTSE train pairs.
    Evaluates on validation split each epoch; saves best LoRA adapter based on validation loss.
    """
    print("=" * 65)
    print("M2 TEXT SIMPLIFICATION: FULL LORA TRAINING")
    print("=" * 65)

    device = get_device()
    print(f"Training Device : {device} (MPS available: {torch.backends.mps.is_available()})")
    print(f"Precision Mode  : float32 (stable native precision)")

    # 1. Load data
    train_df, val_df, test_df = load_pairs_data(PAIRS_CSV_PATH)
    print(f"Dataset Loaded  : Train={len(train_df)}, Validation={len(val_df)} (Test={len(test_df)} strictly held out)")

    # 2. Tokenizer
    tokenizer = AutoTokenizer.from_pretrained(args.model_name, use_fast=False)
    print(f"Tokenizer Loaded: {args.model_name}")

    # 3. DataLoaders
    train_ds = SimplificationDataset(
        train_df,
        tokenizer,
        prefix=args.prefix,
        max_source_length=args.max_source_length,
        max_target_length=args.max_target_length
    )
    val_ds = SimplificationDataset(
        val_df,
        tokenizer,
        prefix=args.prefix,
        max_source_length=args.max_source_length,
        max_target_length=args.max_target_length
    )

    train_loader = DataLoader(
        train_ds,
        batch_size=args.batch_size,
        shuffle=True,
        collate_fn=lambda b: collate_fn(b, pad_token_id=tokenizer.pad_token_id)
    )
    val_loader = DataLoader(
        val_ds,
        batch_size=args.batch_size,
        shuffle=False,
        collate_fn=lambda b: collate_fn(b, pad_token_id=tokenizer.pad_token_id)
    )

    # 4. Model + LoRA
    print(f"\nBuilding model {args.model_name} with LoRA (r={args.lora_r}, alpha={args.lora_alpha})...")
    model = build_lora_model(
        model_name=args.model_name,
        lora_r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout
    )
    model.to(device)

    # Inspect parameter counts
    trainable_tensors = [(name, p.shape, p.numel()) for name, p in model.named_parameters() if p.requires_grad]
    trainable_params_count = sum(p[2] for p in trainable_tensors)
    frozen_params_count = sum(p.numel() for p in model.parameters() if not p.requires_grad)
    total_params_count = sum(p.numel() for p in model.parameters())

    print(f"  Total Parameters     : {total_params_count:,}")
    print(f"  Frozen Base Weights  : {frozen_params_count:,}")
    print(f"  Trainable Tensors    : {len(trainable_tensors)} (96 parameter matrices)")
    print(f"  Trainable Parameters : {trainable_params_count:,} ({100.0 * trainable_params_count / total_params_count:.4f}%)")

    # 5. Optimizer & Step Calculations
    optimizer = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad],
        lr=args.lr,
        weight_decay=args.weight_decay
    )

    updates_per_epoch = math.ceil(len(train_loader) / args.grad_accum)
    total_update_steps = updates_per_epoch * args.epochs
    warmup_steps = int(0.10 * total_update_steps)

    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=warmup_steps,
        num_training_steps=total_update_steps
    )

    print(f"\nTraining Plan:")
    print(f"  Batch size / Grad accum : {args.batch_size} / {args.grad_accum} (Effective batch size = {args.batch_size * args.grad_accum})")
    print(f"  Total train pairs       : {len(train_loader)}")
    print(f"  Updates per epoch       : {updates_per_epoch}")
    print(f"  Planned epochs          : {args.epochs}")
    print(f"  Total update steps      : {total_update_steps}")
    print(f"  Warmup steps (10%)      : {warmup_steps}")
    print(f"  Initial learning rate   : {args.lr}")
    print(f"  Max grad norm           : {args.max_grad_norm}")
    print(f"  Early stopping patience : {args.patience}")

    # 6. Checkpoint paths
    best_adapter_dir = CHECKPOINT_DIR / "best_adapter"
    best_adapter_dir.mkdir(parents=True, exist_ok=True)

    # 7. Training loop state
    best_val_loss = float("inf")
    best_epoch = 0
    patience_counter = 0
    epoch_history = []
    global_update_step = 0

    print("\n" + "=" * 65)
    print("STARTING TRAINING EPOCHS")
    print("=" * 65)

    for epoch in range(1, args.epochs + 1):
        epoch_start_time = time.time()
        model.train()
        optimizer.zero_grad()

        epoch_train_loss_sum = 0.0

        for step, batch in enumerate(train_loader):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )
            raw_loss = outputs.loss
            raw_loss_val = raw_loss.item()
            epoch_train_loss_sum += raw_loss_val

            # Correctly handle window size for gradient accumulation (especially final incomplete window)
            window_start = (step // args.grad_accum) * args.grad_accum
            current_window_size = min(args.grad_accum, len(train_loader) - window_start)
            scaled_loss = raw_loss / current_window_size
            scaled_loss.backward()

            # Trigger optimizer update at boundary of window or at the exact end of epoch
            if (step + 1) % args.grad_accum == 0 or (step + 1) == len(train_loader):
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=args.max_grad_norm)
                optimizer.step()
                scheduler.step()
                optimizer.zero_grad()
                global_update_step += 1

        mean_train_loss = epoch_train_loss_sum / len(train_loader)

        # 8. Validation loop
        model.eval()
        val_loss_sum = 0.0

        with torch.no_grad():
            for val_batch in val_loader:
                v_input_ids = val_batch["input_ids"].to(device)
                v_attention_mask = val_batch["attention_mask"].to(device)
                v_labels = val_batch["labels"].to(device)

                v_outputs = model(
                    input_ids=v_input_ids,
                    attention_mask=v_attention_mask,
                    labels=v_labels
                )
                val_loss_sum += v_outputs.loss.item()

        mean_val_loss = val_loss_sum / len(val_loader)
        duration = time.time() - epoch_start_time
        current_lr = scheduler.get_last_lr()[0]

        epoch_entry = {
            "epoch": epoch,
            "train_loss": round(mean_train_loss, 4),
            "validation_loss": round(mean_val_loss, 4),
            "learning_rate": round(current_lr, 8),
            "duration_sec": round(duration, 2)
        }
        epoch_history.append(epoch_entry)

        print(
            f"Epoch {epoch:02d}/{args.epochs:02d} | "
            f"Train Loss: {mean_train_loss:.4f} | "
            f"Val Loss: {mean_val_loss:.4f} | "
            f"LR: {current_lr:.2e} | "
            f"Time: {duration:.1f}s",
            end=""
        )

        # 9. Early stopping & Best model checkpoint
        if mean_val_loss < best_val_loss:
            best_val_loss = mean_val_loss
            best_epoch = epoch
            patience_counter = 0

            # Save best LoRA adapter and tokenizer (overwrite best_adapter/)
            model.save_pretrained(best_adapter_dir)
            tokenizer.save_pretrained(best_adapter_dir)
            print(" -> [BEST CHECKPOINT SAVED]")
        else:
            patience_counter += 1
            print(f" -> [No improvement: patience {patience_counter}/{args.patience}]")
            if patience_counter >= args.patience:
                print(f"\nEarly stopping triggered: validation loss did not improve for {args.patience} consecutive epochs.")
                break

        # Flush MPS cache between epochs
        if torch.backends.mps.is_available():
            torch.mps.empty_cache()

    # 10. Save metadata
    metadata = {
        "base_model": args.model_name,
        "task_prefix": args.prefix,
        "max_source_length": args.max_source_length,
        "max_target_length": args.max_target_length,
        "lora_r": args.lora_r,
        "lora_alpha": args.lora_alpha,
        "lora_dropout": args.lora_dropout,
        "target_modules": ["q", "v"],
        "learning_rate": args.lr,
        "weight_decay": args.weight_decay,
        "batch_size": args.batch_size,
        "gradient_accumulation_steps": args.grad_accum,
        "effective_batch_size": args.batch_size * args.grad_accum,
        "max_grad_norm": args.max_grad_norm,
        "seed": args.seed,
        "epochs_planned": args.epochs,
        "epochs_completed": len(epoch_history),
        "best_epoch": best_epoch,
        "best_validation_loss": round(best_val_loss, 4),
        "updates_per_epoch": updates_per_epoch,
        "total_planned_update_steps": total_update_steps,
        "warmup_steps": warmup_steps,
        "split_counts": {
            "train_pairs": len(train_df),
            "validation_pairs": len(val_df),
            "test_pairs": len(test_df)
        },
        "device": str(device),
        "dtype": "float32",
        "package_versions": {
            "torch": torch.__version__,
            "peft": getattr(peft, "__version__", "unknown")
        },
        "epoch_history": epoch_history
    }

    metadata_path = CHECKPOINT_DIR / "training_metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 65)
    print(f"TRAINING COMPLETE. Best Epoch: {best_epoch} with Val Loss: {best_val_loss:.4f}")
    print(f"Best LoRA adapter saved to : {best_adapter_dir}")
    print(f"Training metadata saved to : {metadata_path}")
    print("=" * 65)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sinhala Text Simplification mT5-small LoRA Training")
    parser.add_argument("--train", action="store_true", help="Explicit safety flag required to execute full training")
    parser.add_argument("--dry-run", action="store_true", help="Run 1-batch forward pass validation only without training")
    parser.add_argument("--model-name", type=str, default="google/mt5-small", help="Hugging Face model identifier")
    parser.add_argument("--prefix", type=str, default=DEFAULT_PREFIX, help="Task conditioning prefix")
    parser.add_argument("--max-source-length", type=int, default=DEFAULT_MAX_SOURCE_LEN, help="Max source sequence length")
    parser.add_argument("--max-target-length", type=int, default=DEFAULT_MAX_TARGET_LEN, help="Max target sequence length")
    parser.add_argument("--epochs", type=int, default=5, help="Maximum training epochs")
    parser.add_argument("--batch-size", type=int, default=1, help="Per-device batch size")
    parser.add_argument("--grad-accum", type=int, default=16, help="Gradient accumulation steps")
    parser.add_argument("--lr", type=float, default=2e-4, help="Initial learning rate")
    parser.add_argument("--weight-decay", type=float, default=0.01, help="AdamW weight decay")
    parser.add_argument("--patience", type=int, default=2, help="Early stopping patience (epochs)")
    parser.add_argument("--max-grad-norm", type=float, default=1.0, help="Gradient clipping maximum norm")
    parser.add_argument("--beam-size", type=int, default=2, help="Beam size for generation")
    parser.add_argument("--lora-r", type=int, default=8, help="LoRA rank")
    parser.add_argument("--lora-alpha", type=int, default=16, help="LoRA alpha")
    parser.add_argument("--lora-dropout", type=float, default=0.05, help="LoRA dropout")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    return parser.parse_args()


def main():
    args = parse_args()
    set_seed(args.seed)

    if args.dry_run:
        run_dry_run(args)
    elif args.train:
        train_model(args)
    else:
        print("=" * 65)
        print("M2 TEXT SIMPLIFICATION: MODEL TRAINING & EVALUATION CLI")
        print("=" * 65)
        print("SAFETY GATE: No execution mode specified.")
        print("  - To test forward pass validation (no parameter updates):")
        print("      python ml/training/m2_text_simplification/train_simplification.py --dry-run")
        print("  - To execute full training:")
        print("      python ml/training/m2_text_simplification/train_simplification.py --train --epochs 5 --batch-size 1 --grad-accum 16")
        print("=" * 65)


if __name__ == "__main__":
    main()
