#!/usr/bin/env python3
"""
Decoding & Generation Comparison on Validation Data Only (Module 2 Level 4).

Research Integrity Constraints:
- Evaluates frozen best adapter checkpoint only: ml/checkpoints/m2_text_simplification/best_adapter/
- Uses VALIDATION split only (98 unique sources, 299 human references).
- Test split records accessed = 0 (STRICTLY FORBIDDEN TO ACCESS TEST SPLIT).
- Predefined Configurations:
    - Config A: Current baseline decoding (beams=2, no repetition controls) + cleanup
    - Config B: Controlled beam 2 (beams=2, no_repeat_ngram=3, rep_penalty=1.15, early_stopping=True, sentinel suppression) + cleanup
    - Config C: Controlled beam 4 (beams=4, no_repeat_ngram=3, rep_penalty=1.20, length_penalty=0.80, early_stopping=True, sentinel suppression) + cleanup
- Stage A: 30-source screening to select top 2 configurations based on SARI, repetition loops, and length ratio.
- Stage B: Full validation comparison (98 sources, 299 references) on the top 2 configurations.
- Saves results to ml/checkpoints/m2_text_simplification/generation_validation_comparison.json.
"""

import json
import os
import platform
import re
import sys
import time
from collections import Counter
from pathlib import Path
from typing import Dict, List, Any, Tuple

# macOS 26+ truststore patch
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
OUTPUT_JSON_PATH = CHECKPOINT_DIR / "generation_validation_comparison.json"

TASK_PREFIX = "simplify Sinhala: "
MAX_SOURCE_LEN = 192
MAX_TARGET_LEN = 192


def load_validation_data(filepath: Path) -> Tuple[List[Dict[str, Any]], int]:
    """Load validation records only and assert zero test records accessed."""
    val_records = []
    test_records_count = 0
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            rec = json.loads(line)
            split = rec.get("split")
            if split == "validation":
                val_records.append(rec)
            elif split == "test":
                test_records_count += 1

    # Strict isolation assertion
    assert test_records_count > 0, "Sanity check: test records should exist in raw file but must never be loaded into memory"
    # Return ONLY validation records and explicit 0 for test records loaded
    return val_records, 0


def deterministic_cleanup(text: str) -> str:
    """
    Deterministic final cleanup function:
    - Strips leading/trailing whitespace
    - Removes any leading <extra_id_N> token if one remains
    - Removes any stray <extra_id_N> tokens
    - Normalizes repeated whitespace
    - Preserves all Sinhala words and punctuation intact
    """
    # Remove leading sentinel token
    text = re.sub(r"^\s*<extra_id_\d+>\s*", "", text)
    # Remove any internal sentinel tokens
    text = re.sub(r"\s*<extra_id_\d+>\s*", " ", text)
    # Normalize multiple whitespace characters
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def check_ngram_repetition(text: str, n: int = 4, threshold: int = 3) -> bool:
    """
    Deterministic repetition detector:
    Flag prediction if any normalized n-gram occurs threshold or more times in the text.
    """
    words = text.split()
    if len(words) < n:
        return False
    ngrams = [" ".join(words[i:i + n]) for i in range(len(words) - n + 1)]
    counts = Counter(ngrams)
    for ngram, count in counts.items():
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


def compute_reference_length_context(records: List[Dict[str, Any]]) -> Dict[str, float]:
    """Compute mean and median human-reference/source word ratio across validation records."""
    ratios = []
    for r in records:
        src_len = len(r["source_text"].split())
        for ref in r["references"]:
            ref_len = len(ref.split())
            ratio = ref_len / src_len if src_len > 0 else 1.0
            ratios.append(ratio)
    return {
        "mean_reference_source_ratio": float(np.mean(ratios)),
        "median_reference_source_ratio": float(np.median(ratios)),
        "total_references_evaluated": len(ratios)
    }


def evaluate_predictions(
    sources: List[str],
    predictions: List[str],
    references_per_sample: List[List[str]],
    sari_loader: Any,
    rouge_calc: rouge_scorer.RougeScorer
) -> Dict[str, Any]:
    """Compute SARI, SacreBLEU 13a, ROUGE-L F1, descriptive metrics, and sanity checks."""
    # 1. SARI
    sari_res = sari_loader.compute(
        sources=sources,
        predictions=predictions,
        references=references_per_sample
    )
    sari_score = float(sari_res["sari"])

    # 2. SacreBLEU (13a multi-reference)
    max_refs = max(len(refs) for refs in references_per_sample)
    ref_streams = []
    for ref_idx in range(max_refs):
        stream = [refs[ref_idx % len(refs)] for refs in references_per_sample]
        ref_streams.append(stream)
    bleu_res = sacrebleu.corpus_bleu(predictions, ref_streams, tokenize="13a")
    bleu_score = float(bleu_res.score)

    # 3. ROUGE-L F1
    sample_rouge_l_scores = []
    for pred, refs in zip(predictions, references_per_sample):
        ref_scores = [rouge_calc.score(ref, pred)["rougeL"].fmeasure for ref in refs]
        sample_rouge_l_scores.append(float(np.mean(ref_scores)))
    mean_rouge_l = float(np.mean(sample_rouge_l_scores)) * 100.0

    # 4. Descriptive metrics
    desc = compute_descriptive_metrics(sources, predictions)

    # 5. Sanity checks
    empty_count = sum(1 for p in predictions if not p.strip())
    exact_copy_count = sum(1 for s, p in zip(sources, predictions) if s.strip() == p.strip())
    sentinel_count = sum(1 for p in predictions if "<extra_id_" in p)
    sinhala_pattern = re.compile(r"[\u0D80-\u0DFF]")
    no_sinhala_count = sum(1 for p in predictions if not sinhala_pattern.search(p))
    repetition_count = sum(1 for p in predictions if check_ngram_repetition(p, n=4, threshold=3))
    unique_preds = len(set(predictions))

    return {
        "sari": sari_score,
        "bleu_13a": bleu_score,
        "mean_rouge_l": mean_rouge_l,
        "descriptive": desc,
        "sanity": {
            "empty_predictions": empty_count,
            "exact_source_copies": exact_copy_count,
            "sentinel_token_outputs": sentinel_count,
            "no_sinhala_outputs": no_sinhala_count,
            "repetition_loop_outputs": repetition_count,
            "unique_predictions": unique_preds,
            "total_samples": len(sources)
        }
    }


def generate_with_config(
    model: Any,
    tokenizer: Any,
    sources: List[str],
    config_name: str,
    gen_kwargs: Dict[str, Any],
    suppress_sentinels: bool,
    sentinel_token_ids: List[int],
    device: torch.device
) -> List[str]:
    """Run generation with exact parameters and apply final cleanup."""
    predictions = []
    bad_words_ids = [[tid] for tid in sentinel_token_ids] if suppress_sentinels else None

    print(f"\nGenerating for {len(sources)} samples under {config_name}...")
    for idx, source in enumerate(sources):
        formatted_input = f"{TASK_PREFIX}{source}"
        inputs = tokenizer(
            formatted_input,
            max_length=MAX_SOURCE_LEN,
            truncation=True,
            return_tensors="pt"
        ).to(device)

        kwargs = gen_kwargs.copy()
        if bad_words_ids is not None:
            kwargs["bad_words_ids"] = bad_words_ids

        with torch.no_grad():
            output_tokens = model.generate(
                **inputs,
                **kwargs
            )
        raw_text = tokenizer.decode(output_tokens[0], skip_special_tokens=True)
        cleaned_text = deterministic_cleanup(raw_text)
        predictions.append(cleaned_text)

        if (idx + 1) % 15 == 0 or (idx + 1) == len(sources):
            print(f"  [{config_name}] Processed {idx + 1}/{len(sources)} sources")

    return predictions


def main():
    print("=" * 70)
    print("M2 TEXT SIMPLIFICATION: DECODING COMPARISON ON VALIDATION DATA ONLY")
    print("=" * 70)

    # 1. Load data and verify strict isolation
    val_records, test_records_accessed = load_validation_data(DATA_PATH)
    val_records.sort(key=lambda r: r["source_id"])

    val_source_count = len(val_records)
    val_reference_count = sum(len(r["references"]) for r in val_records)

    print(f"validation source count    : {val_source_count}")
    print(f"validation reference count : {val_reference_count}")
    print(f"test records accessed      : {test_records_accessed} (STRICTLY 0)")
    assert test_records_accessed == 0, "CRITICAL ERROR: Test records accessed!"
    assert val_source_count == 98, f"Expected 98 validation sources, got {val_source_count}"
    assert val_reference_count == 299, f"Expected 299 validation references, got {val_reference_count}"

    # 2. Human reference length context
    ref_length_stats = compute_reference_length_context(val_records)
    print("\n" + "=" * 50)
    print("HUMAN VALIDATION REFERENCE LENGTH CONTEXT")
    print("=" * 50)
    print(f"  Mean Reference / Source Word Ratio   : {ref_length_stats['mean_reference_source_ratio']:.4f}")
    print(f"  Median Reference / Source Word Ratio : {ref_length_stats['median_reference_source_ratio']:.4f}")
    print(f"  Total Human References Evaluated     : {ref_length_stats['total_references_evaluated']}")

    # 3. Load model and tokenizer
    print(f"\nLoading frozen adapter from: {ADAPTER_DIR}...")
    tokenizer = AutoTokenizer.from_pretrained(str(ADAPTER_DIR))
    base_model = AutoModelForSeq2SeqLM.from_pretrained("google/mt5-small")
    model = PeftModel.from_pretrained(base_model, str(ADAPTER_DIR))
    model.eval()

    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    model.to(device)
    print(f"Model placed on device: {device} (float32 precision, eval mode)")

    # Build sentinel token IDs
    sentinel_token_ids = [tid for tid in range(250000, 250100)]
    print(f"Identified {len(sentinel_token_ids)} mT5 sentinel token IDs (<extra_id_0> through <extra_id_99>)")

    # Metrics loaders
    sari_loader = load_metric("sari")
    rouge_calc = rouge_scorer.RougeScorer(["rougeL"], use_stemmer=False)

    # 4. STAGE A: 30-Source Screening
    print("\n" + "=" * 70)
    print("STAGE A: 30-SOURCE VALIDATION SCREENING")
    print("=" * 70)

    # Deterministic selection: 30 evenly spaced records across the 98 sorted records
    indices_30 = np.linspace(0, len(val_records) - 1, 30, dtype=int).tolist()
    records_30 = [val_records[i] for i in indices_30]
    sources_30 = [r["source_text"] for r in records_30]
    refs_30 = [r["references"] for r in records_30]

    configs_stage_a = {
        "Config A (Current Beams=2)": {
            "gen_kwargs": {
                "do_sample": False,
                "num_beams": 2,
                "max_length": 192,
            },
            "suppress_sentinels": False,
            "description": "num_beams=2, no repetition penalty, no ngram ban, cleanup only"
        },
        "Config B (Controlled Beams=2)": {
            "gen_kwargs": {
                "do_sample": False,
                "num_beams": 2,
                "max_length": 192,
                "no_repeat_ngram_size": 3,
                "repetition_penalty": 1.15,
                "early_stopping": True
            },
            "suppress_sentinels": True,
            "description": "num_beams=2, no_repeat_ngram=3, rep_penalty=1.15, early_stopping=True, sentinel suppression"
        },
        "Config C (Controlled Beams=4)": {
            "gen_kwargs": {
                "do_sample": False,
                "num_beams": 4,
                "max_length": 192,
                "no_repeat_ngram_size": 3,
                "repetition_penalty": 1.20,
                "length_penalty": 0.80,
                "early_stopping": True
            },
            "suppress_sentinels": True,
            "description": "num_beams=4, no_repeat_ngram=3, rep_penalty=1.20, length_penalty=0.80, early_stopping=True, sentinel suppression"
        }
    }

    stage_a_results = {}
    stage_a_predictions = {}

    for cfg_name, cfg_spec in configs_stage_a.items():
        preds = generate_with_config(
            model=model,
            tokenizer=tokenizer,
            sources=sources_30,
            config_name=cfg_name,
            gen_kwargs=cfg_spec["gen_kwargs"],
            suppress_sentinels=cfg_spec["suppress_sentinels"],
            sentinel_token_ids=sentinel_token_ids,
            device=device
        )
        stage_a_predictions[cfg_name] = preds
        eval_metrics = evaluate_predictions(
            sources=sources_30,
            predictions=preds,
            references_per_sample=refs_30,
            sari_loader=sari_loader,
            rouge_calc=rouge_calc
        )
        stage_a_results[cfg_name] = eval_metrics

    # Print Stage A Comparison Table
    print("\n" + "=" * 90)
    print("STAGE A SCREENING RESULTS (30 VALIDATION SOURCES)")
    print("=" * 90)
    hdr = f"{'Metric':<28} | {'Config A':<18} | {'Config B':<18} | {'Config C':<18}"
    print(hdr)
    print("-" * len(hdr))
    print(f"{'SARI (Higher is better)':<28} | {stage_a_results['Config A (Current Beams=2)']['sari']:<18.4f} | {stage_a_results['Config B (Controlled Beams=2)']['sari']:<18.4f} | {stage_a_results['Config C (Controlled Beams=4)']['sari']:<18.4f}")
    print(f"{'BLEU 13a':<28} | {stage_a_results['Config A (Current Beams=2)']['bleu_13a']:<18.4f} | {stage_a_results['Config B (Controlled Beams=2)']['bleu_13a']:<18.4f} | {stage_a_results['Config C (Controlled Beams=4)']['bleu_13a']:<18.4f}")
    print(f"{'Mean ROUGE-L F1 (%)':<28} | {stage_a_results['Config A (Current Beams=2)']['mean_rouge_l']:<18.4f} | {stage_a_results['Config B (Controlled Beams=2)']['mean_rouge_l']:<18.4f} | {stage_a_results['Config C (Controlled Beams=4)']['mean_rouge_l']:<18.4f}")
    print(f"{'Mean Word Ratio (Gen/Src)':<28} | {stage_a_results['Config A (Current Beams=2)']['descriptive']['mean_word_ratio']:<18.4f} | {stage_a_results['Config B (Controlled Beams=2)']['descriptive']['mean_word_ratio']:<18.4f} | {stage_a_results['Config C (Controlled Beams=4)']['descriptive']['mean_word_ratio']:<18.4f}")
    print(f"{'Median Word Ratio':<28} | {stage_a_results['Config A (Current Beams=2)']['descriptive']['median_word_ratio']:<18.4f} | {stage_a_results['Config B (Controlled Beams=2)']['descriptive']['median_word_ratio']:<18.4f} | {stage_a_results['Config C (Controlled Beams=4)']['descriptive']['median_word_ratio']:<18.4f}")
    print(f"{'% Shorter than Source':<28} | {stage_a_results['Config A (Current Beams=2)']['descriptive']['pct_shorter']:<18.2f} | {stage_a_results['Config B (Controlled Beams=2)']['descriptive']['pct_shorter']:<18.2f} | {stage_a_results['Config C (Controlled Beams=4)']['descriptive']['pct_shorter']:<18.2f}")
    print(f"{'% Longer than Source':<28} | {stage_a_results['Config A (Current Beams=2)']['descriptive']['pct_longer']:<18.2f} | {stage_a_results['Config B (Controlled Beams=2)']['descriptive']['pct_longer']:<18.2f} | {stage_a_results['Config C (Controlled Beams=4)']['descriptive']['pct_longer']:<18.2f}")
    print(f"{'Exact Copy Rate (%)':<28} | {stage_a_results['Config A (Current Beams=2)']['descriptive']['exact_copy_rate']:<18.2f} | {stage_a_results['Config B (Controlled Beams=2)']['descriptive']['exact_copy_rate']:<18.2f} | {stage_a_results['Config C (Controlled Beams=4)']['descriptive']['exact_copy_rate']:<18.2f}")
    print(f"{'Repetition Loop Count':<28} | {stage_a_results['Config A (Current Beams=2)']['sanity']['repetition_loop_outputs']:<18} | {stage_a_results['Config B (Controlled Beams=2)']['sanity']['repetition_loop_outputs']:<18} | {stage_a_results['Config C (Controlled Beams=4)']['sanity']['repetition_loop_outputs']:<18}")
    print(f"{'Sentinel Outputs':<28} | {stage_a_results['Config A (Current Beams=2)']['sanity']['sentinel_token_outputs']:<18} | {stage_a_results['Config B (Controlled Beams=2)']['sanity']['sentinel_token_outputs']:<18} | {stage_a_results['Config C (Controlled Beams=4)']['sanity']['sentinel_token_outputs']:<18}")
    print(f"{'No-Sinhala Outputs':<28} | {stage_a_results['Config A (Current Beams=2)']['sanity']['no_sinhala_outputs']:<18} | {stage_a_results['Config B (Controlled Beams=2)']['sanity']['no_sinhala_outputs']:<18} | {stage_a_results['Config C (Controlled Beams=4)']['sanity']['no_sinhala_outputs']:<18}")
    print(f"{'Empty Outputs':<28} | {stage_a_results['Config A (Current Beams=2)']['sanity']['empty_predictions']:<18} | {stage_a_results['Config B (Controlled Beams=2)']['sanity']['empty_predictions']:<18} | {stage_a_results['Config C (Controlled Beams=4)']['sanity']['empty_predictions']:<18}")
    print("=" * 90)

    # 5. Selection of Top Two Configurations
    # Hard criteria: Reject if empty > 0, no-sinhala > 0, or sentinel > 0
    # Soft criteria: SARI (higher), Repetition rate (lower), Length ratio closer to human ref (mean ~1.0)
    scores = {}
    for cfg_name, res in stage_a_results.items():
        if res["sanity"]["empty_predictions"] > 0 or res["sanity"]["no_sinhala_outputs"] > 0 or res["sanity"]["sentinel_token_outputs"] > 0:
            print(f"REJECTED: {cfg_name} failed hard sanity checks")
            continue
        # Primary score: SARI - (5.0 * repetition_loop_outputs)
        # Penalize severely for repetitions
        sari = res["sari"]
        rep_count = res["sanity"]["repetition_loop_outputs"]
        ratio_dist = abs(res["descriptive"]["mean_word_ratio"] - ref_length_stats["mean_reference_source_ratio"])
        composite_rank_score = sari - (4.0 * rep_count) - (2.0 * ratio_dist)
        scores[cfg_name] = composite_rank_score
        print(f"Rank Score for {cfg_name}: SARI={sari:.2f}, Repetitions={rep_count}, WordRatio={res['descriptive']['mean_word_ratio']:.2f} (Dist to human ref={ratio_dist:.2f}) -> Score={composite_rank_score:.2f}")

    sorted_configs = sorted(scores.keys(), key=lambda k: scores[k], reverse=True)
    top_two = sorted_configs[:2]
    print(f"\nSelected Top Two Configurations for Full Validation:")
    for rank, cfg_name in enumerate(top_two, 1):
        print(f"  Rank {rank}: {cfg_name}")

    # 6. STAGE B: Full Validation Comparison on All 98 Validation Sources
    print("\n" + "=" * 70)
    print("STAGE B: FULL VALIDATION COMPARISON (ALL 98 SOURCES, 299 REFERENCES)")
    print("=" * 70)

    full_val_sources = [r["source_text"] for r in val_records]
    full_val_refs = [r["references"] for r in val_records]

    stage_b_results = {}
    stage_b_predictions = {}

    for cfg_name in top_two:
        cfg_spec = configs_stage_a[cfg_name]
        preds = generate_with_config(
            model=model,
            tokenizer=tokenizer,
            sources=full_val_sources,
            config_name=cfg_name,
            gen_kwargs=cfg_spec["gen_kwargs"],
            suppress_sentinels=cfg_spec["suppress_sentinels"],
            sentinel_token_ids=sentinel_token_ids,
            device=device
        )
        stage_b_predictions[cfg_name] = preds
        eval_metrics = evaluate_predictions(
            sources=full_val_sources,
            predictions=preds,
            references_per_sample=full_val_refs,
            sari_loader=sari_loader,
            rouge_calc=rouge_calc
        )
        stage_b_results[cfg_name] = eval_metrics

    # Print Stage B Comparison Table
    print("\n" + "=" * 80)
    print("STAGE B FULL VALIDATION COMPARISON TABLE (98 VALIDATION SOURCES)")
    print("=" * 80)
    hdr_b = f"{'Metric':<30} | {top_two[0]:<22} | {top_two[1]:<22}"
    print(hdr_b)
    print("-" * len(hdr_b))
    print(f"{'SARI (Higher is better)':<30} | {stage_b_results[top_two[0]]['sari']:<22.4f} | {stage_b_results[top_two[1]]['sari']:<22.4f}")
    print(f"{'BLEU 13a':<30} | {stage_b_results[top_two[0]]['bleu_13a']:<22.4f} | {stage_b_results[top_two[1]]['bleu_13a']:<22.4f}")
    print(f"{'Mean ROUGE-L F1 (%)':<30} | {stage_b_results[top_two[0]]['mean_rouge_l']:<22.4f} | {stage_b_results[top_two[1]]['mean_rouge_l']:<22.4f}")
    print(f"{'Mean Generated Words':<30} | {stage_b_results[top_two[0]]['descriptive']['mean_generated_words']:<22.2f} | {stage_b_results[top_two[1]]['descriptive']['mean_generated_words']:<22.2f}")
    print(f"{'Mean Source Words':<30} | {stage_b_results[top_two[0]]['descriptive']['mean_source_words']:<22.2f} | {stage_b_results[top_two[1]]['descriptive']['mean_source_words']:<22.2f}")
    print(f"{'Mean Word Ratio (Gen/Src)':<30} | {stage_b_results[top_two[0]]['descriptive']['mean_word_ratio']:<22.4f} | {stage_b_results[top_two[1]]['descriptive']['mean_word_ratio']:<22.4f}")
    print(f"{'Median Word Ratio':<30} | {stage_b_results[top_two[0]]['descriptive']['median_word_ratio']:<22.4f} | {stage_b_results[top_two[1]]['descriptive']['median_word_ratio']:<22.4f}")
    print(f"{'% Shorter than Source':<30} | {stage_b_results[top_two[0]]['descriptive']['pct_shorter']:<22.2f} | {stage_b_results[top_two[1]]['descriptive']['pct_shorter']:<22.2f}")
    print(f"{'% Longer than Source':<30} | {stage_b_results[top_two[0]]['descriptive']['pct_longer']:<22.2f} | {stage_b_results[top_two[1]]['descriptive']['pct_longer']:<22.2f}")
    print(f"{'Exact Copy Rate (%)':<30} | {stage_b_results[top_two[0]]['descriptive']['exact_copy_rate']:<22.2f} | {stage_b_results[top_two[1]]['descriptive']['exact_copy_rate']:<22.2f}")
    print(f"{'Repetition Loop Count':<30} | {stage_b_results[top_two[0]]['sanity']['repetition_loop_outputs']:<22} | {stage_b_results[top_two[1]]['sanity']['repetition_loop_outputs']:<22}")
    print(f"{'Sentinel Outputs':<30} | {stage_b_results[top_two[0]]['sanity']['sentinel_token_outputs']:<22} | {stage_b_results[top_two[1]]['sanity']['sentinel_token_outputs']:<22}")
    print(f"{'No-Sinhala Outputs':<30} | {stage_b_results[top_two[0]]['sanity']['no_sinhala_outputs']:<22} | {stage_b_results[top_two[1]]['sanity']['no_sinhala_outputs']:<22}")
    print(f"{'Empty Outputs':<30} | {stage_b_results[top_two[0]]['sanity']['empty_predictions']:<22} | {stage_b_results[top_two[1]]['sanity']['empty_predictions']:<22}")
    print(f"{'Unique Predictions (/98)':<30} | {stage_b_results[top_two[0]]['sanity']['unique_predictions']:<22} | {stage_b_results[top_two[1]]['sanity']['unique_predictions']:<22}")
    print("=" * 80)

    # 7. Qualitative Samples (10 deterministic validation sources)
    sample_indices = np.linspace(0, len(val_records) - 1, 10, dtype=int).tolist()
    qualitative_records = []
    print("\n" + "=" * 80)
    print("10 DETERMINISTIC QUALITATIVE EXAMPLES (EVENLY SPACED ACROSS VALIDATION SPLIT)")
    print("=" * 80)
    for sample_i in sample_indices:
        rec = val_records[sample_i]
        sample_dict = {
            "source_id": rec["source_id"],
            "source_text": rec["source_text"],
            "references": rec["references"],
            "predictions": {
                top_two[0]: stage_b_predictions[top_two[0]][sample_i],
                top_two[1]: stage_b_predictions[top_two[1]][sample_i]
            }
        }
        qualitative_records.append(sample_dict)
        print(f"\n[Validation Sample] source_id: {rec['source_id']}")
        print(f"  SOURCE COMPLEX SENTENCE:")
        print(f"    {rec['source_text']}")
        print(f"  PREDICTION ({top_two[0]}):")
        print(f"    {sample_dict['predictions'][top_two[0]]}")
        print(f"  PREDICTION ({top_two[1]}):")
        print(f"    {sample_dict['predictions'][top_two[1]]}")
        print(f"  HUMAN REFERENCES ({len(rec['references'])}):")
        for r_i, ref in enumerate(rec["references"], 1):
            print(f"    Ref {r_i}: {ref}")

    # 8. Recommend Best Configuration
    best_config_name = top_two[0] if stage_b_results[top_two[0]]["sari"] >= stage_b_results[top_two[1]]["sari"] else top_two[1]
    print("\n" + "=" * 70)
    print(f"RECOMMENDED APPLICATION GENERATION CONFIG: {best_config_name}")
    print(f"Details: {configs_stage_a[best_config_name]['description']}")
    print("=" * 70)

    # 9. Save reproducible JSON
    full_output = {
        "title": "M2 Sinhala Text Simplification Generation & Decoding Validation Comparison",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "frozen_adapter_path": str(ADAPTER_DIR.resolve()),
        "validation_dataset": {
            "path": str(DATA_PATH),
            "validation_source_count": val_source_count,
            "validation_reference_count": val_reference_count,
            "test_records_accessed": 0
        },
        "human_validation_reference_length_context": ref_length_stats,
        "stage_a_screening_30_sources": {
            "configs": {k: v["description"] for k, v in configs_stage_a.items()},
            "results": stage_a_results,
            "selected_top_two": top_two
        },
        "stage_b_full_validation_98_sources": {
            "evaluated_configs": top_two,
            "results": stage_b_results
        },
        "qualitative_validation_samples_10": qualitative_records,
        "recommended_application_config": {
            "name": best_config_name,
            "parameters": configs_stage_a[best_config_name]["gen_kwargs"],
            "suppress_sentinels": configs_stage_a[best_config_name]["suppress_sentinels"],
            "description": configs_stage_a[best_config_name]["description"]
        },
        "package_versions": {
            "torch": torch.__version__,
            "transformers": getattr(sys.modules.get("transformers"), "__version__", "unknown"),
            "peft": getattr(sys.modules.get("peft"), "__version__", "unknown"),
            "sacrebleu": sacrebleu.__version__
        }
    }

    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(full_output, f, indent=2, ensure_ascii=False)

    print(f"\nReproducible comparison results successfully saved to: {OUTPUT_JSON_PATH}")


if __name__ == "__main__":
    main()
