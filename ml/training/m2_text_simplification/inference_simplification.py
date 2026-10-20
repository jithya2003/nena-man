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
    has_sentinel = "<extra_id_" in candidate
    repeated_loop = has_repeated_3gram(cleaned)
    unexplained_latin = has_unexplained_latin(cleaned, source_text)
    
    src_words = source_text.strip().split()
    cand_words = cleaned.split()
    word_ratio = len(cand_words) / max(1, len(src_words))
    
    is_exact_copy = (cleaned.strip() == source_text.strip())
    
    # Rejection criteria:
    # - Empty
    # - No Sinhala
    # - Invalid Sinhala start (e.g. virama / dependent vowel)
    # - Sentinel tokens present
    # - Repetition loop
    # - Unexplained Latin garbage
    # - Expansion ratio > 1.50
    valid = (
        not is_empty
        and sinhala_ok
        and valid_start
        and not has_sentinel
        and not repeated_loop
        and not unexplained_latin
        and word_ratio <= 1.50
    )
    
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
        self.tokenizer = AutoTokenizer.from_pretrained(
            str(self.adapter_path),
            local_files_only=self.local_files_only
        )
        
        # Load Base Model + LoRA Adapter
        base_model = AutoModelForSeq2SeqLM.from_pretrained(
            self.base_model_name,
            local_files_only=self.local_files_only
        )
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
        """
        source_clean = source_text.strip()
        if not source_clean:
            return {
                "available": False,
                "simplified_text": None,
                "source_text": source_text,
                "all_candidates": [],
                "selected_candidate": None
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

        valid_candidates = [c for c in analyzed_candidates if c["valid"]]

        if not valid_candidates:
            return {
                "available": False,
                "simplified_text": None,
                "source_text": source_clean,
                "all_candidates": analyzed_candidates,
                "selected_candidate": None
            }

        # Candidate selection priority:
        # 1. Prefer non-exact copy (is_exact_copy == False)
        # 2. Prefer shorter length (word_len, char_len)
        # 3. Beam rank tie-breaker
        valid_candidates.sort(
            key=lambda c: (
                1 if c["is_exact_copy"] else 0,  # non-copy first
                c["word_len"],                    # shorter word count
                c["char_len"],                    # shorter char length
                c["beam_rank"]                    # earlier beam order
            )
        )

        best_cand = valid_candidates[0]

        # Determine whether output requires human validation (per safety requirement 6)
        needs_human_inspection = False
        inspection_reasons = []
        if best_cand["is_exact_copy"]:
            needs_human_inspection = True
            inspection_reasons.append("Exact copy of source")
        if best_cand["word_ratio"] < 0.50:
            needs_human_inspection = True
            inspection_reasons.append(f"High compression (word ratio: {best_cand['word_ratio']:.2f})")
        if best_cand["word_ratio"] > 1.20:
            needs_human_inspection = True
            inspection_reasons.append(f"Expansion (word ratio: {best_cand['word_ratio']:.2f})")
        if "." in best_cand["cleaned"][:-1]:
            needs_human_inspection = True
            inspection_reasons.append("Multi-sentence split detected")

        return {
            "available": True,
            "simplified_text": best_cand["cleaned"],
            "source_text": source_clean,
            "all_candidates": analyzed_candidates,
            "selected_candidate": best_cand,
            "needs_human_inspection": needs_human_inspection,
            "inspection_reasons": inspection_reasons
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
