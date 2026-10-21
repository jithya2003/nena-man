"""
validate_dataset.py
===================
Module 2: Sinhala Text Difficulty Analysis & Progressive Reading Support
Researcher: Edirisooriya H. S. (IT23179844)

CLI tool to validate raw Sinhala text difficulty datasets and generate
verified processed feature datasets.

Usage:
------
1. Validation Only:
   python ml/training/m2_text_difficulty/validate_dataset.py \\
     --input ml/data/sinhala_text_difficulty_dataset.xlsx

2. Validation + Processed CSV Generation:
   python ml/training/m2_text_difficulty/validate_dataset.py \\
     --input ml/data/sinhala_text_difficulty_dataset.xlsx \\
     --output ml/data/sinhala_text_difficulty_processed.csv

3. Test Linguistic Examples:
   python ml/training/m2_text_difficulty/validate_dataset.py --test-examples
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

# Handle relative vs standalone execution imports
try:
    from .preprocess import load_and_validate_dataset, normalize_sinhala_text
    from .feature_extraction import (
        PEDAGOGICAL_MARK_MAP,
        count_akuru,
        count_pillam,
        extract_features,
        get_akuru_units,
        get_detected_mark_details,
    )
except ImportError:
    current_dir = Path(__file__).resolve().parent
    if str(current_dir) not in sys.path:
        sys.path.insert(0, str(current_dir))
    from preprocess import load_and_validate_dataset, normalize_sinhala_text
    from feature_extraction import (
        PEDAGOGICAL_MARK_MAP,
        count_akuru,
        count_pillam,
        extract_features,
        get_akuru_units,
        get_detected_mark_details,
    )


TEST_EXAMPLES = [
    "රෝද",
    "අයියා",
    "පාසල්",
    "තාත්තා",
    "මගේ",
    "පොත",
    "අම්මා",
    "කෑම",
    "ගෙදර",
    "ක්‍රීඩා",
    "ශ්‍රී ලංකා",
]


def run_test_examples() -> None:
    """Prints detailed Unicode and pedagogical reading-mark analysis of core test examples."""
    print("\n" + "=" * 72)
    print("PEDAGOGICAL ORTHOGRAPHIC READING-MARK EVALUATION REPORT")
    print("=" * 72)
    for sample in TEST_EXAMPLES:
        normalized = normalize_sinhala_text(sample)
        chars_detail = [f"{ch} ({hex(ord(ch))})" for ch in normalized]
        akuru_units = get_akuru_units(normalized)
        a_count = count_akuru(normalized)
        p_count = count_pillam(normalized)
        details = get_detected_mark_details(normalized)

        print(f"Target Word:       {sample}")
        print(f"Normalized:        {normalized}")
        print(f"Unicode Chars:     {chars_detail}")
        print(f"Akuru Units:       {akuru_units} (akuru_count={a_count})")
        if details:
            print("Detected Marks:")
            for d in details:
                if d["is_compound"]:
                    print(f"  • {d['char']} [{d['sinhala_name']}] -> {' + '.join(d['components'])} (components={d['weight']})")
                else:
                    print(f"  • {d['char']} [{d['sinhala_name']}] (components=1)")
        else:
            print("Detected Marks:    None")
        print(f"Final pillam_count: {p_count}")
        print("-" * 72)


def validate_and_report(input_path: Path) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Loads, validates, extracts features, and prints comprehensive report."""
    print("\n" + "=" * 70)
    print("SINHALA TEXT DIFFICULTY DATASET VALIDATION REPORT")
    print("=" * 70)
    print(f"Input File: {input_path}")

    # Load and preprocess
    df, val_report = load_and_validate_dataset(input_path, preserve_raw=True)
    total_records = len(df)
    print(f"Total Records: {total_records}")

    # 1. Grade Distribution
    print("\n--- Grade Level Distribution ---")
    grade_counts = df["grade_level"].value_counts(dropna=False).sort_index()
    for grade, count in grade_counts.items():
        pct = (count / total_records) * 100
        print(f"  Grade {grade}: {count:5d} ({pct:5.1f}%)")

    # 2. Text Type Distribution
    print("\n--- Text Type Distribution ---")
    type_counts = df["text_type"].value_counts(dropna=False)
    for t_type, count in type_counts.items():
        pct = (count / total_records) * 100
        print(f"  {t_type:15s}: {count:5d} ({pct:5.1f}%)")

    # 3. Source Distribution
    unique_sources = df["source"].nunique(dropna=False)
    print(f"\n--- Source Distribution (Unique Sources: {unique_sources}) ---")
    source_counts = df["source"].value_counts(dropna=False)
    for src, count in source_counts.items():
        pct = (count / total_records) * 100
        print(f"  {src:<55s}: {count:4d} ({pct:4.1f}%)")

    # 4. Data Quality & Integrity Checks
    print("\n--- Data Integrity & Cleanliness Checks ---")
    print(f"  Blank / Invalid sinhala_text Count: {val_report['blank_text_count']}")
    if val_report['blank_text_ids']:
        print(f"    Affected IDs: {val_report['blank_text_ids']}")

    print(f"  Duplicate sinhala_text Count:       {val_report['duplicate_text_count']}")
    if val_report['duplicate_texts']:
        print(f"    Duplicate Texts: {val_report['duplicate_texts']}")

    print(f"  Missing grade_level Count:          {val_report['missing_grade_count']}")
    if val_report['missing_grade_ids']:
        print(f"    Affected IDs: {val_report['missing_grade_ids']}")

    print(f"  Suspicious / Invalid Rows:          {len(val_report['suspicious_rows'])}")
    if val_report['suspicious_rows']:
        for row_issue in val_report['suspicious_rows']:
            print(f"    Row {row_issue['row_index']} (ID {row_issue['id']}): {row_issue['issue']}")
    else:
        print("    None detected. All rows satisfy integrity requirements.")

    # 5. Calculate akuru_count and pillam_count
    akuru_series = df["sinhala_text"].apply(count_akuru)
    pillam_series = df["sinhala_text"].apply(count_pillam)

    print("\n--- Feature Statistics (Extracted Features) ---")
    print("  Akuru Count (Orthographic Syllables):")
    print(f"    Min:    {akuru_series.min()}")
    print(f"    Max:    {akuru_series.max()}")
    print(f"    Mean:   {akuru_series.mean():.2f}")
    print(f"    Median: {akuru_series.median():.1f}")

    print("  Pillam Count (Dependent Vowel Signs):")
    print(f"    Min:    {pillam_series.min()}")
    print(f"    Max:    {pillam_series.max()}")
    print(f"    Mean:   {pillam_series.mean():.2f}")
    print(f"    Median: {pillam_series.median():.1f}")

    # Attach computed features to dataframe
    df["akuru_count"] = akuru_series
    df["pillam_count"] = pillam_series

    print("=" * 70)
    return df, val_report


def export_processed_csv(df: pd.DataFrame, output_path: Path, input_path: Path) -> None:
    """
    Exports processed dataframe to a NEW CSV file without modifying original workbook.

    - Overwriting raw input workbook is strictly prevented.
    - Populates akuru_count and pillam_count.
    - Keeps word_frequency_level unchanged / empty (NaN).
    - Preserves unpopulated label columns without inventing labels:
      initial_difficulty_label, final_difficulty_level, split_needed,
      simplification_needed, simplified_text, max_support_level.
      (max_retries_per_level is removed; supports have no fixed retry limit).
    """
    # Strict safety check: Never overwrite original workbook
    if output_path.resolve() == input_path.resolve():
        raise ValueError(
            f"Safety Violation: Cannot overwrite the original input file '{input_path}'!"
        )

    # Ensure output parent directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Retain the exact column structure of the original dataset
    # Drop intermediate tracking column if added
    output_df = df.copy()
    if "original_sinhala_text" in output_df.columns:
        output_df = output_df.drop(columns=["original_sinhala_text"])

    # max_retries_per_level is removed from processed schema:
    # progressive supports have no fixed retry limit in the application
    if "max_retries_per_level" in output_df.columns:
        output_df = output_df.drop(columns=["max_retries_per_level"])

    # Explicitly ensure unpopulated label columns remain empty (not generated)
    label_cols = [
        "word_frequency_level",
        "initial_difficulty_label",
        "final_difficulty_level",
        "split_needed",
        "simplification_needed",
        "simplified_text",
        "max_support_level",
    ]
    for col in label_cols:
        if col in output_df.columns:
            output_df[col] = pd.NA

    output_df.to_csv(output_path, index=False, encoding="utf-8")
    print(f"\n[SUCCESS] Processed dataset successfully exported to: {output_path}")
    print(f"  Rows exported: {len(output_df)}")
    print(f"  Populated feature columns: akuru_count, pillam_count")
    print(f"  Preserved empty columns: {', '.join(label_cols)}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate Sinhala text difficulty dataset and extract linguistic features."
    )
    parser.add_argument(
        "--input",
        type=str,
        help="Path to raw dataset (.xlsx or .csv)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Optional path to output processed CSV file",
    )
    parser.add_argument(
        "--test-examples",
        action="store_true",
        help="Run and display linguistic analysis for predefined test examples",
    )

    args = parser.parse_args()

    if args.test_examples and not args.input:
        run_test_examples()
        return

    if not args.input:
        parser.print_help()
        sys.exit(1)

    input_file = Path(args.input)
    if not input_file.exists():
        print(f"Error: Input file does not exist at '{input_file}'", file=sys.stderr)
        sys.exit(1)

    processed_df, _ = validate_and_report(input_file)

    if args.test_examples:
        run_test_examples()

    if args.output:
        output_file = Path(args.output)
        export_processed_csv(processed_df, output_file, input_file)


if __name__ == "__main__":
    main()
