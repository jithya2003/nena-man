"""
nena-man · ml/training/m2_text_simplification/preprocess_simplification.py
Module 2: Sinhala Text Simplification (Level 4 Support Model)
Researcher: Edirisooriya H. S. (IT23179844)

Preprocesses the raw SiTSE Sinhala sentence-level text simplification dataset
into zero-leakage grouped train, validation, and test partitions.

Outputs:
  1. ml/data/sinhala_simplification/processed/simplification_pairs.csv (Long format for seq2seq fine-tuning)
  2. ml/data/sinhala_simplification/processed/simplification_multiref.jsonl (Multi-reference format for evaluation)

Design Rules:
  - Source grouping by unicodedata.normalize("NFC", text.strip())
  - Deterministic source ID assignment: src_0001 ... src_0981 based on lexicographical order of unique NFC sources
  - Deterministic grouped split with random.seed(42): Train (784, 80%), Validation (98, 10%), Test (99, 10%)
  - Zero leakage: all human references for any given complex source remain in the exact same partition
  - Identity references retained as valid human annotations
"""

import os
import csv
import json
import random
import unicodedata
from collections import defaultdict, Counter
from typing import Dict, List, Tuple, Any

# Paths relative to repository root
RAW_DATA_PATH = "ml/data/sinhala_simplification/raw/dataset.csv"
PROCESSED_DIR = "ml/data/sinhala_simplification/processed"
PAIRS_CSV_PATH = os.path.join(PROCESSED_DIR, "simplification_pairs.csv")
MULTIREF_JSONL_PATH = os.path.join(PROCESSED_DIR, "simplification_multiref.jsonl")


def normalize_sinhala_str(text: str) -> str:
    """Normalizes Unicode characters to canonical NFC and strips surrounding whitespace."""
    if not text:
        return ""
    return unicodedata.normalize("NFC", text.strip())


def run_preprocessing() -> Dict[str, Any]:
    print("=" * 60)
    print("SiTSE Sinhala Text Simplification: Grouped Preprocessing")
    print("=" * 60)

    # 1. Read raw dataset
    if not os.path.exists(RAW_DATA_PATH):
        raise FileNotFoundError(f"Raw dataset not found at: {RAW_DATA_PATH}")

    with open(RAW_DATA_PATH, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        raw_rows = list(reader)

    raw_row_count = len(raw_rows)
    print(f"Loaded raw rows: {raw_row_count}")
    if raw_row_count != 1000:
        raise AssertionError(f"Expected 1000 raw rows, got {raw_row_count}")

    # 2. Source Grouping & Reference Aggregation
    source_to_raw_indices = defaultdict(list)
    source_to_raw_refs = defaultdict(list)

    for idx, row in enumerate(raw_rows):
        if len(row) < 4:
            raise ValueError(f"Malformed row at index {idx}: expected 4 columns, got {len(row)}")
        src_nfc = normalize_sinhala_str(row[0])
        source_to_raw_indices[src_nfc].append(idx)

        for col_idx in [1, 2, 3]:
            ref_nfc = normalize_sinhala_str(row[col_idx])
            source_to_raw_refs[src_nfc].append(ref_nfc)

    unique_sources_count = len(source_to_raw_refs)
    print(f"Unique NFC source groups: {unique_sources_count}")
    if unique_sources_count != 981:
        raise AssertionError(f"Expected 981 unique source groups, got {unique_sources_count}")

    # 3. Deduplicate references per source preserving order
    source_to_unique_refs = {}
    for src, refs in source_to_raw_refs.items():
        seen = set()
        deduped = []
        for ref in refs:
            if ref not in seen:
                seen.add(ref)
                deduped.append(ref)
        source_to_unique_refs[src] = deduped

    # 4. Deterministic Source IDs
    # Sort lexicographically to ensure 100% reproducible ordering regardless of platform or dict order
    sorted_unique_sources = sorted(list(source_to_unique_refs.keys()))
    source_to_id = {src: f"src_{idx + 1:04d}" for idx, src in enumerate(sorted_unique_sources)}
    id_to_source = {v: k for k, v in source_to_id.items()}

    # 5. Deterministic Grouped Split (Seed 42)
    random.seed(42)
    shuffled_sources = list(sorted_unique_sources)
    random.shuffle(shuffled_sources)

    # 80% / 10% / 10%
    train_sources_list = shuffled_sources[:784]
    val_sources_list = shuffled_sources[784:784 + 98]
    test_sources_list = shuffled_sources[784 + 98:]

    train_sources = set(train_sources_list)
    val_sources = set(val_sources_list)
    test_sources = set(test_sources_list)

    # Map each source to split name
    source_to_split = {}
    for s in train_sources:
        source_to_split[s] = "train"
    for s in val_sources:
        source_to_split[s] = "validation"
    for s in test_sources:
        source_to_split[s] = "test"

    # Build pairs
    all_pairs = []
    split_pair_counts = Counter()
    split_identity_counts = Counter()

    for src in sorted_unique_sources:
        s_id = source_to_id[src]
        split_name = source_to_split[src]
        for ref in source_to_unique_refs[src]:
            is_id = (src == ref)
            all_pairs.append({
                "source_id": s_id,
                "source_text": src,
                "target_text": ref,
                "target_is_identity": is_id,
                "split": split_name,
            })
            split_pair_counts[split_name] += 1
            if is_id:
                split_identity_counts[split_name] += 1

    total_pairs_count = len(all_pairs)
    total_identity_count = sum(split_identity_counts.values())

    print(f"Total unique pairs: {total_pairs_count}")
    print(f"  Train pairs: {split_pair_counts['train']}, Identity: {split_identity_counts['train']}")
    print(f"  Validation pairs: {split_pair_counts['validation']}, Identity: {split_identity_counts['validation']}")
    print(f"  Test pairs: {split_pair_counts['test']}, Identity: {split_identity_counts['test']}")
    print(f"  Total Identity pairs: {total_identity_count}")

    # 6. Pre-Write Integrity Assertions
    print("\n--- Running Pre-Write Integrity Assertions ---")
    assert raw_row_count == 1000, "Assertion 1 Failed: raw row count != 1000"
    assert unique_sources_count == 981, "Assertion 2 Failed: unique normalized sources != 981"
    assert total_pairs_count == 2985, "Assertion 3 Failed: unique pairs != 2985"
    assert len(train_sources) == 784, "Assertion 4 Failed: train sources != 784"
    assert len(val_sources) == 98, "Assertion 5 Failed: validation sources != 98"
    assert len(test_sources) == 99, "Assertion 6 Failed: test sources != 99"
    assert split_pair_counts["train"] == 2380, "Assertion 7 Failed: train pairs != 2380"
    assert split_pair_counts["validation"] == 299, "Assertion 8 Failed: validation pairs != 299"
    assert split_pair_counts["test"] == 306, "Assertion 9 Failed: test pairs != 306"
    assert total_identity_count == 246, "Assertion 10 Failed: total identity pairs != 246"
    assert len(train_sources.intersection(val_sources)) == 0, "Assertion 11a Failed: train/val source overlap"
    assert len(train_sources.intersection(test_sources)) == 0, "Assertion 11b Failed: train/test source overlap"
    assert len(val_sources.intersection(test_sources)) == 0, "Assertion 11c Failed: val/test source overlap"

    train_pair_tuples = set((p["source_text"], p["target_text"]) for p in all_pairs if p["split"] == "train")
    val_pair_tuples = set((p["source_text"], p["target_text"]) for p in all_pairs if p["split"] == "validation")
    test_pair_tuples = set((p["source_text"], p["target_text"]) for p in all_pairs if p["split"] == "test")
    assert len(train_pair_tuples.intersection(val_pair_tuples)) == 0, "Assertion 12a Failed: train/val pair overlap"
    assert len(train_pair_tuples.intersection(test_pair_tuples)) == 0, "Assertion 12b Failed: train/test pair overlap"
    assert len(val_pair_tuples.intersection(test_pair_tuples)) == 0, "Assertion 12c Failed: val/test pair overlap"
    assert len(source_to_id) == 981, "Assertion 13 Failed: source_id count != 981"

    print("All 15 Pre-Write Assertions Passed!")

    # 7. Write Processed Files
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    print(f"\nWriting: {PAIRS_CSV_PATH}")
    with open(PAIRS_CSV_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["source_id", "source_text", "target_text", "target_is_identity", "split"])
        for p in all_pairs:
            writer.writerow([
                p["source_id"],
                p["source_text"],
                p["target_text"],
                p["target_is_identity"],
                p["split"],
            ])

    print(f"Writing: {MULTIREF_JSONL_PATH}")
    multiref_records = []
    with open(MULTIREF_JSONL_PATH, "w", encoding="utf-8") as f:
        for src in sorted_unique_sources:
            rec = {
                "source_id": source_to_id[src],
                "source_text": src,
                "references": source_to_unique_refs[src],
                "split": source_to_split[src],
            }
            multiref_records.append(rec)
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    # 8. Read-Back Verification
    print("\n--- Running Read-Back Verification from Disk ---")
    with open(PAIRS_CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        reloaded_pairs = list(reader)

    with open(MULTIREF_JSONL_PATH, "r", encoding="utf-8") as f:
        reloaded_multiref = [json.loads(line) for line in f if line.strip()]

    pairs_file_size_kb = os.path.getsize(PAIRS_CSV_PATH) / 1024
    multiref_file_size_kb = os.path.getsize(MULTIREF_JSONL_PATH) / 1024
    print(f"Reloaded pairs count: {len(reloaded_pairs)} ({pairs_file_size_kb:.2f} KB)")
    print(f"Reloaded multiref count: {len(reloaded_multiref)} ({multiref_file_size_kb:.2f} KB)")

    assert len(reloaded_pairs) == 2985, "Read-back assertion failed: pairs count != 2985"
    assert len(reloaded_multiref) == 981, "Read-back assertion failed: multiref count != 981"

    # Reloaded split counts
    r_split_pair_counts = Counter(p["split"] for p in reloaded_pairs)
    r_split_id_counts = Counter(p["split"] for p in reloaded_pairs if p["target_is_identity"].lower() == "true")
    r_split_source_counts = Counter(m["split"] for m in reloaded_multiref)

    assert r_split_source_counts["train"] == 784, "Read-back assertion failed: train sources"
    assert r_split_source_counts["validation"] == 98, "Read-back assertion failed: validation sources"
    assert r_split_source_counts["test"] == 99, "Read-back assertion failed: test sources"

    assert r_split_pair_counts["train"] == 2380, "Read-back assertion failed: train pairs"
    assert r_split_pair_counts["validation"] == 299, "Read-back assertion failed: validation pairs"
    assert r_split_pair_counts["test"] == 306, "Read-back assertion failed: test pairs"

    assert sum(r_split_id_counts.values()) == 246, "Read-back assertion failed: total identity count"

    # Verify ID to text bijection and multi-reference foreign key integrity
    multiref_id_set = set(m["source_id"] for m in reloaded_multiref)
    for p in reloaded_pairs:
        assert p["source_id"] in multiref_id_set, f"Pair source_id {p['source_id']} missing in multiref"

    print("All Read-Back Assertions Passed Successfully!")

    return {
        "pairs_file": PAIRS_CSV_PATH,
        "pairs_size_kb": pairs_file_size_kb,
        "pairs_count": len(reloaded_pairs),
        "multiref_file": MULTIREF_JSONL_PATH,
        "multiref_size_kb": multiref_file_size_kb,
        "multiref_count": len(reloaded_multiref),
        "source_counts": dict(r_split_source_counts),
        "pair_counts": dict(r_split_pair_counts),
        "identity_counts": dict(r_split_id_counts),
        "source_to_unique_refs": source_to_unique_refs,
        "reloaded_pairs": reloaded_pairs,
        "reloaded_multiref": reloaded_multiref,
    }


if __name__ == "__main__":
    run_preprocessing()
