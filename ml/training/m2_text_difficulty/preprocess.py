"""
preprocess.py
=============
Module 2: Sinhala Text Difficulty Analysis & Progressive Reading Support
Researcher: Edirisooriya H. S. (IT23179844)

Provides reusable preprocessing, normalization, and raw dataset validation
for Sinhala educational texts (words and short sentences).

Key Functions:
- normalize_sinhala_text(text): Reusable Unicode NFC normalization & whitespace cleaning.
- is_valid_sinhala_text(text): Detects blank, non-string, or non-Sinhala rows.
- load_and_validate_dataset(filepath, preserve_raw=True): Loads XLSX/CSV, verifies required
  schema, flags blank/duplicate rows, and preserves raw text for traceability.
"""

from __future__ import annotations

import unicodedata
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import pandas as pd


# ---------------------------------------------------------------------------
# Required Schema for Raw Datasets
# ---------------------------------------------------------------------------
REQUIRED_COLUMNS: List[str] = [
    "id",
    "sinhala_text",
    "text_type",
    "source",
    "grade_level",
]

# Unicode block ranges and special joiners for Sinhala:
# Sinhala Unicode block: U+0D80 - U+0DFF
# Zero Width Joiner (ZWJ): U+200D (crucial for yansaya, rakaransaya, repaya, bandi akuru)
# Zero Width Non-Joiner (ZWNJ): U+200C (prevents ligature formation where grammatically needed)
SINHALA_CHAR_PATTERN = re.compile(r"[\u0D80-\u0DFF]")
WHITESPACE_COLLAPSE_PATTERN = re.compile(r"[\s\u00A0\u2000-\u200B\uFEFF]+")


def normalize_sinhala_text(text: Any) -> str:
    """
    Normalizes Sinhala text using Unicode Canonical Composition (NFC).

    Preservation & Cleaning Rules:
    1. Returns empty string if input is None, NaN, or non-string.
    2. Applies Unicode NFC normalization (combines decomposed vowel sign sequences
       into canonical precomposed forms, e.g., kombuva + aela-pilla -> kombuva-saha-aela-pilla).
    3. Collapses repeated whitespaces (including non-breaking spaces and tabs) into a single space.
    4. Trims leading and trailing whitespace.
    5. Preserves legitimate Unicode joiners (ZWJ U+200D, ZWNJ U+200C) essential
       for Sinhala conjuncts (e.g., rakaransaya, yansaya, bandi akuru).
    6. Preserves all valid Sinhala characters, combining marks, and standard punctuation.
    7. Does NOT transliterate or aggressively strip unmapped characters.

    Args:
        text: Input string (or raw object).

    Returns:
        Cleaned, NFC-normalized Sinhala text.
    """
    if text is None or pd.isna(text):
        return ""

    if not isinstance(text, str):
        text = str(text)

    # Step 1: Unicode NFC Normalization
    normalized = unicodedata.normalize("NFC", text)

    # Step 2: Collapse repeated whitespace & non-breaking spaces
    collapsed = WHITESPACE_COLLAPSE_PATTERN.sub(" ", normalized)

    # Step 3: Trim leading and trailing whitespace
    cleaned = collapsed.strip()

    return cleaned


def is_valid_sinhala_text(text: Any) -> Tuple[bool, str]:
    """
    Validates whether an input represents valid Sinhala text.

    Args:
        text: Text to evaluate.

    Returns:
        Tuple of (is_valid: bool, reason: str).
    """
    if text is None or pd.isna(text):
        return False, "Text is null or NaN"

    if not isinstance(text, str):
        return False, f"Expected string, got {type(text).__name__}"

    cleaned = text.strip()
    if not cleaned:
        return False, "Text is blank or empty"

    if not SINHALA_CHAR_PATTERN.search(cleaned):
        return False, "Text contains no Sinhala characters (U+0D80-U+0DFF)"

    return True, "Valid"


def load_and_validate_dataset(
    filepath: Union[str, Path],
    preserve_raw: bool = True,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Loads an XLSX or CSV dataset and verifies mandatory columns, data cleanliness,
    and row integrity.

    - Verifies required columns: id, sinhala_text, text_type, source, grade_level.
    - Preserves original raw sinhala_text for traceability in 'original_sinhala_text'.
    - Normalizes sinhala_text using normalize_sinhala_text.
    - Detects blank, non-string, or non-Sinhala text rows.
    - Detects duplicate sinhala_text values.
    - Does NOT require currently empty model feature or label columns to contain values.

    Args:
        filepath: Path to Excel (.xlsx) or CSV (.csv) file.
        preserve_raw: If True, adds 'original_sinhala_text' preserving unmodified inputs.

    Returns:
        Tuple of (validated_df, validation_report_dict).
    """
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"Dataset file not found at: {path}")

    # Load file based on extension
    suffix = path.suffix.lower()
    if suffix in [".xlsx", ".xls"]:
        df = pd.read_excel(path)
    elif suffix == ".csv":
        df = pd.read_csv(path)
    else:
        raise ValueError(f"Unsupported file format '{suffix}'. Expected .xlsx, .xls, or .csv")

    # Validate mandatory columns
    missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_columns:
        raise ValueError(
            f"Dataset is missing mandatory column(s): {missing_columns}. "
            f"Required: {REQUIRED_COLUMNS}"
        )

    # Initialize tracking
    report: Dict[str, Any] = {
        "filepath": str(path),
        "total_records": len(df),
        "missing_columns": missing_columns,
        "blank_text_count": 0,
        "blank_text_ids": [],
        "duplicate_text_count": 0,
        "duplicate_texts": [],
        "missing_grade_count": 0,
        "missing_grade_ids": [],
        "suspicious_rows": [],
    }

    # Preserve raw text if requested
    if preserve_raw and "original_sinhala_text" not in df.columns:
        df["original_sinhala_text"] = df["sinhala_text"].copy()

    # Normalize sinhala_text and identify data issues
    normalized_texts: List[str] = []
    for idx, row in df.iterrows():
        raw_val = row["sinhala_text"]
        row_id = row["id"] if "id" in row else idx

        valid, reason = is_valid_sinhala_text(raw_val)
        if not valid:
            report["blank_text_count"] += 1
            report["blank_text_ids"].append(row_id)
            report["suspicious_rows"].append({
                "row_index": idx,
                "id": row_id,
                "issue": reason,
                "raw_text": raw_val,
            })
            norm_val = ""
        else:
            norm_val = normalize_sinhala_text(raw_val)

        # Missing grade check
        if pd.isna(row["grade_level"]):
            report["missing_grade_count"] += 1
            report["missing_grade_ids"].append(row_id)
            report["suspicious_rows"].append({
                "row_index": idx,
                "id": row_id,
                "issue": "Missing grade_level",
                "raw_text": raw_val,
            })

        normalized_texts.append(norm_val)

    # Update dataframe with normalized text
    df["sinhala_text"] = normalized_texts

    # Check for duplicates on normalized text (excluding blank strings)
    valid_series = df[df["sinhala_text"] != ""]["sinhala_text"]
    duplicated_mask = valid_series.duplicated(keep=False)
    dup_texts = valid_series[duplicated_mask].unique().tolist()
    report["duplicate_text_count"] = len(dup_texts)
    report["duplicate_texts"] = dup_texts

    return df, report
