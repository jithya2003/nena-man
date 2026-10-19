"""
service.py
==========
Module 2: Sinhala Text Difficulty Analysis & Progressive Reading Support
Researcher: Edirisooriya H. S. (IT23179844)

Hybrid System Architecture:
---------------------------
1. Machine Learning Responsibility:
   - Predict Sinhala text difficulty level ONLY:
     Easy / Medium / Hard
   - Target for prototype: initial_difficulty_label (researcher-defined Rubric A).
   - Target for final production: final_difficulty_level (expert-validated ground truth).
2. Progressive Support Responsibility:
   - Progressive reading support decisions remain an interpretable, transparent policy layer:
     split_needed (Candidate S2)
     simplification_needed (Candidate T2)
     max_support_level (Universal Audio Fallback: Level 3 or Level 4)
     support_path (e.g. [1, 3], [1, 2, 3], [1, 3, 4], [1, 2, 3, 4])
   - Machine learning is NOT trained for split, simplification, or max support level.

Research Safety & Pedagogical Clarifications:
---------------------------------------------
- This model is a research prototype trained using researcher-defined provisional labels.
- It must NOT be presented as:
  1. A dyslexia diagnostic system.
  2. Clinical ground truth.
  3. Expert-validated final difficulty classification.
- High model accuracy demonstrates the Random Forest's capability to approximate
  the provisional rubric across unseen document sources.
"""

from __future__ import annotations

import logging
import sys
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import joblib
import pandas as pd
from sklearn.pipeline import Pipeline

# ---------------------------------------------------------------------------
# Dynamic Repository Root & ML Module Resolution
# ---------------------------------------------------------------------------
def _find_repo_root() -> Path:
    """Finds the root repository directory containing the ml/ folder."""
    candidates = [
        Path.cwd(),
        Path(__file__).resolve().parents[4],
        Path(__file__).resolve().parents[3],
        Path(__file__).resolve().parents[2],
    ]
    for c in candidates:
        if (c / "ml" / "checkpoints" / "m2_text_difficulty" / "text_difficulty_rf.joblib").exists():
            return c
    return Path.cwd()


REPO_ROOT = _find_repo_root()
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

# Import reusable NLP, feature extraction, and policy functions directly from project ML codebase
from ml.training.m2_text_difficulty.preprocess import (
    normalize_sinhala_text,
    is_valid_sinhala_text,
)
from ml.training.m2_text_difficulty.feature_extraction import (
    count_akuru,
    count_pillam,
)
from ml.training.m2_text_difficulty.word_frequency import (
    SinhalaFrequencyCorpus,
    load_frequency_list,
    get_text_frequency_details,
    tokenize_sinhala_words,
)
from ml.training.m2_text_difficulty.labeling_policy import (
    calculate_split_needed,
    calculate_simplification_needed,
    calculate_max_support_level,
    get_support_path,
)

from app.core.errors import ModelNotReadyError, ValidationError

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Default Resource Paths
# ---------------------------------------------------------------------------
DEFAULT_MODEL_PATH = REPO_ROOT / "ml" / "checkpoints" / "m2_text_difficulty" / "text_difficulty_rf.joblib"
DEFAULT_FREQUENCY_CORPUS_PATH = REPO_ROOT / "ml" / "data" / "sinhala_frequency" / "word_frequency_list_2M.si"


class TextDifficultyService:
    """
    Singleton service for Sinhala text difficulty classification and progressive
    reading support inference.
    """

    _instance: Optional[TextDifficultyService] = None
    _lock: threading.Lock = threading.Lock()

    def __init__(
        self,
        model_path: Union[str, Path] = DEFAULT_MODEL_PATH,
        corpus_path: Union[str, Path] = DEFAULT_FREQUENCY_CORPUS_PATH,
    ) -> None:
        self.model_path = Path(model_path)
        self.corpus_path = Path(corpus_path)
        self._pipeline: Optional[Pipeline] = None
        self._corpus: Optional[SinhalaFrequencyCorpus] = None
        self._init_lock = threading.Lock()

    @classmethod
    def get_instance(cls) -> TextDifficultyService:
        """Returns the thread-safe singleton instance of TextDifficultyService."""
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    def _ensure_loaded(self) -> None:
        """Lazily loads and caches the ML pipeline and frequency corpus."""
        if self._pipeline is not None and self._corpus is not None:
            return

        with self._init_lock:
            if self._pipeline is None:
                if not self.model_path.exists():
                    logger.error("Random Forest model checkpoint not found at: %s", self.model_path)
                    raise ModelNotReadyError(
                        f"Text difficulty model checkpoint not found at '{self.model_path}'. "
                        "Please verify the model file exists in ml/checkpoints/m2_text_difficulty/."
                    )
                logger.info("Loading text difficulty Random Forest model from %s...", self.model_path)
                self._pipeline = joblib.load(self.model_path)
                logger.info("Model loaded successfully. Estimator classes: %s", self._pipeline.classes_)

            if self._corpus is None:
                if not self.corpus_path.exists():
                    logger.error("Sinhala frequency corpus not found at: %s", self.corpus_path)
                    raise FileNotFoundError(
                        f"Sinhala frequency corpus not found at '{self.corpus_path}'. "
                        "Please verify the resource file exists in ml/data/sinhala_frequency/."
                    )
                logger.info("Loading Sinhala 2M frequency corpus from %s...", self.corpus_path)
                t0 = time.time()
                self._corpus = load_frequency_list(self.corpus_path)
                duration = time.time() - t0
                logger.info("Frequency corpus loaded in %.2f seconds (%d entries).", duration, len(self._corpus))

    def analyze(
        self,
        text: str,
        grade_level: int,
        text_type: str,
    ) -> Dict[str, Any]:
        """
        Analyzes Sinhala text for reading difficulty and determines progressive support policy.

        Args:
            text: Raw input Sinhala word or short sentence.
            grade_level: Target primary grade (1, 2, or 3).
            text_type: Text classification category ('word' or 'short sentence').

        Returns:
            Dictionary matching the required API success shape or OOV confirmation shape.
        """
        # 1. Validation & Input Normalization
        if not text or not str(text).strip():
            raise ValidationError("Text input cannot be empty or whitespace only.")

        clean_text = str(text).strip()
        is_valid, reason = is_valid_sinhala_text(clean_text)
        if not is_valid:
            raise ValidationError(f"Invalid Sinhala text input: {reason}")

        norm_text = normalize_sinhala_text(clean_text)
        if not norm_text:
            raise ValidationError("Input text contains no valid Sinhala characters.")

        if grade_level not in (1, 2, 3):
            raise ValidationError("Grade level must be 1, 2, or 3.")

        clean_text_type = str(text_type).strip().lower()
        if clean_text_type not in ("word", "short sentence"):
            raise ValidationError("text_type must be either 'word' or 'short sentence'.")

        # 2. Lazy Model & Corpus Loading
        self._ensure_loaded()
        assert self._pipeline is not None
        assert self._corpus is not None

        # 3. Tokenization & OOV Detection
        tokens = tokenize_sinhala_words(norm_text)
        if not tokens:
            raise ValidationError("Input text contains no valid Sinhala word tokens.")

        freq_details = get_text_frequency_details(norm_text, self._corpus)
        unmatched_tokens = freq_details["unmatched_tokens"]

        # OOV Guard: Do NOT run Random Forest if there are unknown/OOV tokens
        if unmatched_tokens:
            logger.info("OOV token(s) detected: %s. Returning needs_word_confirmation.", unmatched_tokens)
            return {
                "analysis_status": "needs_word_confirmation",
                "text": clean_text,
                "unknown_tokens": unmatched_tokens,
                "message": "One or more words could not be found in the frequency corpus.",
                "model_status": "prototype_provisional",
            }

        # 4. Feature Extraction (Exact same definitions used during training)
        # akuru_count: Unicode-aware Sinhala orthographic-unit count (NOT linguistic syllable count)
        akuru = count_akuru(norm_text)
        # pillam_count: Operational educational reading-mark count
        pillam = count_pillam(norm_text)

        # word_frequency_level: Approved Candidate 1 thresholds
        # Common (1): rarest_effective_frequency >= 5,000
        # Medium (2): 500 <= rarest_effective_frequency < 5,000
        # Rare (3): rarest_effective_frequency < 500
        rarest_freq = freq_details["rarest_effective_frequency"]
        if rarest_freq is None:
            # Fallback guard
            freq_level = 3
        elif rarest_freq >= 5000:
            freq_level = 1
        elif rarest_freq >= 500:
            freq_level = 2
        else:
            freq_level = 3

        # 5. Machine Learning Difficulty Inference
        # Input DataFrame must use EXACTLY the features the pipeline ColumnTransformer expects
        input_df = pd.DataFrame([
            {
                "grade_level": int(grade_level),
                "text_type": clean_text_type,
                "akuru_count": int(akuru),
                "pillam_count": int(pillam),
                "word_frequency_level": int(freq_level),
            }
        ])

        t_infer_start = time.perf_counter()
        predicted_diff = str(self._pipeline.predict(input_df)[0])
        probs = self._pipeline.predict_proba(input_df)[0]
        infer_latency_ms = round((time.perf_counter() - t_infer_start) * 1000, 2)

        classes = list(self._pipeline.classes_)
        prob_dict = {c: round(float(p), 4) for c, p in zip(classes, probs)}

        # 6. Policy Engine (Frozen Progressive Support Rules)
        # At runtime, ML predicted difficulty is used in place of initial_difficulty_label
        split_needed_str = calculate_split_needed(akuru, pillam, clean_text_type)
        split_needed_bool = (split_needed_str == "Yes")

        simp_needed_str = calculate_simplification_needed(
            initial_difficulty_label=predicted_diff,
            akuru_count=akuru,
            pillam_count=pillam,
            word_frequency_level=freq_level,
            text_type=clean_text_type,
        )
        simp_needed_bool = (simp_needed_str == "Yes")

        max_support = calculate_max_support_level(simplification_needed=simp_needed_str)
        support_path = get_support_path(split_needed_str, simp_needed_str, max_support)

        # 7. Construct Final Response Payload
        return {
            "analysis_status": "success",
            "text": clean_text,
            "grade_level": int(grade_level),
            "text_type": clean_text_type,
            "features": {
                "akuru_count": int(akuru),
                "pillam_count": int(pillam),
                "word_frequency_level": int(freq_level),
            },
            "difficulty": {
                "predicted": predicted_diff,
                "probabilities": prob_dict,
            },
            "support": {
                "split_needed": split_needed_bool,
                "simplification_needed": simp_needed_bool,
                "max_support_level": max_support,
                "support_path": support_path,
            },
            "simplification": {
                "needed": simp_needed_bool,
                "available": False,
                "simplified_text": None,
            },
            "model_status": "prototype_provisional",
            "_inference_latency_ms": infer_latency_ms,
        }


# Global service instance
text_difficulty_service = TextDifficultyService.get_instance()
