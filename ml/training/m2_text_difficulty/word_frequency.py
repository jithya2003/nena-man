"""
word_frequency.py
=================
Module 2: Sinhala Text Difficulty Analysis & Progressive Reading Support
Researcher: Edirisooriya H. S. (IT23179844)

Provides reusable Sinhala word-frequency loading, tokenization, joiner-normalized
lexical equivalence aggregation, and corpus lookup.

Uses the 2M Sinhala corpus frequency list:
  ml/data/sinhala_frequency/word_frequency_list_2M.si

Joiner-Equivalence Normalization:
---------------------------------
In Sinhala orthography and digital typing, equivalent lexical words are frequently
represented with or without Unicode joiners (Zero-Width Joiner ZWJ U+200D and
Zero-Width Non-Joiner ZWNJ U+200C), e.g.:
  - 'ක්‍රීඩා' (with ZWJ) has 29,714 occurrences in 2M corpus.
  - 'ක්රීඩා' (without ZWJ) has 409 occurrences in 2M corpus.
  - 'ශ්‍රී' (with ZWJ) has 230,851 occurrences in 2M corpus.
  - 'ශ්රී' (without ZWJ) has 989 occurrences in 2M corpus.

To ensure robust reading-difficulty modelling:
1. The displayed/original Sinhala token retains its exact NFC-normalized form.
2. A joiner-stripped lexical key is derived by stripping U+200D and U+200C.
3. Equivalent corpus entries sharing the same lexical key are aggregated.
4. Frequencies of all equivalent forms are summed into a combined 'effective_frequency'.
   Example:
     effective_frequency('ක්රීඩා') == effective_frequency('ක්‍රීඩා') == 30,123.
     effective_frequency('ශ්රී') == effective_frequency('ශ්‍රී') == 231,840.
5. Unknown words remain unknown if no lexical equivalent is present.
"""

from __future__ import annotations

import re
import sys
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import pandas as pd
import numpy as np

# Handle relative vs standalone execution imports
try:
    from .preprocess import normalize_sinhala_text
except ImportError:
    current_dir = Path(__file__).resolve().parent
    if str(current_dir) not in sys.path:
        sys.path.insert(0, str(current_dir))
    from preprocess import normalize_sinhala_text


# ---------------------------------------------------------------------------
# Default Resource Paths
# ---------------------------------------------------------------------------
DEFAULT_FREQUENCY_LIST_PATH = Path("ml/data/sinhala_frequency/word_frequency_list_2M.si")
DEFAULT_VERIFIED_LIST_PATH = Path("ml/data/sinhala_frequency/verified_word_list_200K.si")
DEFAULT_PROCESSED_DATASET_PATH = Path("ml/data/sinhala_text_difficulty_processed.csv")

# Unicode Joiners to strip when building lexical equivalence keys
JOINER_STRIP_PATTERN = re.compile(r"[\u200D\u200C]")

# Tokenization regex for Sinhala words:
# Captures contiguous Sinhala script characters (U+0D80-U+0DFF) and Unicode joiners (U+200D, U+200C).
# Ignores punctuation, numbers, and surrounding whitespace.
SINHALA_WORD_TOKEN_PATTERN = re.compile(r"[\u0D80-\u0DFF\u200D\u200C]+")


def strip_joiners(text: str) -> str:
    """
    Derives a joiner-normalized lexical key by removing ZWJ (U+200D) and ZWNJ (U+200C).
    Always normalizes to Unicode NFC first.

    Args:
        text: Input Sinhala word or token.

    Returns:
        Joiner-stripped lexical string.
    """
    if not text:
        return ""
    norm = unicodedata.normalize("NFC", text)
    return JOINER_STRIP_PATTERN.sub("", norm)


class SinhalaFrequencyCorpus:
    """
    In-memory representation of the Sinhala corpus frequency data with
    joiner-normalized lexical equivalence aggregation.
    """

    def __init__(self) -> None:
        # Maps exact NFC string -> exact raw corpus frequency
        self.raw_frequency_map: Dict[str, int] = {}
        # Maps joiner-stripped lexical key -> {
        #   'effective_frequency': int,
        #   'forms': {exact_nfc_form: count, ...}
        # }
        self.lexical_index: Dict[str, Dict[str, Any]] = {}

    def add_entry(self, word: str, frequency: int) -> None:
        """Adds a raw word-frequency entry and updates the aggregated lexical index."""
        norm_word = unicodedata.normalize("NFC", word)
        self.raw_frequency_map[norm_word] = frequency

        key = strip_joiners(norm_word)
        if key not in self.lexical_index:
            self.lexical_index[key] = {
                "effective_frequency": frequency,
                "forms": {norm_word: frequency},
            }
        else:
            self.lexical_index[key]["effective_frequency"] += frequency
            self.lexical_index[key]["forms"][norm_word] = frequency

    def __len__(self) -> int:
        return len(self.raw_frequency_map)

    def lookup(self, word: str) -> Dict[str, Any]:
        """
        Looks up a word using joiner-equivalence aggregation.

        Args:
            word: Target Sinhala word.

        Returns:
            Dictionary containing:
            - 'word': Original input string
            - 'nfc_word': Exact NFC-normalized token
            - 'lexical_key': Joiner-stripped key
            - 'exact_frequency': Exact frequency in corpus (or None)
            - 'effective_frequency': Summed frequency across equivalent forms (or None)
            - 'equivalent_forms': Dict of matching forms in corpus (or {})
            - 'is_matched': True if found in corpus
        """
        nfc_word = normalize_sinhala_text(word)
        lex_key = strip_joiners(nfc_word)

        exact_freq = self.raw_frequency_map.get(nfc_word)
        lex_entry = self.lexical_index.get(lex_key)

        if lex_entry is not None:
            effective_freq = lex_entry["effective_frequency"]
            forms = dict(lex_entry["forms"])
            is_matched = True
        else:
            effective_freq = None
            forms = {}
            is_matched = False

        return {
            "word": word,
            "nfc_word": nfc_word,
            "lexical_key": lex_key,
            "exact_frequency": exact_freq,
            "effective_frequency": effective_freq,
            "equivalent_forms": forms,
            "is_matched": is_matched,
        }


def load_frequency_list(
    path: Union[str, Path] = DEFAULT_FREQUENCY_LIST_PATH,
) -> SinhalaFrequencyCorpus:
    """
    Loads a Sinhala frequency list into a SinhalaFrequencyCorpus index.

    Supports both formats:
    - 3-column: 'word POS_TAG frequency' (word_frequency_list_2M.si)
    - 2-column: 'word frequency' (verified_word_list_200K.si)

    Args:
        path: Path to frequency text file.

    Returns:
        SinhalaFrequencyCorpus object with exact and joiner-aggregated indices.
    """
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"Frequency resource file not found: {file_path}")

    corpus = SinhalaFrequencyCorpus()
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line_str = line.strip()
            if not line_str:
                continue
            parts = line_str.split()
            if len(parts) >= 3:
                try:
                    freq = int(parts[2])
                    corpus.add_entry(parts[0], freq)
                except ValueError:
                    continue
            elif len(parts) == 2:
                try:
                    freq = int(parts[1])
                    corpus.add_entry(parts[0], freq)
                except ValueError:
                    continue

    return corpus


def tokenize_sinhala_words(text: Any) -> List[str]:
    """
    Tokenizes Sinhala text into word tokens:
    - Unicode NFC canonical composition.
    - Preserves all Sinhala base letters, dependent vowel signs, virama, and joiners.
    - Excludes punctuation, digits, and surrounding whitespace.
    - Does not transliterate or spell-correct words.

    Args:
        text: Sinhala word or sentence string.

    Returns:
        List of cleaned Sinhala word tokens.
    """
    norm = normalize_sinhala_text(text)
    if not norm:
        return []
    return SINHALA_WORD_TOKEN_PATTERN.findall(norm)


def lookup_word_frequency(
    word: str,
    corpus: Union[SinhalaFrequencyCorpus, Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Looks up a single Sinhala word returning exact and effective lexical frequencies.

    Args:
        word: Sinhala word string.
        corpus: Preloaded SinhalaFrequencyCorpus instance.

    Returns:
        Dictionary with lookup details.
    """
    if isinstance(corpus, SinhalaFrequencyCorpus):
        return corpus.lookup(word)
    # Fallback if raw dict passed
    nfc = normalize_sinhala_text(word)
    key = strip_joiners(nfc)
    freq = corpus.get(nfc) or corpus.get(key)
    return {
        "word": word,
        "nfc_word": nfc,
        "lexical_key": key,
        "exact_frequency": corpus.get(nfc),
        "effective_frequency": freq,
        "equivalent_forms": {nfc: freq} if freq is not None else {},
        "is_matched": freq is not None,
    }


def get_text_frequency_details(
    text: Any,
    corpus: SinhalaFrequencyCorpus,
) -> Dict[str, Any]:
    """
    Analyzes frequency characteristics of words in a sentence or phrase using
    joiner-normalized effective frequencies.

    For short sentences:
    - Tokenizes all Sinhala words.
    - Looks up each token's effective lexical frequency.
    - Identifies the matched token with the lowest corpus frequency (rarest word).
    - Identifies any unmatched tokens separately.

    Args:
        text: Sinhala text (word or short sentence).
        corpus: Preloaded SinhalaFrequencyCorpus instance.

    Returns:
        Dictionary containing:
        - 'original_text': Input string
        - 'normalized_text': NFC-normalized string
        - 'tokens': List of extracted word tokens
        - 'token_details': List of lookup dictionaries per token
        - 'matched_tokens': List of matched tokens
        - 'unmatched_tokens': List of unmatched tokens
        - 'coverage_ratio': Ratio of matched tokens (0.0 to 1.0)
        - 'rarest_token': Token with the lowest effective frequency (or None)
        - 'rarest_effective_frequency': Lowest effective frequency (or None)
    """
    norm_text = normalize_sinhala_text(text)
    tokens = tokenize_sinhala_words(norm_text)

    token_details: List[Dict[str, Any]] = []
    matched_tokens: List[str] = []
    unmatched_tokens: List[str] = []

    for t in tokens:
        detail = corpus.lookup(t)
        token_details.append(detail)
        if detail["is_matched"]:
            matched_tokens.append(t)
        else:
            unmatched_tokens.append(t)

    coverage_ratio = (
        len(matched_tokens) / len(tokens) if tokens else 1.0
    )

    matched_details = [d for d in token_details if d["is_matched"]]
    if matched_details:
        rarest_detail = min(matched_details, key=lambda d: d["effective_frequency"])
        rarest_token = rarest_detail["nfc_word"]
        rarest_effective_frequency = rarest_detail["effective_frequency"]
    else:
        rarest_token = None
        rarest_effective_frequency = None

    return {
        "original_text": text,
        "normalized_text": norm_text,
        "tokens": tokens,
        "token_details": token_details,
        "matched_tokens": matched_tokens,
        "unmatched_tokens": unmatched_tokens,
        "coverage_ratio": coverage_ratio,
        "rarest_token": rarest_token,
        "rarest_effective_frequency": rarest_effective_frequency,
    }


# ---------------------------------------------------------------------------
# CLI / Self-Test & Read-Only Analysis
# ---------------------------------------------------------------------------
def run_test_item_comparisons(corpus: SinhalaFrequencyCorpus) -> None:
    """Prints joiner-equivalence comparison for user-specified test items."""
    test_cases = [
        "ක්රීඩා",
        "ක්‍රීඩා",
        "ශ්රී",
        "ශ්‍රී",
        "ශ්රී ලංකා",
        "ශ්‍රී ලංකා",
        "ක්රීඩා පිටිය",
        "ක්‍රීඩා පිටිය",
        "මම පාසලට යනවා.",
        "අපි ගෙවත්තේ එළවළු වගා කරමු.",
    ]

    print("\n" + "=" * 76)
    print("JOINER-NORMALIZED FREQUENCY LOOKUP COMPARISON TESTS")
    print("=" * 76)

    for item in test_cases:
        details = get_text_frequency_details(item, corpus)
        print(f"Original Text:       '{details['original_text']}'")
        print(f"NFC Form:            '{details['normalized_text']}'")
        print(f"Tokens:              {details['tokens']}")

        print("Token Breakdown:")
        for td in details["token_details"]:
            exact_f_str = f"{td['exact_frequency']:,}" if td['exact_frequency'] is not None else "UNMATCHED"
            eff_f_str = f"{td['effective_frequency']:,}" if td['effective_frequency'] is not None else "UNMATCHED"
            forms_str = ", ".join([f"'{k}': {v:,}" for k, v in td['equivalent_forms'].items()]) or "None"
            print(f"  • Token: '{td['nfc_word']}'")
            print(f"    Lexical Key (no joiners): '{td['lexical_key']}'")
            print(f"    Exact Corpus Frequency:   {exact_f_str}")
            print(f"    Equivalent Forms Found:   [{forms_str}]")
            print(f"    Combined/Effective Freq:  {eff_f_str}")

        if len(details["tokens"]) > 1:
            rarest_str = (
                f"'{details['rarest_token']}' ({details['rarest_effective_frequency']:,})"
                if details['rarest_effective_frequency'] is not None
                else "None"
            )
            print(f"Sentence Rarest Token: {rarest_str}")

        print("-" * 76)


def run_dataset_readonly_analysis(
    dataset_path: Path,
    corpus: SinhalaFrequencyCorpus,
) -> None:
    """Performs non-destructive, read-only analysis of our 822-row dataset."""
    print("\n" + "=" * 76)
    print("READ-ONLY DATASET FREQUENCY ANALYSIS (822 RECORDS - JOINER AGGREGATED)")
    print("=" * 76)
    print(f"Dataset Path: {dataset_path}")

    df = pd.read_csv(dataset_path)
    total_rows = len(df)
    print(f"Total Rows:   {total_rows}")

    all_tokens: List[str] = []
    row_analyses: List[Dict[str, Any]] = []

    for idx, row in df.iterrows():
        details = get_text_frequency_details(row["sinhala_text"], corpus)
        all_tokens.extend(details["tokens"])
        row_analyses.append({
            "id": row["id"],
            "text": row["sinhala_text"],
            "text_type": row["text_type"],
            "grade_level": row["grade_level"],
            "details": details,
        })

    # Token uniqueness & coverage
    unique_tokens = sorted(list(set(all_tokens)))
    matched_unique = [t for t in unique_tokens if corpus.lookup(t)["is_matched"]]
    unmatched_unique = [t for t in unique_tokens if not corpus.lookup(t)["is_matched"]]
    unique_coverage_pct = (len(matched_unique) / len(unique_tokens)) * 100

    # Row-level coverage
    complete_coverage_rows = sum(
        1 for r in row_analyses if len(r["details"]["unmatched_tokens"]) == 0
    )
    row_coverage_pct = (complete_coverage_rows / total_rows) * 100

    print(f"\n--- Token Coverage Statistics ---")
    print(f"Total Unique Sinhala Tokens:     {len(unique_tokens):,}")
    print(f"Matched Unique Tokens:           {len(matched_unique):,}")
    print(f"Unmatched Unique Tokens:         {len(unmatched_unique):,}")
    print(f"Unique-Token Coverage Rate:      {unique_coverage_pct:.2f}%")
    print(f"Rows with Complete Token Match:  {complete_coverage_rows} / {total_rows} ({row_coverage_pct:.2f}%)")

    # Matched unique token frequency distribution (effective frequency)
    matched_effective_freqs = np.array([
        corpus.lookup(t)["effective_frequency"] for t in matched_unique
    ])
    print(f"\n--- Matched Token Frequency Distribution (Effective Frequencies) ---")
    print(f"  Minimum:         {matched_effective_freqs.min():,}")
    print(f"  Maximum:         {matched_effective_freqs.max():,}")
    print(f"  Mean:            {matched_effective_freqs.mean():,.2f}")
    print(f"  Median (50th %): {np.median(matched_effective_freqs):,.1f}")
    print(f"  10th Percentile: {np.percentile(matched_effective_freqs, 10):,.1f}")
    print(f"  25th Percentile: {np.percentile(matched_effective_freqs, 25):,.1f}")
    print(f"  50th Percentile: {np.percentile(matched_effective_freqs, 50):,.1f}")
    print(f"  75th Percentile: {np.percentile(matched_effective_freqs, 75):,.1f}")
    print(f"  90th Percentile: {np.percentile(matched_effective_freqs, 90):,.1f}")
    print(f"  95th Percentile: {np.percentile(matched_effective_freqs, 95):,.1f}")

    # Unmatched Tokens
    print(f"\n--- All Unmatched Dataset Tokens ({len(unmatched_unique)}) ---")
    if unmatched_unique:
        for tok in unmatched_unique:
            containing_rows = [r for r in row_analyses if tok in r["details"]["tokens"]]
            for cr in containing_rows:
                print(f"  • Token '{tok}' found in Row ID {cr['id']} ('{cr['text']}')")
    else:
        print("  None. 100% of tokens matched.")

    # Short sentence rarest-token distribution
    sentence_rows = [r for r in row_analyses if r["text_type"] == "short sentence"]
    sentence_rarest_freqs = [
        r["details"]["rarest_effective_frequency"]
        for r in sentence_rows
        if r["details"]["rarest_effective_frequency"] is not None
    ]
    s_sent = np.array(sentence_rarest_freqs)

    print(f"\n--- Short Sentence Rarest-Token Effective Frequency Distribution ({len(sentence_rows)} sentences) ---")
    print(f"  Minimum:         {s_sent.min():,}")
    print(f"  Maximum:         {s_sent.max():,}")
    print(f"  Mean:            {s_sent.mean():,.2f}")
    print(f"  Median (50th %): {np.median(s_sent):,.1f}")
    print(f"  10th Percentile: {np.percentile(s_sent, 10):,.1f}")
    print(f"  25th Percentile: {np.percentile(s_sent, 25):,.1f}")
    print(f"  50th Percentile: {np.percentile(s_sent, 50):,.1f}")
    print(f"  75th Percentile: {np.percentile(s_sent, 75):,.1f}")
    print(f"  90th Percentile: {np.percentile(s_sent, 90):,.1f}")
    print(f"  95th Percentile: {np.percentile(s_sent, 95):,.1f}")

    # Recalculate 3 Candidate Schemes across all 822 dataset items
    # (single words use their word frequency; short sentences use their rarest token frequency)
    dataset_effective_freqs = [
        r["details"]["rarest_effective_frequency"]
        if r["details"]["rarest_effective_frequency"] is not None
        else 0
        for r in row_analyses
    ]
    s_all = np.array(dataset_effective_freqs)

    print(f"\n" + "=" * 76)
    print("RECALCULATED CANDIDATE FREQUENCY SCHEMES (822 DATASET ITEMS)")
    print("=" * 76)

    # Candidate 1: Fixed Empirical Thresholds
    c1_common = sum(1 for f in s_all if f >= 5000)
    c1_medium = sum(1 for f in s_all if 500 <= f < 5000)
    c1_rare = sum(1 for f in s_all if f < 500)
    print("Candidate 1 (Fixed Empirical Thresholds):")
    print("  Thresholds: Common >= 5,000 | Medium: 500 - 4,999 | Rare: < 500")
    print(f"  Common (1): {c1_common:3d} ({c1_common/total_rows*100:5.2f}%)")
    print(f"  Medium (2): {c1_medium:3d} ({c1_medium/total_rows*100:5.2f}%)")
    print(f"  Rare   (3): {c1_rare:3d} ({c1_rare/total_rows*100:5.2f}%)")

    # Candidate 2: Log Order-of-Magnitude Thresholds
    c2_common = sum(1 for f in s_all if f >= 10000)
    c2_medium = sum(1 for f in s_all if 300 <= f < 10000)
    c2_rare = sum(1 for f in s_all if f < 300)
    print("\nCandidate 2 (Log Order-of-Magnitude):")
    print("  Thresholds: Common >= 10,000 | Medium: 300 - 9,999 | Rare: < 300")
    print(f"  Common (1): {c2_common:3d} ({c2_common/total_rows*100:5.2f}%)")
    print(f"  Medium (2): {c2_medium:3d} ({c2_medium/total_rows*100:5.2f}%)")
    print(f"  Rare   (3): {c2_rare:3d} ({c2_rare/total_rows*100:5.2f}%)")

    # Candidate 3: Balanced Dataset Terciles
    t1 = np.percentile(s_all, 33.3)
    t2 = np.percentile(s_all, 66.7)
    c3_common = sum(1 for f in s_all if f >= t2)
    c3_medium = sum(1 for f in s_all if t1 <= f < t2)
    c3_rare = sum(1 for f in s_all if f < t1)
    print(f"\nCandidate 3 (Balanced Dataset Terciles):")
    print(f"  Thresholds: Common >= {t2:.0f} | Medium: {t1:.0f} - {t2-1:.0f} | Rare: < {t1:.0f}")
    print(f"  Common (1): {c3_common:3d} ({c3_common/total_rows*100:5.2f}%)")
    print(f"  Medium (2): {c3_medium:3d} ({c3_medium/total_rows*100:5.2f}%)")
    print(f"  Rare   (3): {c3_rare:3d} ({c3_rare/total_rows*100:5.2f}%)")
    print("=" * 76)


if __name__ == "__main__":
    print("Loading 2M Sinhala corpus frequency list and building joiner index...")
    corpus_idx = load_frequency_list(DEFAULT_FREQUENCY_LIST_PATH)
    print(f"Successfully loaded {len(corpus_idx):,} raw entries across {len(corpus_idx.lexical_index):,} unique lexical keys.")

    run_test_item_comparisons(corpus_idx)
    run_dataset_readonly_analysis(DEFAULT_PROCESSED_DATASET_PATH, corpus_idx)
