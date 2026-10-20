"""
feature_extraction.py
=====================
Module 2: Sinhala Text Difficulty Analysis & Progressive Reading Support
Researcher: Edirisooriya H. S. (IT23179844)

Operational Definition of pillam_count:
----------------------------------------
In this research, 'pillam_count' is designed as an OPERATIONAL educational
orthographic-mark feature representing traditional Sinhala Pillam (dependent
vowel signs) plus Hal-Lakuna (U+0DCA '්') used for reading-difficulty modelling.

Anusvaraya (U+0D82 ං) and Visargaya (U+0D83 ඃ) are explicitly EXCLUDED from
pillam_count because they are not pillam; they may later be treated separately
as independent orthographic-complexity features if needed.

It represents the number of reading/orthographic marks we want the child
to process pedagogically:
1. Simple vowel signs (e.g., ා, ැ, ෑ, ි, ී, ු, ූ, ෘ, ෙ, ෟ) contribute 1 reading mark.
2. Compound vowel signs contribute the number of pedagogical components they
   represent to visual and phonetic decoding:
   - 'ේ' (Diga Kombuva) = Kombuva (ෙ) + Hal-Lakuna (්) -> 2 marks.
   - 'ො' (Kombuva Saha Aela-Pilla) = Kombuva (ෙ) + Aela-Pilla (ා) -> 2 marks.
   - 'ෝ' (Kombuva Saha Diga Aela-Pilla) = Kombuva (ෙ) + Diga Aela-Pilla (ෝ) -> 2 marks.
   - 'ෞ' (Kombuva Saha Gayanukitta) = Kombuva (ෙ) + Gayanukitta (ෟ) -> 2 marks.
   - 'ෛ' (Kombu Deka) = Kombuva (ෙ) + Kombuva (ෙ) -> 2 marks.
   - 'ෲ' (Diga Gaetta-Sahitha Paa-Pilla) = Gaetta-Sahitha Paa-Pilla (ෘ) + Aela-Pilla (ා) -> 2 marks.
   - 'ෳ' (Diga Gayanukitta) = Gayanukitta (ෟ) + Aela-Pilla (ා) -> 2 marks.
3. Hal-Lakuna / Al-Lakuna (U+0DCA '්') is counted as 1 reading mark because it
   mutes the inherent vowel, alters consonant pronunciation into a vowelless coda,
   and introduces substantial phonological and orthographic decoding complexity.
4. Independent vowels (අ, ආ, ඇ, ඈ, ඉ, ඊ, උ, ඌ, එ, ඒ, ඔ, ඕ etc.) are base letters,
   NOT diacritics/pillam, and therefore contribute 0 to pillam_count.
5. All rules are implemented via an explicit, transparent dictionary mapping
   (PEDAGOGICAL_MARK_MAP) rather than arbitrary continuous Unicode ranges.
"""

from __future__ import annotations

import re
import sys
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

# Handle local vs package imports seamlessly
try:
    from .preprocess import normalize_sinhala_text
except ImportError:
    # Fallback when run directly as a script
    current_dir = Path(__file__).resolve().parent
    if str(current_dir) not in sys.path:
        sys.path.insert(0, str(current_dir))
    from preprocess import normalize_sinhala_text


# ---------------------------------------------------------------------------
# Explicit Pedagogical Reading-Mark Specification (Operational Definition)
# ---------------------------------------------------------------------------
# This explicit mapping defines the exact educational reading marks recognized
# by the model, their constituent pedagogical components, and their difficulty weight.
# Raw Unicode ranges are avoided to guarantee linguistic transparency.
PEDAGOGICAL_MARK_MAP: Dict[str, Dict[str, Any]] = {
    # -----------------------------------------------------------------------
    # Hal-Lakuna / Al-Lakuna (U+0DCA ්)
    # Mutes inherent consonant vowel; crucial orthographic reading mark
    # -----------------------------------------------------------------------
    "\u0DCA": {
        "name": "SINHALA SIGN AL-LAKUNA",
        "sinhala_name": "හල් ලකුණ / අල්-ලකුණ (්)",
        "codepoint": "U+0DCA",
        "is_compound": False,
        "components": ["හල් ලකුණ (්)"],
        "weight": 1,
    },
    # -----------------------------------------------------------------------
    # Simple Sinhala Dependent Vowel Signs (1 pedagogical mark each)
    # -----------------------------------------------------------------------
    "\u0DCF": {
        "name": "SINHALA VOWEL SIGN AELA-PILLA",
        "sinhala_name": "ඇලපිල්ල (ා)",
        "codepoint": "U+0DCF",
        "is_compound": False,
        "components": ["ඇලපිල්ල (ා)"],
        "weight": 1,
    },
    "\u0DD0": {
        "name": "SINHALA VOWEL SIGN KETTI AEDA-PILLA",
        "sinhala_name": "කෙටි ඇදපිල්ල (ැ)",
        "codepoint": "U+0DD0",
        "is_compound": False,
        "components": ["කෙටි ඇදපිල්ල (ැ)"],
        "weight": 1,
    },
    "\u0DD1": {
        "name": "SINHALA VOWEL SIGN DIGA AEDA-PILLA",
        "sinhala_name": "දිග ඇදපිල්ල (ෑ)",
        "codepoint": "U+0DD1",
        "is_compound": False,
        "components": ["දිග ඇදපිල්ල (ෑ)"],
        "weight": 1,
    },
    "\u0DD2": {
        "name": "SINHALA VOWEL SIGN KETTI IS-PILLA",
        "sinhala_name": "කෙටි ඉස්පිල්ල (ි)",
        "codepoint": "U+0DD2",
        "is_compound": False,
        "components": ["කෙටි ඉස්පිල්ල (ි)"],
        "weight": 1,
    },
    "\u0DD3": {
        "name": "SINHALA VOWEL SIGN DIGA IS-PILLA",
        "sinhala_name": "දිග ඉස්පිල්ල (ී)",
        "codepoint": "U+0DD3",
        "is_compound": False,
        "components": ["දිග ඉස්පිල්ල (ී)"],
        "weight": 1,
    },
    "\u0DD4": {
        "name": "SINHALA VOWEL SIGN KETTI PAA-PILLA",
        "sinhala_name": "කෙටි පාපිල්ල (ු)",
        "codepoint": "U+0DD4",
        "is_compound": False,
        "components": ["කෙටි පාපිල්ල (ු)"],
        "weight": 1,
    },
    "\u0DD6": {
        "name": "SINHALA VOWEL SIGN DIGA PAA-PILLA",
        "sinhala_name": "දිග පාපිල්ල (ූ)",
        "codepoint": "U+0DD6",
        "is_compound": False,
        "components": ["දිග පාපිල්ල (ූ)"],
        "weight": 1,
    },
    "\u0DD8": {
        "name": "SINHALA VOWEL SIGN GAETTA-SAHITHA PAA-PILLA",
        "sinhala_name": "ගැට සහිත පාපිල්ල (ෘ)",
        "codepoint": "U+0DD8",
        "is_compound": False,
        "components": ["ගැට සහිත පාපිල්ල (ෘ)"],
        "weight": 1,
    },
    "\u0DD9": {
        "name": "SINHALA VOWEL SIGN KOMBUVA",
        "sinhala_name": "කොම්බුව (ෙ)",
        "codepoint": "U+0DD9",
        "is_compound": False,
        "components": ["කොම්බුව (ෙ)"],
        "weight": 1,
    },
    "\u0DDF": {
        "name": "SINHALA VOWEL SIGN GAYANUKITTA",
        "sinhala_name": "ගයනුකිත්ත (ෟ)",
        "codepoint": "U+0DDF",
        "is_compound": False,
        "components": ["ගයනුකිත්ත (ෟ)"],
        "weight": 1,
    },
    # -----------------------------------------------------------------------
    # Compound Sinhala Dependent Vowel Signs (multi-component pedagogical marks)
    # Contributes the number of visual/phonetic marks taught in primary education
    # -----------------------------------------------------------------------
    "\u0DDA": {
        "name": "SINHALA VOWEL SIGN DIGA KOMBUVA",
        "sinhala_name": "දිග කොම්බුව (ේ)",
        "codepoint": "U+0DDA",
        "is_compound": True,
        "components": ["කොම්බුව (ෙ)", "හල් ලකුණ (්)"],
        "weight": 2,
    },
    "\u0DDB": {
        "name": "SINHALA VOWEL SIGN KOMBU DEKA",
        "sinhala_name": "කොම්බු දෙක (ෛ)",
        "codepoint": "U+0DDB",
        "is_compound": True,
        "components": ["කොම්බුව (ෙ)", "කොම්බුව (ෙ)"],
        "weight": 2,
    },
    "\u0DDC": {
        "name": "SINHALA VOWEL SIGN KOMBUVA SAHA AELA-PILLA",
        "sinhala_name": "කොම්බුව සහ ඇලපිල්ල (ො)",
        "codepoint": "U+0DDC",
        "is_compound": True,
        "components": ["කොම්බුව (ෙ)", "ඇලපිල්ල (ා)"],
        "weight": 2,
    },
    "\u0DDD": {
        "name": "SINHALA VOWEL SIGN KOMBUVA SAHA DIGA AELA-PILLA",
        "sinhala_name": "කොම්බුව සහ දිග ඇලපිල්ල (ෝ)",
        "codepoint": "U+0DDD",
        "is_compound": True,
        "components": ["කොම්බුව (ෙ)", "දිග ඇලපිල්ල (ෝ)"],
        "weight": 2,
    },
    "\u0DDE": {
        "name": "SINHALA VOWEL SIGN KOMBUVA SAHA GAYANUKITTA",
        "sinhala_name": "කොම්බුව සහ ගයනුකිත්ත (ෞ)",
        "codepoint": "U+0DDE",
        "is_compound": True,
        "components": ["කොම්බුව (ෙ)", "ගයනුකිත්ත (ෟ)"],
        "weight": 2,
    },
    "\u0DF2": {
        "name": "SINHALA VOWEL SIGN DIGA GAETTA-SAHITHA PAA-PILLA",
        "sinhala_name": "දිග ගැට සහිත පාපිල්ල (ෲ)",
        "codepoint": "U+0DF2",
        "is_compound": True,
        "components": ["ගැට සහිත පාපිල්ල (ෘ)", "ඇලපිල්ල (ා)"],
        "weight": 2,
    },
    "\u0DF3": {
        "name": "SINHALA VOWEL SIGN DIGA GAYANUKITTA",
        "sinhala_name": "දිග ගයනුකිත්ත (ෳ)",
        "codepoint": "U+0DF3",
        "is_compound": True,
        "components": ["ගයනුකිත්ත (ෟ)", "ඇලපිල්ල (ා)"],
        "weight": 2,
    },
}

# Fast lookup set of registered pedagogical mark characters
PEDAGOGICAL_MARK_CHARS = set(PEDAGOGICAL_MARK_MAP.keys())


# ---------------------------------------------------------------------------
# Orthographic Syllable (Akura) Regex Specification
# ---------------------------------------------------------------------------
# Base letter: Independent Vowels (\u0D85-\u0D96) OR Consonants (\u0D9A-\u0DC6)
# Conjunct part: Virama (\u0DCA) + ZWJ (\u200D) + Consonant (\u0D9A-\u0DC6) [repeating]
# Trailing marks: Any attached Virama, Pillam, Anusvara (\u0D82), Visarga (\u0D83)
SINHALA_AKURU_PATTERN = re.compile(
    r"[\u0D85-\u0DC6]"                                      # Base letter
    r"(?:\u0DCA\u200D[\u0D9A-\u0DC6])*"                     # Optional ZWJ conjuncts
    r"(?:[\u0DCA\u0DCF-\u0DDF\u0DF2\u0DF3\u0D82\u0D83])*"  # Trailing signs/marks
)


# ---------------------------------------------------------------------------
# Core Reusable Feature Extraction Functions
# ---------------------------------------------------------------------------
def get_akuru_units(text: Any) -> List[str]:
    """
    Extracts individual Sinhala orthographic syllable units (akuru) from text.

    Args:
        text: Sinhala word or sentence.

    Returns:
        List of orthographic akuru strings (excluding whitespace and punctuation).
    """
    norm = normalize_sinhala_text(text)
    if not norm:
        return []
    return SINHALA_AKURU_PATTERN.findall(norm)


def count_akuru(text: Any) -> int:
    """
    Counts the number of Sinhala akuru (orthographic syllables) in a word or sentence.

    Guarantees:
    - len(text) is NEVER used.
    - Whitespace is ignored.
    - Punctuation (.,!? etc.) is ignored.
    - Dependent vowel signs (Pillam) do not count as separate akuru.
    - Combining marks (virama, anusvara, visarga) do not count as additional akuru.
    - Conjuncts with ZWJ (e.g. rakaransaya, yansaya) are treated as single composite akuru.
    - Works identically on single words and multi-word sentences.

    Args:
        text: Sinhala word or sentence.

    Returns:
        Integer akuru count.
    """
    return len(get_akuru_units(text))


def get_detected_mark_details(text: Any) -> List[Dict[str, Any]]:
    """
    Returns detailed pedagogical breakdowns of all orthographic reading marks
    detected in the input text.

    Args:
        text: Sinhala word or sentence.

    Returns:
        List of dictionaries detailing character, codepoint, name,
        constituent pedagogical components, and weight.
    """
    norm = normalize_sinhala_text(text)
    if not norm:
        return []

    detected: List[Dict[str, Any]] = []
    for ch in norm:
        if ch in PEDAGOGICAL_MARK_MAP:
            info = PEDAGOGICAL_MARK_MAP[ch]
            detected.append({
                "char": ch,
                "codepoint": info["codepoint"],
                "name": info["name"],
                "sinhala_name": info["sinhala_name"],
                "is_compound": info["is_compound"],
                "components": list(info["components"]),
                "weight": info["weight"],
            })
    return detected


def count_pillam(text: Any) -> int:
    """
    Counts the number of pedagogical orthographic reading marks in Sinhala text.

    OPERATIONAL RESEARCH DEFINITION:
    - Simple vowel signs contribute 1 reading mark.
    - Compound vowel signs contribute the number of constituent pedagogical
      components they represent (e.g., ේ -> 2, ො -> 2, ෝ -> 3).
    - Hal-Lakuna / Al-Lakuna (U+0DCA '්') contributes 1 reading mark.
    - Anusvaraya / Visargaya contribute 1 reading mark.
    - Independent vowels contribute 0 (they are base letters, not reading marks).

    Args:
        text: Sinhala word or sentence.

    Returns:
        Integer sum of pedagogical reading marks.
    """
    norm = normalize_sinhala_text(text)
    if not norm:
        return 0

    return sum(PEDAGOGICAL_MARK_MAP[ch]["weight"] for ch in norm if ch in PEDAGOGICAL_MARK_MAP)


def get_word_frequency_level(text: Any) -> Optional[float]:
    """
    Placeholder interface for Sinhala word frequency level.

    IMPORTANT NOTE:
    Do NOT invent arbitrary frequency levels. This interface is strictly a
    placeholder pending selection of a peer-reviewed, defensible Sinhala
    corpus frequency resource (e.g., Sinhala Lexicon / UCSC corpus frequency list).

    Returns:
        None (np.nan in tabular contexts).
    """
    return None


def extract_features(
    text: Any,
    grade_level: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Extracts all primary text difficulty features for model inference and training.

    Args:
        text: Sinhala word or short sentence.
        grade_level: Optional target grade level (1, 2, or 3).

    Returns:
        Dictionary containing:
        - 'normalized_text': Cleaned NFC Sinhala text
        - 'akuru_count': Integer orthographic syllable count
        - 'pillam_count': Integer operational pedagogical reading mark count
        - 'word_frequency_level': None (placeholder pending corpus selection)
        - 'grade_level': Target grade level (if supplied)
    """
    norm_text = normalize_sinhala_text(text)
    return {
        "normalized_text": norm_text,
        "akuru_count": count_akuru(norm_text),
        "pillam_count": count_pillam(norm_text),
        "word_frequency_level": get_word_frequency_level(norm_text),
        "grade_level": grade_level,
    }


# ---------------------------------------------------------------------------
# Self-Test Execution for Research Evaluation
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    evaluation_words = [
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

    print("=" * 72)
    print("PEDAGOGICAL ORTHOGRAPHIC READING-MARK EVALUATION")
    print("=" * 72)

    for word in evaluation_words:
        norm = normalize_sinhala_text(word)
        chars_detail = [f"{ch} ({hex(ord(ch))})" for ch in norm]
        details = get_detected_mark_details(norm)
        total_pillam = count_pillam(norm)

        # Format components list
        components_list: List[str] = []
        for d in details:
            if d["is_compound"]:
                comp_str = f"{d['char']} [{d['sinhala_name']}] -> {' + '.join(d['components'])} (components={d['weight']})"
            else:
                comp_str = f"{d['char']} [{d['sinhala_name']}] (components=1)"
            components_list.append(comp_str)

        print(f"Target Word:       {word}")
        print(f"Normalized:        {norm}")
        print(f"Unicode Chars:     {chars_detail}")
        if components_list:
            print("Detected Marks:")
            for item in components_list:
                print(f"  • {item}")
        else:
            print("Detected Marks:    None (No diacritic reading marks)")
        print(f"Final pillam_count: {total_pillam}")
        print("-" * 72)
