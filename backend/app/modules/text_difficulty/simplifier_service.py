"""
simplifier_service.py
=====================
Module 2 Level 4: Sinhala Sentence Simplification Service
Edirisooriya H. S. (IT23179844)

Provides thread-safe lazy singleton loading for the fine-tuned mT5-small + LoRA (v2) model.
- Backend startup does NOT load mT5.
- First Level 4 request loads the model once.
- Subsequent requests reuse the loaded model instance.
- Runs on Apple Silicon MPS when available, falling back to CPU.
- Returns only:
    {
        "available": bool,
        "simplified_text": str | None
    }
- On any error or quality-gate rejection, returns:
    {
        "available": False,
        "simplified_text": None
    }
"""

from __future__ import annotations

import logging
import os
import platform
import sys
import threading
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# Ensure platform.mac_ver does not return empty string on macOS 26+ for truststore compatibility
if platform.system() == "Darwin" and not platform.mac_ver()[0]:
    platform.mac_ver = lambda: ("26.2.0", ("", "", ""), "")

# Ensure offline mode is only preferred if cached, allowing first-run download



def _find_repo_root() -> Path:
    """Finds the root repository directory containing the ml/ folder."""
    candidates = [
        Path.cwd(),
        Path(__file__).resolve().parents[4],
        Path(__file__).resolve().parents[3],
        Path(__file__).resolve().parents[2],
    ]
    for c in candidates:
        if (c / "ml" / "checkpoints" / "m2_text_simplification_v2" / "best_adapter").exists():
            return c
    return Path.cwd()


class TextSimplifierService:
    """Thread-safe lazy singleton service wrapping the Sinhala Sentence Simplifier model."""

    _instance: Optional[TextSimplifierService] = None
    _lock = threading.Lock()

    def __init__(self) -> None:
        self._simplifier: Any = None
        self._load_lock = threading.Lock()
        self._repo_root = _find_repo_root()
        self._adapter_path = (
            self._repo_root
            / "ml"
            / "checkpoints"
            / "m2_text_simplification_v2"
            / "best_adapter"
        )

    @classmethod
    def get_instance(cls) -> TextSimplifierService:
        """Retrieve or create the global singleton instance."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    @property
    def is_loaded(self) -> bool:
        """Check whether the ML model is currently loaded in memory."""
        return self._simplifier is not None

    def _ensure_loaded(self) -> None:
        """Lazy load the SinhalaSimplifier model on first use."""
        if self._simplifier is None:
            with self._load_lock:
                if self._simplifier is None:
                    logger.info("Lazy-loading Model 2 Sinhala Sentence Simplifier (v2 adapter)...")
                    
                    # Ensure ml module directory is in sys.path
                    ml_dir = self._repo_root / "ml" / "training" / "m2_text_simplification"
                    if str(ml_dir) not in sys.path:
                        sys.path.insert(0, str(ml_dir))

                    from inference_simplification import SinhalaSimplifier, get_device

                    device = get_device()
                    logger.info("Resolved compute device for Model 2: %s", device)

                    try:
                        self._simplifier = SinhalaSimplifier(
                            adapter_path=self._adapter_path,
                            device=device,
                            local_files_only=True
                        )
                    except Exception as local_err:
                        logger.warning(
                            "Offline loading failed (%s). Attempting online fetch for google/mt5-small base model...",
                            local_err
                        )
                        os.environ.pop("HF_HUB_OFFLINE", None)
                        os.environ.pop("TRANSFORMERS_OFFLINE", None)
                        self._simplifier = SinhalaSimplifier(
                            adapter_path=self._adapter_path,
                            device=device,
                            local_files_only=False
                        )
                    logger.info(
                        "Model 2 Simplifier loaded successfully on device: %s from %s",
                        self._simplifier.device,
                        self._adapter_path
                    )

    def simplify_sentence(self, text: str) -> Dict[str, Any]:
        """
        Simplify a complex Sinhala sentence.

        Returns strictly:
            {
                "available": bool,
                "simplified_text": str | None
            }
        """
        clean_text = str(text or "").strip()
        if not clean_text:
            return {
                "available": False,
                "simplified_text": None
            }

        try:
            self._ensure_loaded()
            raw_result = self._simplifier.simplify(clean_text)
            
            is_available = bool(raw_result.get("available", False))
            simplified_text = raw_result.get("simplified_text")

            # Strict contract validation:
            # 1. If not available or no text, return available=False, simplified_text=None
            if not is_available or not simplified_text:
                return {
                    "available": False,
                    "simplified_text": None
                }

            # 2. Never return exact copy or fake simplified text as a simplification
            simplified_text_clean = str(simplified_text).strip()
            if not simplified_text_clean or simplified_text_clean == clean_text:
                # If model echoed original text, simplification is not available
                return {
                    "available": False,
                    "simplified_text": None
                }

            return {
                "available": True,
                "simplified_text": simplified_text_clean
            }

        except Exception as exc:
            logger.error(
                "Model 2 simplification failed for input '%s': %s",
                clean_text,
                exc,
                exc_info=True
            )
            return {
                "available": False,
                "simplified_text": None
            }


# Global lazy singleton instance
text_simplifier_service = TextSimplifierService.get_instance()


def simplify_sentence(text: str) -> Dict[str, Any]:
    """Convenience module function for sentence simplification."""
    return text_simplifier_service.simplify_sentence(text)
