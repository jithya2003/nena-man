"""
labeling_policy.py
==================
Module 2: Sinhala Text Difficulty Analysis & Progressive Reading Support
Researcher: Edirisooriya H. S. (IT23179844)

Hybrid System Architecture:
---------------------------
In this hybrid educational architecture:
1. Machine learning (Random Forest) is designed primarily to predict:
   - final_difficulty_level (Easy / Medium / Hard)
   after expert-reviewed labels become available.
2. Progressive reading support decisions operate as an interpretable, transparent
   pedagogical policy layer:
   - split_needed (Yes / No)
   - simplification_needed (Yes / No)
   - max_support_level (Level 3 or Level 4)
   - support_path (e.g. [1, 3], [1, 2, 3], [1, 3, 4], [1, 2, 3, 4])

Progressive Support Principles:
-------------------------------
- Highlight (Level 1) is the universal initial support stage for visual focus & tracking.
- Akuru / orthographic-unit split (Level 2) is an optional intermediate stage,
  controlled by split_needed. It breaks words/sentences into orthographic units.
- Audio Support (Level 3) is a universal fallback for EVERY usable item if the child
  continues struggling. Level 1 and Level 2 are intermediate stages, not terminal ceilings.
- Text Simplification (Level 4) is unlocked ONLY when simplification_needed == 'Yes'
  (reserved for complex sentences requiring syntactic/lexical reduction).
- Unlocked Audio Support may be replayed freely; there is no fixed retry or replay limit.
- Column max_retries_per_level has been removed from the schema.

Research & Validation Clarifications:
------------------------------------
- initial_difficulty_label is a RESEARCHER-DEFINED PROVISIONAL / PSEUDO-LABEL.
- It is NOT expert-validated ground truth.
- It is NOT a clinical label.
- akuru_count is an operational "Unicode-aware Sinhala orthographic-unit count"
  (and not a verified linguistic syllable count).
- pillam_count is an operational educational orthographic reading-mark feature.
- Training a machine-learning model on provisional labels generated directly from
  the input features primarily evaluates whether the model can approximate the
  researcher-defined rule rubric. Model performance metrics must NOT be presented
  as empirical proof of educational or clinical validity.
- final_difficulty_level remains reserved for expert review and is NOT populated here.
- expert_validated remains unchanged ("No").
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import pandas as pd
import numpy as np


# ---------------------------------------------------------------------------
# Support Tier Definitions
# ---------------------------------------------------------------------------
# Level 1: Visual Highlighting (Initial stage for focus and word tracking)
# Level 2: Akuru / Orthographic-Unit Split (Intermediate segmentation stage)
# Level 3: Audio Support (Universal fallback for all usable items)
# Level 4: Text Simplification (Highest ceiling for complex sentences)
SUPPORT_NAMES: Dict[int, str] = {
    1: "Highlight",
    2: "Akuru Split",
    3: "Audio Support",
    4: "Text Simplification",
}


def calculate_initial_difficulty(
    grade_level: int,
    akuru_count: int,
    pillam_count: int,
    word_frequency_level: Optional[Union[int, float]],
    text_type: str,
) -> Tuple[Optional[int], Optional[str]]:
    """
    Computes provisional difficulty using Rubric A (Composite Point Index, 0-8).

    Inputs:
    - grade_level: Primary grade (1, 2, or 3).
    - akuru_count: Unicode-aware Sinhala orthographic-unit count.
    - pillam_count: Operational educational reading-mark count.
    - word_frequency_level: 1 (Common), 2 (Medium), 3 (Rare). If missing/NaN, returns (None, None).
    - text_type: 'word' or 'short sentence'.

    Points:
    - Grade points: Grade 1 -> 0, Grade 2 -> 1, Grade 3 -> 2
    - Frequency points: Level 1 -> 0, Level 2 -> 1, Level 3 -> 2
    - Words:
        akuru_count: <= 2 -> 0; 3-4 -> 1; >= 5 -> 2
        pillam_count: <= 1 -> 0; 2-3 -> 1; >= 4 -> 2
    - Short sentences:
        akuru_count: <= 10 -> 0; 11-15 -> 1; >= 16 -> 2
        pillam_count: <= 6 -> 0; 7-10 -> 1; >= 11 -> 2

    Total Score:
    - 0 to 2 -> 'Easy'
    - 3 to 5 -> 'Medium'
    - 6 to 8 -> 'Hard'

    Returns:
    - (difficulty_score, initial_difficulty_label) or (None, None) if frequency is missing.
    """
    if word_frequency_level is None or pd.isna(word_frequency_level):
        return None, None

    freq_int = int(word_frequency_level)
    if freq_int not in (1, 2, 3):
        return None, None

    # Grade points
    grade_pts = {1: 0, 2: 1, 3: 2}.get(int(grade_level), 0)

    # Frequency points
    freq_pts = {1: 0, 2: 1, 3: 2}.get(freq_int, 0)

    # Text-type specific linguistic points
    clean_type = str(text_type).strip().lower()
    if clean_type == "word":
        # Akuru points for words
        if akuru_count <= 2:
            akuru_pts = 0
        elif akuru_count <= 4:
            akuru_pts = 1
        else:
            akuru_pts = 2

        # Pillam points for words
        if pillam_count <= 1:
            pillam_pts = 0
        elif pillam_count <= 3:
            pillam_pts = 1
        else:
            pillam_pts = 2
    else:
        # Akuru points for short sentences
        if akuru_count <= 10:
            akuru_pts = 0
        elif akuru_count <= 15:
            akuru_pts = 1
        else:
            akuru_pts = 2

        # Pillam points for short sentences
        if pillam_count <= 6:
            pillam_pts = 0
        elif pillam_count <= 10:
            pillam_pts = 1
        else:
            pillam_pts = 2

    score = grade_pts + freq_pts + akuru_pts + pillam_pts

    if score <= 2:
        label = "Easy"
    elif score <= 5:
        label = "Medium"
    else:
        label = "Hard"

    return score, label


def calculate_split_needed(
    akuru_count: int,
    pillam_count: int,
    text_type: str,
) -> str:
    """
    Determines whether Akuru / orthographic-unit split is needed (Candidate S2).

    Candidate S2 (Length-Gated Orthographic Trigger):
    - For Words:
        'Yes' if akuru_count >= 4
        OR (akuru_count >= 3 AND pillam_count >= 3)
        Otherwise 'No'.
    - For Short Sentences:
        'Yes' if akuru_count >= 15
        OR pillam_count >= 10
        Otherwise 'No'.

    Note: Difficulty label itself does NOT directly trigger splitting.
    Short 2-akuru words (e.g. ලේන්, පොල්, ලොකු) do not receive splitting under S2,
    preserving cohesive visual recognition.

    Returns:
    - 'Yes' or 'No'
    """
    clean_type = str(text_type).strip().lower()
    if clean_type == "word":
        if akuru_count >= 4:
            return "Yes"
        if akuru_count >= 3 and pillam_count >= 3:
            return "Yes"
        return "No"
    else:
        if akuru_count >= 15 or pillam_count >= 10:
            return "Yes"
        return "No"


def calculate_simplification_needed(
    initial_difficulty_label: Optional[str],
    akuru_count: int,
    pillam_count: int,
    word_frequency_level: Optional[Union[int, float]],
    text_type: str,
) -> str:
    """
    Determines whether sentence simplification is needed (Candidate T2).

    Rules:
    - Words: Always 'No'. (Single words must never receive sentence simplification).
    - Short Sentences:
        'Yes' only if:
            initial_difficulty_label == 'Hard'
            AND at least one of:
                akuru_count >= 16
                pillam_count >= 11
                word_frequency_level == 3
        Otherwise 'No'.

    Returns:
    - 'Yes' or 'No'
    """
    clean_type = str(text_type).strip().lower()
    if clean_type == "word":
        return "No"

    if initial_difficulty_label == "Hard":
        freq_is_3 = False
        if word_frequency_level is not None and not pd.isna(word_frequency_level):
            freq_is_3 = (int(word_frequency_level) == 3)

        if akuru_count >= 16 or pillam_count >= 11 or freq_is_3:
            return "Yes"

    return "No"


def calculate_max_support_level(
    simplification_needed: Optional[str] = None,
    initial_difficulty_label: Optional[str] = None,
    split_needed: Optional[str] = None,
    word_frequency_level: Optional[Union[int, float]] = None,
) -> Optional[int]:
    """
    Determines the terminal progressive support ceiling under the universal audio fallback policy.

    Architecture & Policy:
    - Audio Support (Level 3) is a universal fallback for EVERY usable word or sentence
      if the child continues struggling after earlier stages.
    - Level 1 (Highlight) and Level 2 (Akuru / orthographic-unit split) serve as
      initial and intermediate support stages, not terminal support ceilings.
    - Level 3 (Audio Support) can be replayed freely without fixed retry limits.
    - Level 4 (Text Simplification) is unlocked ONLY when simplification_needed == 'Yes'.

    Rules:
    - If simplification_needed is None or NaN (Pending row) -> returns None.
    - If simplification_needed == 'Yes' -> max_support_level = 4
    - Otherwise -> max_support_level = 3

    Returns:
    - 3, 4, or None if row is pending.
    """
    if simplification_needed is None or pd.isna(simplification_needed):
        return None

    if str(simplification_needed).strip() == "Yes":
        return 4

    return 3


def get_support_path(
    split_needed: Optional[str],
    simplification_needed: Optional[str],
    max_support_level: Optional[int],
) -> List[int]:
    """
    Constructs the ordered sequence of progressive supports a child can traverse
    upon repeated reading difficulties.

    Support Progression:
    - Stage 1: Highlight (Always base initial support for visual focus)
    - Stage 2: Akuru / orthographic-unit split (Included if split_needed == 'Yes')
    - Stage 3: Audio Support (Universal fallback; included in all complete paths)
    - Stage 4: Text Simplification (Included if max_support_level == 4 AND simplification_needed == 'Yes')

    Valid Paths:
    - split_needed = No,  simplification_needed = No,  max_support_level = 3 -> [1, 3]
    - split_needed = Yes, simplification_needed = No,  max_support_level = 3 -> [1, 2, 3]
    - split_needed = No,  simplification_needed = Yes, max_support_level = 4 -> [1, 3, 4]
    - split_needed = Yes, simplification_needed = Yes, max_support_level = 4 -> [1, 2, 3, 4]

    Pending Rows:
    - Returns []
    """
    if max_support_level is None or pd.isna(max_support_level):
        return []

    path: List[int] = [1]

    if split_needed == "Yes":
        path.append(2)

    path.append(3)

    if int(max_support_level) >= 4 and simplification_needed == "Yes":
        path.append(4)

    return path


def run_internal_assertions() -> None:
    """
    Validates core support path behavior and boundary cases via assertions.
    """
    # Universal audio fallback paths
    assert get_support_path("No", "No", 3) == [1, 3], "split=No, simp=No -> [1, 3] failed"
    assert get_support_path("Yes", "No", 3) == [1, 2, 3], "split=Yes, simp=No -> [1, 2, 3] failed"
    assert get_support_path("No", "Yes", 4) == [1, 3, 4], "split=No, simp=Yes -> [1, 3, 4] failed"
    assert get_support_path("Yes", "Yes", 4) == [1, 2, 3, 4], "split=Yes, simp=Yes -> [1, 2, 3, 4] failed"
    assert get_support_path("No", "No", None) == [], "pending path failed"

    # Max support policy assertions
    assert calculate_max_support_level("Yes") == 4
    assert calculate_max_support_level("No") == 3
    assert calculate_max_support_level(None) is None

    # Split S2 boundary assertions
    assert calculate_split_needed(2, 3, "word") == "No", "2-akuru word like ලේන් must not split"
    assert calculate_split_needed(4, 1, "word") == "Yes", "4-akuru word must split"
    assert calculate_split_needed(3, 3, "word") == "Yes", "3-akuru + 3-pillam word must split"
    assert calculate_split_needed(14, 9, "short sentence") == "No", "14 akuru + 9 pillam sentence must not split under S2"
    assert calculate_split_needed(15, 8, "short sentence") == "Yes", "15 akuru sentence must split under S2"

    # Simplification T2 boundary assertions
    assert calculate_simplification_needed("Hard", 5, 4, 3, "word") == "No", "Words must never simplify"
    assert calculate_simplification_needed("Medium", 18, 12, 3, "short sentence") == "No", "Medium sentences must not simplify"
    assert calculate_simplification_needed("Hard", 16, 8, 2, "short sentence") == "Yes", "Hard 16-akuru sentence must simplify"


def calculate_provisional_labels(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies the researcher-defined provisional labeling policy to a dataset DataFrame in memory.

    Does NOT modify the source file or populate final ground-truth columns.
    Identifies rows with missing frequency (e.g. ID 804) and marks them as 'Pending'.
    """
    results: List[Dict[str, Any]] = []

    for _, row in df.iterrows():
        row_id = row.get("id")
        sinhala_text = row.get("sinhala_text")
        text_type = str(row.get("text_type", "")).strip().lower()
        grade_level = row.get("grade_level")
        akuru_count = int(row.get("akuru_count", 0))
        pillam_count = int(row.get("pillam_count", 0))
        freq_raw = row.get("word_frequency_level")

        # Check for OOV / missing frequency
        if freq_raw is None or pd.isna(freq_raw):
            results.append({
                "id": row_id,
                "sinhala_text": sinhala_text,
                "text_type": text_type,
                "grade_level": grade_level,
                "akuru_count": akuru_count,
                "pillam_count": pillam_count,
                "word_frequency_level": np.nan,
                "difficulty_score": np.nan,
                "initial_difficulty_label": None,
                "split_needed": None,
                "simplification_needed": None,
                "max_support_level": None,
                "support_path": [],
                "labeling_status": "Pending (Missing / OOV Frequency)",
            })
            continue

        freq_val = int(freq_raw)

        # 1. Provisional Difficulty (Rubric A)
        diff_score, diff_label = calculate_initial_difficulty(
            grade_level=grade_level,
            akuru_count=akuru_count,
            pillam_count=pillam_count,
            word_frequency_level=freq_val,
            text_type=text_type,
        )

        # 2. Split Needed (S2)
        split_needed = calculate_split_needed(
            akuru_count=akuru_count,
            pillam_count=pillam_count,
            text_type=text_type,
        )

        # 3. Simplification Needed (T2)
        simplification_needed = calculate_simplification_needed(
            initial_difficulty_label=diff_label,
            akuru_count=akuru_count,
            pillam_count=pillam_count,
            word_frequency_level=freq_val,
            text_type=text_type,
        )

        # 4. Max Support Level (Universal Audio Fallback Policy)
        max_support = calculate_max_support_level(
            simplification_needed=simplification_needed,
            initial_difficulty_label=diff_label,
            split_needed=split_needed,
            word_frequency_level=freq_val,
        )

        # 5. Support Path
        path = get_support_path(
            split_needed=split_needed,
            simplification_needed=simplification_needed,
            max_support_level=max_support,
        )

        results.append({
            "id": row_id,
            "sinhala_text": sinhala_text,
            "text_type": text_type,
            "grade_level": grade_level,
            "akuru_count": akuru_count,
            "pillam_count": pillam_count,
            "word_frequency_level": freq_val,
            "difficulty_score": diff_score,
            "initial_difficulty_label": diff_label,
            "split_needed": split_needed,
            "simplification_needed": simplification_needed,
            "max_support_level": max_support,
            "support_path": path,
            "labeling_status": "Complete",
        })

    return pd.DataFrame(results)


def populate_processed_dataset(
    csv_path: Union[str, Path] = "ml/data/sinhala_text_difficulty_processed.csv",
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Updates ONLY max_support_level in the processed CSV using the universal audio fallback policy.

    Universal Audio Fallback Policy:
    - Audio Support (Level 3) is a universal fallback for every usable item.
    - Level 1 (Highlight) and Level 2 (Akuru split) are intermediate stages, not terminal ceilings.
    - If simplification_needed == 'Yes' -> max_support_level = 4
    - Otherwise -> max_support_level = 3
    - Row ID 804 (OOV token) remains Pending (blank / NaN).

    Integrity Safeguards:
    - Preserves in-memory copy of original CSV before modification.
    - Does NOT regenerate or alter initial_difficulty_label, split_needed, or simplification_needed.
    - Preserves final_difficulty_level as 100% blank (reserved for expert review).
    - Preserves simplified_text as 100% blank.
    - Preserves expert_validated as unchanged ("No").
    - Confirms max_retries_per_level remains absent.
    - Verifies all integrity constraints upon reload.
    """
    target_path = Path(csv_path)
    if not target_path.exists():
        raise FileNotFoundError(f"Processed CSV not found at: {target_path}")

    # 1. Load original and keep in-memory backup
    df_orig = pd.read_csv(target_path)
    df_backup = df_orig.copy(deep=True)

    # 2. Prepare new dataframe
    df_new = df_orig.copy(deep=True)

    # Ensure max_retries_per_level is removed if present
    if "max_retries_per_level" in df_new.columns:
        df_new = df_new.drop(columns=["max_retries_per_level"])

    # 3. Update ONLY max_support_level
    max_sups: List[Any] = []
    for _, row in df_new.iterrows():
        f_raw = row.get("word_frequency_level")
        simp_raw = row.get("simplification_needed")
        if pd.isna(f_raw) or f_raw is None or pd.isna(simp_raw) or simp_raw is None:
            max_sups.append(pd.NA)
        else:
            simp_val = str(simp_raw).strip()
            max_sup_val = calculate_max_support_level(simplification_needed=simp_val)
            max_sups.append(max_sup_val)

    df_new["max_support_level"] = pd.Series(max_sups, dtype="Int64")
    df_new["word_frequency_level"] = df_new["word_frequency_level"].astype("Int64")

    # Explicitly guarantee final_difficulty_level and simplified_text remain blank
    df_new["final_difficulty_level"] = pd.NA
    df_new["simplified_text"] = pd.NA

    # 4. Save to CSV
    df_new.to_csv(target_path, index=False, encoding="utf-8")

    # 5. Reload from disk to perform strict integrity validation
    df_reloaded = pd.read_csv(target_path)

    # 6. Execute strict integrity checks
    checks: Dict[str, bool] = {}

    # Check 1: Total rows remain exactly 822
    checks["1. row_count_822"] = (len(df_reloaded) == 822)

    # Check 2: Row order and IDs remain unchanged
    checks["2. ids_and_order_identical"] = bool((df_reloaded["id"] == df_backup["id"]).all())

    # Check 3: sinhala_text is 100% unchanged
    checks["3. sinhala_text_unchanged"] = bool((df_reloaded["sinhala_text"] == df_backup["sinhala_text"]).all())

    # Check 4: text_type, source, grade_level unchanged
    checks["4. metadata_unchanged"] = bool(
        (df_reloaded["text_type"] == df_backup["text_type"]).all()
        and (df_reloaded["source"] == df_backup["source"]).all()
        and (df_reloaded["grade_level"] == df_backup["grade_level"]).all()
    )

    # Check 5: akuru_count and pillam_count unchanged
    checks["5. akuru_pillam_unchanged"] = bool(
        (df_reloaded["akuru_count"] == df_backup["akuru_count"]).all()
        and (df_reloaded["pillam_count"] == df_backup["pillam_count"]).all()
    )

    # Check 6: word_frequency_level unchanged (accounting for NaN)
    freq_matches = (df_reloaded["word_frequency_level"].fillna(-999) == df_backup["word_frequency_level"].fillna(-999)).all()
    checks["6. word_frequency_unchanged"] = bool(freq_matches)

    # Check 7: initial_difficulty_label unchanged
    diff_matches = (df_reloaded["initial_difficulty_label"].fillna("") == df_backup["initial_difficulty_label"].fillna("")).all()
    checks["7. initial_difficulty_unchanged"] = bool(diff_matches)

    # Check 8: split_needed unchanged
    split_matches = (df_reloaded["split_needed"].fillna("") == df_backup["split_needed"].fillna("")).all()
    checks["8. split_needed_unchanged"] = bool(split_matches)

    # Check 9: simplification_needed unchanged
    simp_matches = (df_reloaded["simplification_needed"].fillna("") == df_backup["simplification_needed"].fillna("")).all()
    checks["9. simplification_needed_unchanged"] = bool(simp_matches)

    # Check 10: final_difficulty_level remains 100% blank
    checks["10. final_difficulty_blank"] = bool(df_reloaded["final_difficulty_level"].isna().all())

    # Check 11: simplified_text remains 100% blank
    checks["11. simplified_text_blank"] = bool(df_reloaded["simplified_text"].isna().all())

    # Check 12: expert_validated unchanged
    checks["12. expert_validated_unchanged"] = bool((df_reloaded["expert_validated"] == df_backup["expert_validated"]).all())

    # Check 13: max_retries_per_level remains absent
    checks["13. max_retries_absent"] = ("max_retries_per_level" not in df_reloaded.columns)

    # Check 14: Row 804 has all provisional labels blank
    r804 = df_reloaded[df_reloaded["id"] == 804].iloc[0]
    checks["14. row_804_all_provisional_blank"] = bool(
        pd.isna(r804["word_frequency_level"])
        and pd.isna(r804["initial_difficulty_label"])
        and pd.isna(r804["split_needed"])
        and pd.isna(r804["simplification_needed"])
        and pd.isna(r804["max_support_level"])
    )

    # Check 15: Usable row counts match new universal audio fallback distributions
    usable = df_reloaded[df_reloaded["word_frequency_level"].notna()].copy()
    sup_c = usable["max_support_level"].value_counts().to_dict()

    checks["15. max_support_distributions"] = bool(
        len(usable) == 821
        and sup_c.get(3) == 742
        and sup_c.get(4) == 79
        and sup_c.get(1, 0) == 0
        and sup_c.get(2, 0) == 0
    )

    # Check 16: Validate support path distribution
    paths = [
        get_support_path(
            split_needed=r["split_needed"],
            simplification_needed=r["simplification_needed"],
            max_support_level=r["max_support_level"],
        )
        for _, r in usable.iterrows()
    ]
    path_strs = pd.Series([str(p) for p in paths])
    path_counts = path_strs.value_counts().to_dict()

    checks["16. support_paths_valid"] = bool(
        path_counts.get("[1, 3]") == 427
        and path_counts.get("[1, 2, 3]") == 315
        and path_counts.get("[1, 3, 4]") == 10
        and path_counts.get("[1, 2, 3, 4]") == 69
        and path_counts.get("[1]", 0) == 0
        and path_counts.get("[1, 2]", 0) == 0
    )

    failed_checks = [k for k, v in checks.items() if not v]
    if failed_checks:
        raise AssertionError(f"Integrity check failed on: {failed_checks}")

    return df_reloaded, checks


def main() -> None:
    """
    Executes labeling policy dry-run, or updates max_support_level when --populate is provided.
    """
    import argparse
    parser = argparse.ArgumentParser(description="Provisional Labeling & Progressive Support Policy")
    parser.add_argument(
        "--populate",
        action="store_true",
        help="Update max_support_level in ml/data/sinhala_text_difficulty_processed.csv to universal audio fallback policy",
    )
    parser.add_argument(
        "--csv",
        type=str,
        default="ml/data/sinhala_text_difficulty_processed.csv",
        help="Path to processed CSV file",
    )
    args = parser.parse_args()

    # Always run sanity checks first
    run_internal_assertions()

    if args.populate:
        print("====================================================================")
        print(" UPDATING MAX_SUPPORT_LEVEL (UNIVERSAL AUDIO FALLBACK POLICY)")
        print("====================================================================")
        reloaded_df, checks = populate_processed_dataset(args.csv)

        print("\nAll Integrity Checks Passed:")
        for k, v in checks.items():
            print(f"  [PASS] {k}")

        usable_df = reloaded_df[reloaded_df["word_frequency_level"].notna()].copy()
        print(f"\nFinal Schema Columns ({len(reloaded_df.columns)}):")
        print(f"  {reloaded_df.columns.tolist()}\n")

        print("--- Updated max_support_level Distribution (N = 821) ---")
        sup_counts = usable_df["max_support_level"].value_counts().sort_index()
        sup_pcts = (usable_df["max_support_level"].value_counts(normalize=True) * 100).sort_index()
        for lvl in [1, 2, 3, 4]:
            count = sup_counts.get(lvl, 0)
            pct = sup_pcts.get(lvl, 0.0)
            name = SUPPORT_NAMES.get(lvl, "")
            print(f"  Level {lvl} ({name:19s}): {count:3d} ({pct:.2f}%)")

        print("\n--- Support Paths Observed (N = 821) ---")
        paths = [
            get_support_path(
                split_needed=r["split_needed"],
                simplification_needed=r["simplification_needed"],
                max_support_level=r["max_support_level"],
            )
            for _, r in usable_df.iterrows()
        ]
        usable_df["support_path"] = paths
        usable_df["path_str"] = usable_df["support_path"].apply(str)
        path_counts = usable_df["path_str"].value_counts()
        path_pcts = (usable_df["path_str"].value_counts(normalize=True) * 100)
        for p_str, count in path_counts.items():
            pct = path_pcts[p_str]
            print(f"  {p_str:14s}: {count:3d} ({pct:.2f}%)")

        print("\nConfirmation: Terminal Level 1 ([1]) and Level 2 ([1, 2]) counts:")
        print(f"  Count of [1]   : {usable_df['path_str'].isin(['[1]']).sum()}")
        print(f"  Count of [1, 2]: {usable_df['path_str'].isin(['[1, 2]']).sum()}")

        print("\n--- Spot Check IDs (2, 12, 97, 184, 284, 310, 456, 504, 515, 804) ---")
        spot_ids = [2, 12, 97, 184, 284, 310, 456, 504, 515, 804]
        spot_df = reloaded_df[reloaded_df["id"].isin(spot_ids)].copy()
        spot_df["sort_order"] = spot_df["id"].map({id_val: i for i, id_val in enumerate(spot_ids)})
        spot_df = spot_df.sort_values("sort_order")

        for _, r in spot_df.iterrows():
            f_val = "blank" if pd.isna(r["word_frequency_level"]) else f"{int(r['word_frequency_level'])}"
            l_val = "blank" if pd.isna(r["initial_difficulty_label"]) else str(r["initial_difficulty_label"])
            sp_val = "blank" if pd.isna(r["split_needed"]) else str(r["split_needed"])
            sm_val = "blank" if pd.isna(r["simplification_needed"]) else str(r["simplification_needed"])
            mx_val = "blank" if pd.isna(r["max_support_level"]) else f"{int(r['max_support_level'])}"
            p_val = get_support_path(
                split_needed=None if pd.isna(r["split_needed"]) else str(r["split_needed"]),
                simplification_needed=None if pd.isna(r["simplification_needed"]) else str(r["simplification_needed"]),
                max_support_level=None if pd.isna(r["max_support_level"]) else int(r["max_support_level"]),
            )

            print(f"ID {r['id']:3d} | '{r['sinhala_text']}' | {r['text_type']} | Grd {r['grade_level']} | "
                  f"akuru: {r['akuru_count']:2d}, pillam: {r['pillam_count']:2d}, freq: {f_val} | "
                  f"Diff: {l_val:7s} | Split: {sp_val:3s} | Simp: {sm_val:3s} | "
                  f"MaxSup: {mx_val:2s} | Path: {p_val}")

    else:
        print("Internal assertions passed successfully.\n")
        csv_path = args.csv
        df = pd.read_csv(csv_path)

        labeled_df = calculate_provisional_labels(df)

        total_rows = len(labeled_df)
        usable_df = labeled_df[labeled_df["labeling_status"] == "Complete"].copy()
        pending_df = labeled_df[labeled_df["labeling_status"] != "Complete"].copy()

        usable_count = len(usable_df)
        pending_count = len(pending_df)
        pending_ids = pending_df["id"].tolist()

        print("====================================================================")
        print(" DRY-RUN PROVISIONAL LABELING REPORT (UNIVERSAL AUDIO FALLBACK)")
        print("====================================================================")
        print(f"Total rows:   {total_rows}")
        print(f"Usable rows:  {usable_count}")
        print(f"Pending rows: {pending_count}")
        print(f"Pending IDs:  {pending_ids}\n")

        # Difficulty Distribution
        print("--- 1. initial_difficulty_label (Rubric A) ---")
        diff_counts = usable_df["initial_difficulty_label"].value_counts()[["Easy", "Medium", "Hard"]]
        diff_pcts = (usable_df["initial_difficulty_label"].value_counts(normalize=True) * 100)[["Easy", "Medium", "Hard"]]
        for k in ["Easy", "Medium", "Hard"]:
            print(f"  {k:7s}: {diff_counts[k]:3d} ({diff_pcts[k]:.2f}%)")

        # Split Needed Distribution
        print("\n--- 2. split_needed (Candidate S2) ---")
        split_counts = usable_df["split_needed"].value_counts()[["Yes", "No"]]
        split_pcts = (usable_df["split_needed"].value_counts(normalize=True) * 100)[["Yes", "No"]]
        for k in ["Yes", "No"]:
            print(f"  {k:3s}: {split_counts[k]:3d} ({split_pcts[k]:.2f}%)")

        # Simplification Needed Distribution
        print("\n--- 3. simplification_needed (Candidate T2) ---")
        simp_counts = usable_df["simplification_needed"].value_counts()[["Yes", "No"]]
        simp_pcts = (usable_df["simplification_needed"].value_counts(normalize=True) * 100)[["Yes", "No"]]
        for k in ["Yes", "No"]:
            print(f"  {k:3s}: {simp_counts[k]:3d} ({simp_pcts[k]:.2f}%)")

        # Max Support Level Distribution
        print("\n--- 4. max_support_level (Universal Audio Fallback) ---")
        sup_counts = usable_df["max_support_level"].value_counts().sort_index()
        sup_pcts = (usable_df["max_support_level"].value_counts(normalize=True) * 100).sort_index()
        for lvl in [1, 2, 3, 4]:
            count = sup_counts.get(lvl, 0)
            pct = sup_pcts.get(lvl, 0.0)
            name = SUPPORT_NAMES.get(lvl, "")
            print(f"  Level {lvl} ({name:19s}): {count:3d} ({pct:.2f}%)")

        # Support Path Distribution
        print("\n--- 5. Support Paths Observed ---")
        usable_df["path_str"] = usable_df["support_path"].apply(str)
        print(usable_df["path_str"].value_counts())

        # Spot Check IDs
        spot_ids = [2, 12, 97, 184, 284, 310, 456, 504, 515, 804]
        sample_df = labeled_df[labeled_df["id"].isin(spot_ids)].copy()
        sample_df["sort_order"] = sample_df["id"].map({id_val: i for i, id_val in enumerate(spot_ids)})
        sample_df = sample_df.sort_values("sort_order")

        print("\n====================================================================")
        print(f" REPRESENTATIVE TEST ROWS (N = {len(sample_df)})")
        print("====================================================================")
        for _, r in sample_df.iterrows():
            f_val = "blank" if pd.isna(r["word_frequency_level"]) else f"{int(r['word_frequency_level'])}"
            l_val = "blank" if pd.isna(r["initial_difficulty_label"]) else str(r["initial_difficulty_label"])
            sp_val = "blank" if pd.isna(r["split_needed"]) else str(r["split_needed"])
            sm_val = "blank" if pd.isna(r["simplification_needed"]) else str(r["simplification_needed"])
            mx_val = "blank" if pd.isna(r["max_support_level"]) else f"{int(r['max_support_level'])}"
            pt_val = str(r["support_path"])

            print(f"ID {r['id']:3d} | '{r['sinhala_text']}' | {r['text_type']} | Grd {r['grade_level']} | "
                  f"akuru: {r['akuru_count']:2d}, pillam: {r['pillam_count']:2d}, freq: {f_val} | "
                  f"Diff: {l_val:7s} | Split: {sp_val:3s} | Simp: {sm_val:3s} | "
                  f"MaxSup: {mx_val:2s} | Path: {pt_val}")


if __name__ == "__main__":
    main()
