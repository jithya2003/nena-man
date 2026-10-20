#!/usr/bin/env python3
"""
Final One-Time Evaluation of Frozen Trained mT5-small + LoRA Model on Held-Out Test Split.

Strict Research Integrity Constraints:
- Evaluates frozen best adapter checkpoint only: ml/checkpoints/m2_text_simplification/best_adapter/
- Evaluates held-out test split (99 sources, 306 references) strictly one time.
- Uses multi-reference evaluation for SARI, SacreBLEU (13a & none), and mean ROUGE-L.
- Computes descriptive length and compression statistics.
- Performs output sanity checks (sentinels, empty strings, repetition, language preservation).
- Saves reproducible evaluation results to ml/checkpoints/m2_text_simplification/final_test_evaluation.json.
"""

import json
import os
import platform
import re
import sys
import time
from pathlib import Path
from typing import Dict, List, Any

# Ensure platform.mac_ver does not return empty string on macOS 26+ for truststore compatibility
if platform.system() == "Darwin" and not platform.mac_ver()[0]:
    platform.mac_ver = lambda: ("26.2.0", ("", "", ""), "")

import numpy as np
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from peft import PeftModel
import sacrebleu
from evaluate import load as load_metric
from rouge_score import rouge_scorer

DATA_PATH = Path("ml/data/sinhala_simplification/processed/simplification_multiref.jsonl")
CHECKPOINT_DIR = Path("ml/checkpoints/m2_text_simplification")
ADAPTER_DIR = CHECKPOINT_DIR / "best_adapter"
OUTPUT_JSON_PATH = CHECKPOINT_DIR / "final_test_evaluation.json"

TASK_PREFIX = "simplify Sinhala: "
MAX_SOURCE_LEN = 192
MAX_TARGET_LEN = 192
NUM_BEAMS = 2
DO_SAMPLE = False


def load_test_data(filepath: Path) -> List[Dict[str, Any]]:
    """Load test records from multiref JSONL."""
    test_records = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            rec = json.loads(line)
            if rec.get("split") == "test":
                test_records.append(rec)
    return test_records


def check_repeated_phrases(text: str, n: int = 3, threshold: int = 3) -> bool:
    """Detect obvious repeated n-gram loops in generated text."""
    words = text.split()
    if len(words) < n * threshold:
        return False
    ngrams = [" ".join(words[i:i + n]) for i in range(len(words) - n + 1)]
    for i in range(len(ngrams) - (n * (threshold - 1))):
        target = ngrams[i]
        count = 1
        curr = i + n
        while curr < len(ngrams) and ngrams[curr] == target:
            count += 1
            curr += n
        if count >= threshold:
            return True
    return False


def compute_descriptive_metrics(sources: List[str], predictions: List[str]) -> Dict[str, float]:
    """Compute length, compression ratio, and copy rate statistics."""
    src_words = [len(s.split()) for s in sources]
    pred_words = [len(p.split()) for p in predictions]

    ratios = [p / s if s > 0 else 1.0 for s, p in zip(src_words, pred_words)]

    shorter = sum(1 for s, p in zip(src_words, pred_words) if p < s)
    same = sum(1 for s, p in zip(src_words, pred_words) if p == s)
    longer = sum(1 for s, p in zip(src_words, pred_words) if p > s)
    exact_copies = sum(1 for s, p in zip(sources, predictions) if s.strip() == p.strip())
    n = len(sources)

    return {
        "mean_source_words": float(np.mean(src_words)),
        "mean_generated_words": float(np.mean(pred_words)),
        "mean_word_ratio": float(np.mean(ratios)),
        "median_word_ratio": float(np.median(ratios)),
        "pct_shorter": float((shorter / n) * 100.0),
        "pct_same_length": float((same / n) * 100.0),
        "pct_longer": float((longer / n) * 100.0),
        "exact_copy_rate": float((exact_copies / n) * 100.0),
    }


def main():
    print("=" * 65)
    print("M2 TEXT SIMPLIFICATION: FINAL HELD-OUT TEST EVALUATION")
    print("=" * 65)

    # 1. Verify environment and paths
    assert ADAPTER_DIR.exists(), f"Adapter directory not found at {ADAPTER_DIR}"
    assert (ADAPTER_DIR / "adapter_model.safetensors").exists(), "adapter_model.safetensors missing"
    assert (ADAPTER_DIR / "adapter_config.json").exists(), "adapter_config.json missing"
    assert DATA_PATH.exists(), f"Data file not found at {DATA_PATH}"

    # 2. Load test split
    test_records = load_test_data(DATA_PATH)
    # Sort deterministically by source_id
    test_records.sort(key=lambda r: r["source_id"])
    assert len(test_records) == 99, f"Expected 99 test sources, found {len(test_records)}"

    total_refs = sum(len(r["references"]) for r in test_records)
    print(f"Loaded {len(test_records)} test sources with {total_refs} total references.")
    assert total_refs == 306, f"Expected 306 test references, found {total_refs}"

    test_sources = [r["source_text"] for r in test_records]
    test_references_per_sample = [r["references"] for r in test_records]

    # 3. Load model and tokenizer
    print(f"Loading frozen base model 'google/mt5-small' and adapter '{ADAPTER_DIR}'...")
    tokenizer = AutoTokenizer.from_pretrained(str(ADAPTER_DIR))
    base_model = AutoModelForSeq2SeqLM.from_pretrained("google/mt5-small")
    model = PeftModel.from_pretrained(base_model, str(ADAPTER_DIR))
    model.eval()

    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    model.to(device)
    print(f"Model placed on device: {device} (inference mode: eval, no gradients)")

    # 4. Warm-up inference
    print("Warming up MPS device with a dummy forward pass...")
    dummy_input = tokenizer(f"{TASK_PREFIX}පරීක්ෂණ වාක්‍යයකි.", return_tensors="pt").to(device)
    with torch.no_grad():
        _ = model.generate(**dummy_input, max_length=MAX_TARGET_LEN, num_beams=NUM_BEAMS, do_sample=DO_SAMPLE)
    if device.type == "mps":
        torch.mps.synchronize()

    # 5. Generate predictions on all 99 test sources
    print(f"\nGenerating predictions for all 99 unique test sources (num_beams={NUM_BEAMS}, max_len={MAX_TARGET_LEN})...")
    predictions = []
    latencies = []

    for idx, source in enumerate(test_sources):
        formatted_input = f"{TASK_PREFIX}{source}"
        inputs = tokenizer(
            formatted_input,
            max_length=MAX_SOURCE_LEN,
            truncation=True,
            return_tensors="pt"
        ).to(device)

        start_t = time.perf_counter()
        with torch.no_grad():
            output_tokens = model.generate(
                **inputs,
                max_length=MAX_TARGET_LEN,
                num_beams=NUM_BEAMS,
                do_sample=DO_SAMPLE
            )
        if device.type == "mps":
            torch.mps.synchronize()
        end_t = time.perf_counter()

        pred_text = tokenizer.decode(output_tokens[0], skip_special_tokens=True)
        predictions.append(pred_text)
        latencies.append(end_t - start_t)

        if (idx + 1) % 20 == 0 or (idx + 1) == 99:
            print(f"  Processed {idx + 1}/99 test sources... (recent latency: {latencies[-1]:.3f}s)")

    # 6. Basic output sanity checks
    empty_count = sum(1 for p in predictions if not p.strip())
    exact_copy_count = sum(1 for s, p in zip(test_sources, predictions) if s.strip() == p.strip())
    sentinel_count = sum(1 for p in predictions if "<extra_id_" in p)
    sinhala_pattern = re.compile(r"[\u0D80-\u0DFF]")
    no_sinhala_count = sum(1 for p in predictions if not sinhala_pattern.search(p))
    repeated_output_count = sum(1 for p in predictions if check_repeated_phrases(p))
    unique_preds = len(set(predictions))

    print("\n" + "=" * 50)
    print("OUTPUT SANITY CHECKS")
    print("=" * 50)
    print(f"  Empty predictions            : {empty_count} / 99")
    print(f"  Exact source copies          : {exact_copy_count} / 99")
    print(f"  Sentinel-token outputs       : {sentinel_count} / 99")
    print(f"  No-Sinhala character outputs : {no_sinhala_count} / 99")
    print(f"  Obvious repeated n-gram loops: {repeated_output_count} / 99")
    print(f"  Unique predictions           : {unique_preds} / 99")

    # 7. Descriptive simplification metrics
    desc = compute_descriptive_metrics(test_sources, predictions)
    print("\n" + "=" * 50)
    print("DESCRIPTIVE SIMPLIFICATION METRICS")
    print("=" * 50)
    print(f"  Mean source words            : {desc['mean_source_words']:.2f}")
    print(f"  Mean generated words         : {desc['mean_generated_words']:.2f}")
    print(f"  Mean word ratio (gen / src)  : {desc['mean_word_ratio']:.4f}")
    print(f"  Median word ratio            : {desc['median_word_ratio']:.4f}")
    print(f"  Predictions shorter than src : {desc['pct_shorter']:.2f}%")
    print(f"  Predictions same length      : {desc['pct_same_length']:.2f}%")
    print(f"  Predictions longer than src  : {desc['pct_longer']:.2f}%")
    print(f"  Exact copy rate              : {desc['exact_copy_rate']:.2f}%")

    # 8. Compute primary automatic metrics
    print("\n" + "=" * 50)
    print("COMPUTING FINAL AUTOMATIC METRICS")
    print("=" * 50)

    # A. SARI
    print("Computing SARI metric via Hugging Face evaluate...")
    sari_loader = load_metric("sari")
    sari_res = sari_loader.compute(
        sources=test_sources,
        predictions=predictions,
        references=test_references_per_sample
    )
    sari_score = float(sari_res["sari"])
    print(f"  SARI Score: {sari_score:.4f}")

    # B. Multi-reference SacreBLEU (13a and none)
    print("Computing SacreBLEU multi-reference scores...")
    max_refs = max(len(refs) for refs in test_references_per_sample)
    ref_streams = []
    for ref_idx in range(max_refs):
        stream = [refs[ref_idx % len(refs)] for refs in test_references_per_sample]
        ref_streams.append(stream)

    bleu_13a = sacrebleu.corpus_bleu(predictions, ref_streams, tokenize="13a")
    bleu_none = sacrebleu.corpus_bleu(predictions, ref_streams, tokenize="none")
    print(f"  BLEU (tok:13a) : {bleu_13a.score:.4f} (Signature: {bleu_13a.format()})")
    print(f"  BLEU (tok:none): {bleu_none.score:.4f} (Signature: {bleu_none.format()})")

    # C. Multi-reference ROUGE-L
    print("Computing multi-reference ROUGE-L (mean per sample, then overall mean)...")
    scorer = rouge_scorer.RougeScorer(["rougeL"], use_stemmer=False)
    sample_rouge_l_scores = []
    for pred, refs in zip(predictions, test_references_per_sample):
        ref_scores = [scorer.score(ref, pred)["rougeL"].fmeasure for ref in refs]
        sample_rouge_l_scores.append(float(np.mean(ref_scores)))
    mean_rouge_l = float(np.mean(sample_rouge_l_scores)) * 100.0
    print(f"  Mean ROUGE-L F1: {mean_rouge_l:.4f}%")

    # 9. Inference timing statistics
    lat_arr = np.array(latencies)
    mean_lat = float(np.mean(lat_arr))
    median_lat = float(np.median(lat_arr))
    p95_lat = float(np.percentile(lat_arr, 95))
    print("\n" + "=" * 50)
    print("INFERENCE LATENCY (MPS, batch_size=1)")
    print("=" * 50)
    print(f"  Mean latency   : {mean_lat:.4f}s ({mean_lat*1000:.1f}ms)")
    print(f"  Median latency : {median_lat:.4f}s ({median_lat*1000:.1f}ms)")
    print(f"  P95 latency    : {p95_lat:.4f}s ({p95_lat*1000:.1f}ms)")

    # 10. Baseline Comparison Table
    copy_baseline = {
        "sari": 61.2761,
        "bleu_13a": 92.9208,
        "mean_rouge_l": 46.8765,
        "exact_copy_rate": 100.0
    }
    retrieval_baseline = {
        "sari": 15.4958,
        "bleu_13a": 7.9408,
        "mean_rouge_l": 3.3622,
        "exact_copy_rate": 0.0
    }

    print("\n" + "=" * 70)
    print("BASELINE COMPARISON TABLE (TEST SPLIT: 99 SOURCES, 306 REFERENCES)")
    print("=" * 70)
    header = f"{'Metric':<25} | {'Copy Baseline':<15} | {'Retrieval':<15} | {'Trained mT5+LoRA':<18}"
    print(header)
    print("-" * len(header))
    print(f"{'SARI (Simplification)':<25} | {copy_baseline['sari']:<15.4f} | {retrieval_baseline['sari']:<15.4f} | {sari_score:<18.4f}")
    print(f"{'BLEU (tok:13a)':<25} | {copy_baseline['bleu_13a']:<15.4f} | {retrieval_baseline['bleu_13a']:<15.4f} | {bleu_13a.score:<18.4f}")
    print(f"{'BLEU (tok:none)':<25} | {'N/A':<15} | {'N/A':<15} | {bleu_none.score:<18.4f}")
    print(f"{'Mean ROUGE-L (%)':<25} | {copy_baseline['mean_rouge_l']:<15.4f} | {retrieval_baseline['mean_rouge_l']:<15.4f} | {mean_rouge_l:<18.4f}")
    print(f"{'Exact Copy Rate (%)':<25} | {copy_baseline['exact_copy_rate']:<15.1f} | {retrieval_baseline['exact_copy_rate']:<15.1f} | {desc['exact_copy_rate']:<18.2f}")
    print("=" * 70)

    # 11. 10 Deterministic Qualitative Test Examples
    sample_indices = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]
    qualitative_samples = []
    print("\n" + "=" * 70)
    print("10 DETERMINISTIC QUALITATIVE EXAMPLES (EVENLY SPACED ACROSS TEST SOURCES)")
    print("=" * 70)
    for sample_i in sample_indices:
        rec = test_records[sample_i]
        pred = predictions[sample_i]
        sample_dict = {
            "index": sample_i,
            "source_id": rec["source_id"],
            "source": rec["source_text"],
            "generated_simplification": pred,
            "references": rec["references"]
        }
        qualitative_samples.append(sample_dict)
        print(f"\n[Sample {sample_i + 1}/99] source_id: {rec['source_id']}")
        print(f"  SOURCE       : {rec['source_text']}")
        print(f"  PREDICTION   : {pred}")
        print(f"  REFERENCES ({len(rec['references'])}):")
        for r_i, ref in enumerate(rec["references"], 1):
            print(f"    Ref {r_i}: {ref}")

    # 12. Save reproducible results JSON
    results = {
        "evaluation_name": "M2 Sinhala Text Simplification Frozen Adapter Held-Out Test Evaluation",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "model_configuration": {
            "base_model": "google/mt5-small",
            "adapter_path": str(ADAPTER_DIR.resolve()),
            "lora_r": 8,
            "lora_alpha": 16,
            "target_modules": ["q", "v"],
            "adapter_safetensors_bytes": (ADAPTER_DIR / "adapter_model.safetensors").stat().st_size
        },
        "generation_settings": {
            "task_prefix": TASK_PREFIX,
            "max_source_length": MAX_SOURCE_LEN,
            "max_target_length": MAX_TARGET_LEN,
            "num_beams": NUM_BEAMS,
            "do_sample": DO_SAMPLE
        },
        "test_split_info": {
            "data_path": str(DATA_PATH),
            "num_test_sources": len(test_records),
            "num_test_references": total_refs
        },
        "automatic_metrics": {
            "sari": sari_score,
            "bleu_13a": {
                "score": float(bleu_13a.score),
                "signature": str(bleu_13a.format())
            },
            "bleu_none": {
                "score": float(bleu_none.score),
                "signature": str(bleu_none.format())
            },
            "mean_rouge_l_f1_pct": mean_rouge_l
        },
        "descriptive_metrics": desc,
        "output_sanity_checks": {
            "empty_predictions": empty_count,
            "exact_source_copies": exact_copy_count,
            "sentinel_token_outputs": sentinel_count,
            "no_sinhala_outputs": no_sinhala_count,
            "repeated_ngram_loops": repeated_output_count,
            "unique_predictions_out_of_99": unique_preds
        },
        "inference_latency_mps_seconds": {
            "mean": mean_lat,
            "median": median_lat,
            "p95": p95_lat
        },
        "baseline_comparison": {
            "copy_baseline": copy_baseline,
            "retrieval_baseline": retrieval_baseline,
            "trained_mt5_lora": {
                "sari": sari_score,
                "bleu_13a": float(bleu_13a.score),
                "mean_rouge_l": mean_rouge_l,
                "exact_copy_rate": desc["exact_copy_rate"]
            }
        },
        "qualitative_examples": qualitative_samples,
        "package_versions": {
            "torch": torch.__version__,
            "transformers": getattr(sys.modules.get("transformers"), "__version__", "unknown"),
            "peft": getattr(sys.modules.get("peft"), "__version__", "unknown"),
            "sacrebleu": sacrebleu.__version__
        }
    }

    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 65)
    print(f"Reproducible evaluation saved to: {OUTPUT_JSON_PATH}")
    print("=" * 65)


if __name__ == "__main__":
    main()
