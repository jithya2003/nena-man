#!/usr/bin/env python3
"""
Production-Ready Inference Module for Sinhala Sentence Simplification (Model 2 Level 4).

Features:
- Loads frozen fine-tuned v2 adapter from ml/checkpoints/m2_text_simplification_v2/best_adapter/
- Uses google/mt5-small as base model
- Targetted at short child-facing application sentences
- Generates 4 beam candidates with length and repetition penalties
- Deterministic candidate cleaning (artifact and echoed prompt stripping)
- Candidate filtering & ranking based on fact, length, copy, and Latin/repetition checks
- Safe fallback (available=False, simplified_text=None) when candidates fail quality gates
"""

import os
import platform
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Ensure platform.mac_ver does not return empty string on macOS 26+ for truststore/dynamic loading
if platform.system() == "Darwin" and not platform.mac_ver()[0]:
    platform.mac_ver = lambda: ("26.2.0", ("", "", ""), "")

# Set offline flags by default for local execution
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

import torch
from peft import PeftModel
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_ADAPTER_PATH = REPO_ROOT / "ml" / "checkpoints" / "m2_text_simplification_v2" / "best_adapter"
DEFAULT_BASE_MODEL = "google/mt5-small"
DEFAULT_PREFIX = "simplify Sinhala: "


def get_device() -> torch.device:
    """Select MPS if available on macOS, otherwise CUDA or CPU."""
    if torch.backends.mps.is_available() and torch.backends.mps.is_built():
        return torch.device("mps")
    elif torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def contains_sinhala(text: str) -> bool:
    """Check whether text contains at least one Sinhala Unicode character (0x0D80 - 0x0DFF)."""
    return any(0x0D80 <= ord(c) <= 0x0DFF for c in text)


def clean_candidate(text: str, source_text: str) -> str:
    """
    Apply deterministic cleanup to a generated candidate.
    
    Permitted operations:
    - Strip whitespace and normalize multiple spaces
    - Remove stray special/sentinel tokens (<extra_id_N>, <pad>, </s>, <unk>)
    - Remove echoed task prefix ('simplify Sinhala:')
    - Remove leading non-Sinhala garbage preceding the first Sinhala character
      IF that non-Sinhala substring is not present in the source text.
    """
    # 1. Remove special tokens
    text = text.replace("<pad>", "").replace("</s>", "").replace("<unk>", "")
    text = re.sub(r"<\s*extra_id_\d+\s*>", " ", text)
    
    # 2. Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()
    
    # 3. Strip echoed task prefix
    text = re.sub(r"^(parameters\s+)?simplify\s+Sinhala:\s*", "", text, flags=re.IGNORECASE).strip()
    
    # 4. Remove leading non-Sinhala artifact prefix before the first Sinhala character
    sinhala_indices = [idx for idx, c in enumerate(text) if 0x0D80 <= ord(c) <= 0x0DFF]
    if sinhala_indices:
        first_sinhala_idx = sinhala_indices[0]
        if first_sinhala_idx > 0:
            leading_prefix = text[:first_sinhala_idx].strip()
            # If leading prefix contains characters not in source, strip it
            if leading_prefix and (leading_prefix not in source_text):
                text = text[first_sinhala_idx:].strip()

    # 5. Clean leading punctuation / brackets / quotation marks that were artifacts
    text = re.sub(r"^[\['\"`\(\{\-\s]+", "", text).strip()
    text = re.sub(r"\s+", " ", text).strip()
    
    return text


def is_valid_sinhala_start(text: str) -> bool:
    """Check that text does not begin with an invalid dependent vowel sign or virama."""
    for c in text:
        code = ord(c)
        if 0x0D80 <= code <= 0x0DFF:
            # 0x0DCA is virama/hal-lakuna; 0x0DCF-0x0DF3 are dependent vowel signs
            if code == 0x0DCA or (0x0DCF <= code <= 0x0DF3):
                return False
            return True
    return True


def has_repeated_3gram(text: str) -> bool:
    """Check if the text contains any repeated 3-gram word sequence."""
    words = text.split()
    if len(words) < 6:
        return False
    trigrams = [tuple(words[i:i+3]) for i in range(len(words) - 2)]
    return len(trigrams) != len(set(trigrams))


def has_unexplained_latin(cand_text: str, source_text: str) -> bool:
    """Check if candidate contains Latin alphabet letters when the source contains none."""
    source_has_latin = bool(re.search(r"[A-Za-z]", source_text))
    cand_has_latin = bool(re.search(r"[A-Za-z]", cand_text))
    return cand_has_latin and not source_has_latin


def has_malformed_chars(text: str, source_text: str) -> bool:
    """Check for foreign script characters (e.g. CJK, unexpected accents) not in source."""
    allowed_punct = set(" .,!?:;-\"'`()[]{}«»“”‘’/\n\t0123456789")
    for c in text:
        code = ord(c)
        if 0x0D80 <= code <= 0x0DFF:
            continue
        if c in allowed_punct or c in source_text:
            continue
        return True
    return False


def has_word_repetition(text: str) -> bool:
    """Check for immediate adjacent duplicate words (e.g. යුතු යුතුය or පාසල පාසල)."""
    words = [re.sub(r"[^\w\u0D80-\u0DFF]", "", w) for w in text.split()]
    for i in range(len(words) - 1):
        if words[i] and words[i] == words[i+1]:
            return True
    return False


def check_numeric_facts_preserved(source_text: str, cand_text: str) -> bool:
    """Ensure all numbers and number-words in source are retained in candidate."""
    src_digits = set(re.findall(r"\d+", source_text))
    cand_digits = set(re.findall(r"\d+", cand_text))
    if not src_digits.issubset(cand_digits):
        return False

    number_words = ["එක", "දෙක", "තුන", "හතර", "පහ", "හය", "හත", "අට", "නවය", "දහය"]
    for nw in number_words:
        if nw in source_text and nw not in cand_text:
            return False
    return True


def count_sentences(text: str) -> int:
    """Count non-empty sentences based on standard punctuation."""
    parts = [s.strip() for s in re.split(r"[\.!\?।॥\n]+", text) if s.strip()]
    return len(parts)


def checks_subject_preserved(source_text: str, cand_text: str) -> bool:
    """Check that short sentences do not drop their primary subject noun."""
    src_words = source_text.strip().split()
    if len(src_words) <= 6:
        first_word = re.sub(r"[^\w\u0D80-\u0DFF]", "", src_words[0])
        known_subjects = {"අම්මා", "ළමයි", "කුරුල්ලා", "නංගී", "බල්ලා", "ගුරුවරයා", "දරුවා", "ගොවියා"}
        if first_word in known_subjects and first_word not in cand_text:
            return False
    return True


# ---------------------------------------------------------------------------
# Removable function words (connectors / discourse markers) for short sentences
# Kept SMALL and DOCUMENTED as requested:
# ---------------------------------------------------------------------------
REMOVABLE_FUNCTION_WORDS = {
    "සඳහා",     # for / in order to (connector)
    "හේතුවෙන්", # due to / because of (causal connector)
    "බැවින්",    # since / because (connector)
    "විසින්",    # by (agentive postposition)
    "නිසා",      # because (causal connector)
    "පිණිස",     # for the purpose of (connector)
}


def normalize_sinhala_token(token: str) -> str:
    """Normalize a Sinhala token by stripping punctuation, whitespace, and zero-width characters."""
    t = re.sub(r'[\.,!?:\'"\-\(\)\[\]\{\};~`@#\$%\^&\*_\+=/<>\ufeff]+', '', token)
    t = re.sub(r'[\s\u200c\u200d\u00a0]+', '', t)
    return t.strip()


def check_truncated_tokens(src_tokens: List[str], cand_tokens: List[str]) -> Tuple[bool, Optional[str]]:
    """
    Detect if any generated token is a truncated fragment of a source token.
    e.g. source token 'යාම' -> generated token 'යා'.
    """
    src_set = set(src_tokens)
    for c in cand_tokens:
        if c in src_set:
            continue
        # Check against every source token
        for s in src_tokens:
            if len(s) > len(c) and len(c) >= 2 and s.startswith(c):
                return True, f"Malformed partial word: '{c}' is a truncated fragment of source token '{s}'"
    return False, None


def check_short_sentence_preservation(
    source_text: str,
    cand_text: str
) -> Tuple[bool, Optional[str]]:
    """
    Conservative meaning and content-word preservation check for short sentences (<= 10 words).
    - Checks predicate / action components are not deleted (e.g. 'යට' in 'යට විය')
    - Checks content tokens are not dropped
    - Checks truncated partial word fragments
    - Checks excessive novel token changes
    """
    src_raw_tokens = source_text.strip().split()
    if len(src_raw_tokens) > 10:
        return True, None  # Rule strictly applies to short inputs <= 10 words

    src_tokens = [normalize_sinhala_token(t) for t in src_raw_tokens if normalize_sinhala_token(t)]
    cand_tokens = [normalize_sinhala_token(t) for t in cand_text.strip().split() if normalize_sinhala_token(t)]

    if not src_tokens or not cand_tokens:
        return True, None

    src_set = set(src_tokens)
    cand_set = set(cand_tokens)

    # 1. Truncated fragment check (e.g. 'යාම' -> 'යා')
    is_trunc, trunc_msg = check_truncated_tokens(src_tokens, cand_tokens)
    if is_trunc:
        return False, trunc_msg

    # 2. Predicate / action components check
    # In Sinhala SOV sentences, the predicate/action verb is typically the final 1 or 2 tokens
    predicate_tokens = [t for t in src_tokens[-2:] if t not in REMOVABLE_FUNCTION_WORDS]
    for pt in predicate_tokens:
        if pt not in cand_set:
            return False, f"Predicate component '{pt}' deleted from short sentence"

    # 3. Content tokens coverage check
    # Treat all tokens not in REMOVABLE_FUNCTION_WORDS as content tokens
    src_content_tokens = [t for t in src_tokens if t not in REMOVABLE_FUNCTION_WORDS]
    missing_content = [t for t in src_content_tokens if t not in cand_set]

    if src_content_tokens:
        # In short sentences (<= 10 words), reject if any content token is deleted unexpectedly
        if len(src_raw_tokens) <= 7 and len(missing_content) > 0:
            return False, f"Meaning-damaging content token loss: '{missing_content[0]}' deleted from short sentence"
        elif len(missing_content) / len(src_content_tokens) > 0.15:
            return False, f"Excessive content token loss in short sentence (missing: {', '.join(missing_content)})"

    # 4. Novel tokens check in short sentences
    novel_tokens = [t for t in cand_tokens if t not in src_set]
    if len(novel_tokens) > 1:
        return False, f"Excessive novel tokens in short sentence ({len(novel_tokens)} novel tokens: {', '.join(novel_tokens)})"
    elif len(novel_tokens) == 1 and len(src_raw_tokens) <= 8:
        return False, f"Unverified novel token '{novel_tokens[0]}' in short sentence"

    return True, None


def is_effectively_identical(text1: str, text2: str) -> bool:
    """Check if candidate is effectively identical to source (ignoring punctuation, whitespace, ZWJ/ZWNJ)."""
    def normalize_chars(s: str) -> str:
        s = re.sub(r'[\.,!?:\'"\-\(\)\[\]\{\};~`@#\$%\^&\*_\+=/<>]', '', s)
        s = re.sub(r'[\s\u200c\u200d\u00a0\ufeff]+', '', s)
        return s.strip()
    return normalize_chars(text1) == normalize_chars(text2)


def evaluate_candidate(
    candidate: str,
    source_text: str,
    beam_rank: int
) -> Dict[str, Any]:
    """Calculate deterministic validation criteria for a single candidate."""
    cleaned = clean_candidate(candidate, source_text)
    
    is_empty = len(cleaned) == 0
    sinhala_ok = contains_sinhala(cleaned)
    valid_start = is_valid_sinhala_start(cleaned)
    has_sentinel = "<extra_id_" in candidate or "<extra_id_" in cleaned
    repeated_loop = has_repeated_3gram(cleaned) or has_word_repetition(cleaned)
    unexplained_latin = has_unexplained_latin(cleaned, source_text)
    has_foreign = has_malformed_chars(cleaned, source_text)
    
    src_words = source_text.strip().split()
    cand_words = cleaned.split()
    word_ratio = len(cand_words) / max(1, len(src_words))
    
    is_exact_copy = (
        cleaned.strip() == source_text.strip() or
        is_effectively_identical(cleaned, source_text)
    )
    sentence_count = count_sentences(cleaned)
    source_sentence_count = count_sentences(source_text)

    rejection_reasons = []

    # 1. Reject empty output
    if is_empty:
        rejection_reasons.append("Empty output")

    # 2. Reject no Sinhala characters
    if not sinhala_ok:
        rejection_reasons.append("No Sinhala characters")

    # 3. Reject invalid initial Sinhala character (e.g. virama / dependent vowel)
    if not valid_start:
        rejection_reasons.append("Invalid initial character (virama/combining mark)")

    # 4. Reject sentinel tokens
    if has_sentinel:
        rejection_reasons.append("Contains sentinel token")

    # 5. Reject prompt / Latin artifacts
    if unexplained_latin:
        rejection_reasons.append("Contains unexplained Latin letters")

    # 6. Reject foreign / malformed characters (e.g. CJK)
    if has_foreign:
        rejection_reasons.append("Contains foreign/malformed characters")

    # 7. Reject repetition loops
    if repeated_loop:
        rejection_reasons.append("Repetition loop detected")

    # 8. Reject output > 1.35x source word count for short inputs (or any word increase for <= 7 words)
    if len(src_words) <= 7 and len(cand_words) > len(src_words):
        rejection_reasons.append(f"Expansion for short input ({len(cand_words)} words > {len(src_words)} words)")
    elif len(src_words) <= 12 and word_ratio > 1.35:
        rejection_reasons.append(f"Expansion > 1.35x for short input (ratio: {word_ratio:.2f})")
    elif word_ratio > 1.50:
        rejection_reasons.append(f"Expansion > 1.50x (ratio: {word_ratio:.2f})")

    # 9. Reject output < 0.70x source word count for short inputs (severe over-compression)
    if len(src_words) <= 10 and word_ratio < 0.70:
        rejection_reasons.append(f"Over-compression < 0.70x for short input (ratio: {word_ratio:.2f})")

    # 10. Reject suspiciously tiny outputs such as a single predicate word
    if len(cand_words) < 3 and len(src_words) >= 4:
        rejection_reasons.append(f"Suspiciously tiny output ({len(cand_words)} words)")
    elif len(cand_words) < 2:
        rejection_reasons.append("Output less than 2 words")

    # 11. Reject predictions with more than 2 sentences
    if sentence_count > 2:
        rejection_reasons.append(f"Too many sentences ({sentence_count} > 2)")
    elif source_sentence_count <= 1 and sentence_count > 1 and word_ratio >= 1.0:
        rejection_reasons.append("Unnecessary second sentence generated")

    # 12. Reject if numeric / alphanumeric facts are lost
    if not check_numeric_facts_preserved(source_text, cleaned):
        rejection_reasons.append("Numeric or quantitative facts lost")

    # 13. Reject dropping primary subject noun in short sentences
    if not checks_subject_preserved(source_text, cleaned):
        rejection_reasons.append("Primary subject/agent dropped")

    # 14. Exact copy policy: do not mark exact copies as simplifications
    if is_exact_copy:
        rejection_reasons.append("Exact copy of source (no actual simplification)")

    # 15. Conservative short-sentence meaning and token preservation check (for source <= 10 words)
    if len(src_words) <= 10:
        short_ok, short_reason = check_short_sentence_preservation(source_text, cleaned)
        if not short_ok:
            rejection_reasons.append(short_reason)

    valid = len(rejection_reasons) == 0

    return {
        "raw": candidate,
        "cleaned": cleaned,
        "beam_rank": beam_rank,
        "is_empty": is_empty,
        "contains_sinhala": sinhala_ok,
        "has_sentinel": has_sentinel,
        "repeated_loop": repeated_loop,
        "unexplained_latin": unexplained_latin,
        "word_ratio": round(word_ratio, 3),
        "is_exact_copy": is_exact_copy,
        "char_len": len(cleaned),
        "word_len": len(cand_words),
        "sentence_count": sentence_count,
        "rejection_reasons": rejection_reasons,
        "valid": valid
    }


class SinhalaSimplifier:
    """Production inference engine for Level 4 Sinhala Sentence Simplification."""

    def __init__(
        self,
        adapter_path: Path = DEFAULT_ADAPTER_PATH,
        base_model_name: str = DEFAULT_BASE_MODEL,
        device: Optional[torch.device] = None,
        local_files_only: bool = True
    ):
        self.device = device or get_device()
        self.adapter_path = Path(adapter_path)
        self.base_model_name = base_model_name
        self.local_files_only = local_files_only

        # Load Tokenizer
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(
                str(self.adapter_path),
                local_files_only=self.local_files_only
            )
        except Exception:
            if self.local_files_only:
                self.tokenizer = AutoTokenizer.from_pretrained(
                    str(self.adapter_path),
                    local_files_only=False
                )
            else:
                raise

        # Load Base Model + LoRA Adapter
        try:
            base_model = AutoModelForSeq2SeqLM.from_pretrained(
                self.base_model_name,
                local_files_only=self.local_files_only
            )
        except Exception:
            if self.local_files_only:
                base_model = AutoModelForSeq2SeqLM.from_pretrained(
                    self.base_model_name,
                    local_files_only=False
                )
            else:
                raise

        self.model = PeftModel.from_pretrained(
            base_model,
            str(self.adapter_path),
            local_files_only=self.local_files_only
        )
        self.model.to(self.device)
        self.model.eval()
        
        # Build bad words IDs to suppress all 100 mT5 sentinel tokens (<extra_id_0> to <extra_id_99>)
        self.sentinel_bad_words_ids = [[tid] for tid in range(250000, 250100)]

    @torch.no_grad()
    def simplify(
        self,
        source_text: str,
        num_beams: int = 4,
        num_return_sequences: int = 4,
        max_new_tokens: int = 64,
        repetition_penalty: float = 1.20,
        length_penalty: float = 0.60,
        no_repeat_ngram_size: int = 3,
        prefix: str = DEFAULT_PREFIX
    ) -> Dict[str, Any]:
        """
        Simplify a single complex Sinhala sentence.
        
        Returns:
            Dict containing:
            - "available": bool (True if valid candidate selected, False otherwise)
            - "simplified_text": Optional[str] (best candidate text or None)
            - "source_text": str
            - "all_candidates": List[Dict[str, Any]] (all 4 analyzed candidates)
            - "selected_candidate": Optional[Dict[str, Any]]
            - "rejection_reason": Optional[str] (primary reason if available=False)
        """
        source_clean = source_text.strip()
        if not source_clean:
            return {
                "available": False,
                "simplified_text": None,
                "source_text": source_text,
                "all_candidates": [],
                "selected_candidate": None,
                "rejection_reason": "Empty source text"
            }

        prompt = f"{prefix}{source_clean}"
        inputs = self.tokenizer(
            prompt,
            max_length=192,
            truncation=True,
            return_tensors="pt"
        ).to(self.device)

        outputs = self.model.generate(
            **inputs,
            do_sample=False,
            num_beams=num_beams,
            num_return_sequences=num_return_sequences,
            max_new_tokens=max_new_tokens,
            no_repeat_ngram_size=no_repeat_ngram_size,
            repetition_penalty=repetition_penalty,
            length_penalty=length_penalty,
            early_stopping=True,
            bad_words_ids=self.sentinel_bad_words_ids
        )

        decoded_raw = [
            self.tokenizer.decode(seq, skip_special_tokens=True)
            for seq in outputs
        ]

        # Analyze and score all candidates
        analyzed_candidates = [
            evaluate_candidate(raw_text, source_clean, beam_rank=idx + 1)
            for idx, raw_text in enumerate(decoded_raw)
        ]

        # Filter strictly valid non-copy candidates
        valid_candidates = [c for c in analyzed_candidates if c["valid"]]

        if not valid_candidates:
            top_reasons = analyzed_candidates[0]["rejection_reasons"] if analyzed_candidates else ["No candidates generated"]
            return {
                "available": False,
                "simplified_text": None,
                "source_text": source_clean,
                "all_candidates": analyzed_candidates,
                "selected_candidate": None,
                "rejection_reason": "; ".join(top_reasons)
            }

        # Rank valid candidates:
        # 1. Shorter word count
        # 2. Shorter character length
        # 3. Earlier beam rank
        valid_candidates.sort(
            key=lambda c: (
                c["word_len"],
                c["char_len"],
                c["beam_rank"]
            )
        )

        best_cand = valid_candidates[0]

        return {
            "available": True,
            "simplified_text": best_cand["cleaned"],
            "source_text": source_clean,
            "all_candidates": analyzed_candidates,
            "selected_candidate": best_cand,
            "rejection_reason": None
        }


def main():
    """Smoke test runner for inference module."""
    print("=" * 65)
    print("SINHALA SENTENCE SIMPLIFICATION INFERENCE MODULE (V2)")
    print("=" * 65)
    simplifier = SinhalaSimplifier()
    print(f"Device: {simplifier.device}")
    print(f"Adapter: {simplifier.adapter_path}")
    print("Inference module initialized successfully.")


if __name__ == "__main__":
    main()
