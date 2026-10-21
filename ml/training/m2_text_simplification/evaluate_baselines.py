#!/usr/bin/env python3
"""
Baseline Evaluation for Sinhala Text Simplification (Module 2 Level 4).

Evaluates two baseline models on the test split of the SiTSE dataset:
1. Identity / Copy Baseline (prediction = complex source text)
2. TF-IDF Char-ngram Retrieval Baseline (retrieves nearest train source and outputs its reference)

Metrics:
- SARI (Hugging Face evaluate)
- Multi-reference BLEU (sacrebleu)
- Mean Multi-reference ROUGE-L (rouge-score)
- Compression / length ratios and exact copy rate
- Leakage assertions verifying retrieval corpus integrity
"""

import json
from pathlib import Path
from typing import Dict, List, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import sacrebleu
from evaluate import load
from rouge_score import rouge_scorer


DATA_PATH = Path("ml/data/sinhala_simplification/processed/simplification_multiref.jsonl")


def load_dataset(file_path: Path) -> Dict[str, List[Dict[str, Any]]]:
    """Load jsonl file and partition by split."""
    if not file_path.exists():
        raise FileNotFoundError(f"Processed dataset not found at {file_path}")

    splits: Dict[str, List[Dict[str, Any]]] = {
        "train": [],
        "validation": [],
        "test": []
    }

    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rec = json.loads(line)
            split = rec.get("split")
            if split in splits:
                splits[split].append(rec)
            else:
                raise ValueError(f"Unknown split: {split}")

    return splits


def run_leakage_assertions(splits: Dict[str, List[Dict[str, Any]]]) -> None:
    """Verify strictly zero data leakage across train, validation, and test splits."""
    train_ids = {r["source_id"] for r in splits["train"]}
    val_ids = {r["source_id"] for r in splits["validation"]}
    test_ids = {r["source_id"] for r in splits["test"]}

    # 1. Source ID disjointness
    assert len(train_ids & val_ids) == 0, "Leakage: train and validation share source_ids"
    assert len(train_ids & test_ids) == 0, "Leakage: train and test share source_ids"
    assert len(val_ids & test_ids) == 0, "Leakage: validation and test share source_ids"

    # 2. Source text disjointness
    train_sources = {r["source_text"] for r in splits["train"]}
    val_sources = {r["source_text"] for r in splits["validation"]}
    test_sources = {r["source_text"] for r in splits["test"]}

    assert len(train_sources & val_sources) == 0, "Leakage: train and validation share identical source text"
    assert len(train_sources & test_sources) == 0, "Leakage: train and test share identical source text"
    assert len(val_sources & test_sources) == 0, "Leakage: validation and test share identical source text"

    # 3. Reference leakage check
    # Ensure test references are not used as train sources
    assert len(train_sources & {ref for r in splits["test"] for ref in r["references"]}) == 0, (
        "Leakage: test reference found in train sources"
    )

    # 4. Expected sizes
    assert len(splits["train"]) == 784, f"Expected 784 train sources, found {len(splits['train'])}"
    assert len(splits["validation"]) == 98, f"Expected 98 val sources, found {len(splits['validation'])}"
    assert len(splits["test"]) == 99, f"Expected 99 test sources, found {len(splits['test'])}"



def compute_descriptive_metrics(sources: List[str], predictions: List[str]) -> Dict[str, float]:
    """Compute length, compression ratio, and copy rate statistics."""
    src_words = [len(s.split()) for s in sources]
    pred_words = [len(p.split()) for p in predictions]
    
    ratios = [p / s if s > 0 else 1.0 for s, p in zip(src_words, pred_words)]
    
    shorter = sum(1 for s, p in zip(src_words, pred_words) if p < s)
    same = sum(1 for s, p in zip(src_words, pred_words) if p == s)
    longer = sum(1 for s, p in zip(src_words, pred_words) if p > s)
    
    exact_copies = sum(1 for s, p in zip(sources, predictions) if s == p)
    n = len(sources)

    return {
        "mean_source_words": float(np.mean(src_words)),
        "mean_pred_words": float(np.mean(pred_words)),
        "mean_word_ratio": float(np.mean(ratios)),
        "median_word_ratio": float(np.median(ratios)),
        "pct_shorter": (shorter / n) * 100.0,
        "pct_same_length": (same / n) * 100.0,
        "pct_longer": (longer / n) * 100.0,
        "exact_copy_rate": (exact_copies / n) * 100.0,
    }


def compute_metrics(
    sources: List[str],
    predictions: List[str],
    references_per_sample: List[List[str]],
    sari_metric: Any,
    scorer: rouge_scorer.RougeScorer
) -> Dict[str, Any]:
    """
    Compute SARI, multi-ref BLEU, and mean multi-ref ROUGE-L.
    
    - SARI: Hugging Face evaluate sari metric
    - BLEU: sacrebleu multi-reference corpus_bleu
    - ROUGE-L: rouge-score mean across all references per sample, then overall mean
    """
    # 1. SARI
    sari_res = sari_metric.compute(
        sources=sources,
        predictions=predictions,
        references=references_per_sample
    )
    sari_score = sari_res["sari"]

    # 2. SacreBLEU multi-reference
    # Determine maximum number of references across samples
    max_refs = max(len(refs) for refs in references_per_sample)
    # Construct reference streams (one list of strings per reference position)
    # For samples with fewer than max_refs, cycle references to avoid empty strings
    ref_streams = []
    for ref_idx in range(max_refs):
        stream = [refs[ref_idx % len(refs)] for refs in references_per_sample]
        ref_streams.append(stream)

    bleu_res = sacrebleu.corpus_bleu(predictions, ref_streams)
    bleu_score = bleu_res.score

    # 3. Multi-reference ROUGE-L (mean per sample, then overall mean)
    sample_rouge_l_scores = []
    for pred, refs in zip(predictions, references_per_sample):
        ref_scores = [scorer.score(ref, pred)["rougeL"].fmeasure for ref in refs]
        sample_rouge_l_scores.append(float(np.mean(ref_scores)))
    mean_rouge_l = float(np.mean(sample_rouge_l_scores)) * 100.0

    # 4. Descriptive metrics
    desc = compute_descriptive_metrics(sources, predictions)

    return {
        "sari": sari_score,
        "bleu": bleu_score,
        "rouge_l_mean": mean_rouge_l,
        "descriptive": desc
    }


def main():
    print("=" * 60)
    print("M2 TEXT SIMPLIFICATION: BASELINE EVALUATION (TEST SPLIT)")
    print("=" * 60)

    # 1. Load data
    splits = load_dataset(DATA_PATH)
    run_leakage_assertions(splits)
    print("✓ All data leakage assertions PASSED.")
    print(f"  Train sources : {len(splits['train'])}")
    print(f"  Val sources   : {len(splits['validation'])}")
    print(f"  Test sources  : {len(splits['test'])}")

    test_examples = splits["test"]
    test_sources = [r["source_text"] for r in test_examples]
    test_references = [r["references"] for r in test_examples]
    total_test_refs = sum(len(refs) for refs in test_references)
    print(f"  Total test references: {total_test_refs} across {len(test_sources)} test sources")

    # 2. Metric setup
    print("\nLoading evaluation metric libraries...")
    sari_metric = load("sari")
    scorer = rouge_scorer.RougeScorer(["rougeL"], use_stemmer=False)
    print("✓ SARI metric loaded (Hugging Face evaluate).")
    print("✓ SacreBLEU loaded.")
    print("✓ ROUGE-L scorer loaded (rouge-score).")

    # ==========================================================
    # BASELINE 1: Identity / Copy Baseline
    # ==========================================================
    print("\n" + "-" * 60)
    print("Evaluating Baseline 1: Identity / Copy Baseline")
    print("-" * 60)
    copy_predictions = list(test_sources)
    copy_results = compute_metrics(
        test_sources,
        copy_predictions,
        test_references,
        sari_metric,
        scorer
    )

    print(f"SARI Score         : {copy_results['sari']:.4f}")
    print(f"Multi-ref BLEU     : {copy_results['bleu']:.4f}")
    print(f"Mean ROUGE-L (F1)  : {copy_results['rouge_l_mean']:.4f}%")
    print(f"Mean Source Words  : {copy_results['descriptive']['mean_source_words']:.2f}")
    print(f"Mean Pred Words    : {copy_results['descriptive']['mean_pred_words']:.2f}")
    print(f"Pred/Source Ratio  : {copy_results['descriptive']['mean_word_ratio']:.4f} (median: {copy_results['descriptive']['median_word_ratio']:.4f})")
    print(f"Shorter / Same / Longer : {copy_results['descriptive']['pct_shorter']:.2f}% / {copy_results['descriptive']['pct_same_length']:.2f}% / {copy_results['descriptive']['pct_longer']:.2f}%")
    print(f"Exact Copy Rate    : {copy_results['descriptive']['exact_copy_rate']:.2f}%")

    # ==========================================================
    # BASELINE 2: TF-IDF Char-ngram Retrieval Baseline
    # ==========================================================
    print("\n" + "-" * 60)
    print("Evaluating Baseline 2: TF-IDF Char-ngram Retrieval Baseline")
    print("-" * 60)
    # Corpus: TRAIN sources only
    train_examples = splits["train"]
    # Sort train examples by source_id for deterministic index order
    train_examples = sorted(train_examples, key=lambda x: x["source_id"])
    train_sources = [r["source_text"] for r in train_examples]

    # Verify zero leakage in retrieval corpus
    assert len(set(train_sources) & set(test_sources)) == 0, "Leakage detected: test source in train corpus!"

    vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(3, 5),
        min_df=1
    )
    train_tfidf = vectorizer.fit_transform(train_sources)
    test_tfidf = vectorizer.transform(test_sources)

    sim_matrix = cosine_similarity(test_tfidf, train_tfidf)

    retrieval_predictions = []
    top_sims = []
    for i in range(len(test_sources)):
        sims = sim_matrix[i]
        # Deterministic argmax: largest similarity, break ties by earliest index (source_id ordered)
        best_idx = int(np.lexsort((-np.arange(len(sims)), sims))[-1])
        top_sims.append(float(sims[best_idx]))
        retrieved_train_record = train_examples[best_idx]
        # Prediction: first reference of retrieved train item
        retrieval_predictions.append(retrieved_train_record["references"][0])

    mean_cosine_sim = float(np.mean(top_sims))
    retrieval_results = compute_metrics(
        test_sources,
        retrieval_predictions,
        test_references,
        sari_metric,
        scorer
    )

    print(f"Mean Cosine Sim    : {mean_cosine_sim:.4f}")
    print(f"SARI Score         : {retrieval_results['sari']:.4f}")
    print(f"Multi-ref BLEU     : {retrieval_results['bleu']:.4f}")
    print(f"Mean ROUGE-L (F1)  : {retrieval_results['rouge_l_mean']:.4f}%")
    print(f"Mean Source Words  : {retrieval_results['descriptive']['mean_source_words']:.2f}")
    print(f"Mean Pred Words    : {retrieval_results['descriptive']['mean_pred_words']:.2f}")
    print(f"Pred/Source Ratio  : {retrieval_results['descriptive']['mean_word_ratio']:.4f} (median: {retrieval_results['descriptive']['median_word_ratio']:.4f})")
    print(f"Shorter / Same / Longer : {retrieval_results['descriptive']['pct_shorter']:.2f}% / {retrieval_results['descriptive']['pct_same_length']:.2f}% / {retrieval_results['descriptive']['pct_longer']:.2f}%")
    print(f"Exact Copy Rate    : {retrieval_results['descriptive']['exact_copy_rate']:.2f}%")

    print("\n" + "=" * 60)
    print("SUMMARY COMPARISON TABLE")
    print("=" * 60)
    print(f"{'Metric':<25} | {'Copy Baseline':<16} | {'Retrieval Baseline':<18}")
    print("-" * 65)
    print(f"{'SARI':<25} | {copy_results['sari']:<16.4f} | {retrieval_results['sari']:<18.4f}")
    print(f"{'Multi-ref BLEU':<25} | {copy_results['bleu']:<16.4f} | {retrieval_results['bleu']:<18.4f}")
    print(f"{'Mean ROUGE-L (%)':<25} | {copy_results['rouge_l_mean']:<16.4f} | {retrieval_results['rouge_l_mean']:<18.4f}")
    print(f"{'Mean Cosine Sim':<25} | {'N/A':<16} | {mean_cosine_sim:<18.4f}")
    print(f"{'Mean Pred Words':<25} | {copy_results['descriptive']['mean_pred_words']:<16.2f} | {retrieval_results['descriptive']['mean_pred_words']:<18.2f}")
    print(f"{'Pred/Source Ratio':<25} | {copy_results['descriptive']['mean_word_ratio']:<16.4f} | {retrieval_results['descriptive']['mean_word_ratio']:<18.4f}")
    print(f"{'Exact Copy Rate (%)':<25} | {copy_results['descriptive']['exact_copy_rate']:<16.2f} | {retrieval_results['descriptive']['exact_copy_rate']:<18.2f}")
    print("=" * 60)


if __name__ == "__main__":
    main()
