"""
nena-man · backend/app/core/model_loader.py
Base plug-and-play AI Model Slot abstraction.

Every module (M1–M4) has a concrete subclass of BaseModelSlot.
The slot has two modes:
  1. ML Mode    — A trained .pkl / .pt checkpoint exists in models/ → use it.
  2. Stub Mode  — No checkpoint found → fall back to deterministic heuristics.

This means the entire system is always runnable even before any model is trained.
When a member's Colab training is complete, they simply drop the checkpoint
into backend/app/modules/<module>/models/ and the slot auto-activates ML Mode.
"""

import os
import logging
from abc import ABC, abstractmethod
from threading import Lock
from typing import Any, Optional

logger = logging.getLogger(__name__)


class BaseModelSlot(ABC):
    """
    Abstract base class for all AI module model slots.

    Subclass this in each module's model_slot.py and implement:
        - _load_model(path: str) -> Any
        - _run_inference(payload: dict) -> dict
        - _run_heuristic(payload: dict) -> dict
    """

    def __init__(self, model_dir: str, model_filename: str = "model_v1.pkl"):
        self._model_dir = model_dir
        self._model_filename = model_filename
        self._model: Optional[Any] = None
        self._lock = Lock()
        self._is_loaded: bool = False
        self._mode: str = "stub"   # "ml" or "stub"
        self._try_load()

    def _model_path(self) -> str:
        return os.path.join(self._model_dir, self._model_filename)

    def _try_load(self) -> None:
        """Attempt to load the ML model checkpoint. Log result."""
        path = self._model_path()
        if os.path.isfile(path):
            try:
                with self._lock:
                    self._model = self._load_model(path)
                    self._is_loaded = True
                    self._mode = "ml"
                logger.info("[ModelSlot] ✅ ML model loaded from %s — running in ML Mode.", path)
            except Exception as exc:
                logger.warning(
                    "[ModelSlot] ⚠️  Failed to load model from %s: %s — "
                    "falling back to Stub (Heuristic) Mode.",
                    path, exc
                )
                self._mode = "stub"
        else:
            logger.info(
                "[ModelSlot] 📦 No checkpoint found at %s — running in Stub (Heuristic) Mode. "
                "Drop a trained .pkl / .pt file there to activate ML Mode.",
                path
            )
            self._mode = "stub"

    @property
    def is_ml_mode(self) -> bool:
        """True if a trained model checkpoint has been loaded."""
        return self._mode == "ml"

    @property
    def mode(self) -> str:
        """Return 'ml' or 'stub'."""
        return self._mode

    def predict(self, payload: dict) -> dict:
        """
        Run inference. Automatically delegates to ML or heuristic based on mode.

        Args:
            payload: Validated, deserialized request data.

        Returns:
            Module-specific prediction dict.
        """
        if self._mode == "ml":
            try:
                return self._run_inference(payload)
            except Exception as exc:
                logger.error("[ModelSlot] ML inference failed: %s — falling back to heuristic.", exc)
                return self._run_heuristic(payload)
        return self._run_heuristic(payload)

    @abstractmethod
    def _load_model(self, path: str) -> Any:
        """Load and return the model object from disk."""
        ...

    @abstractmethod
    def _run_inference(self, payload: dict) -> dict:
        """Run the trained ML model and return prediction dict."""
        ...

    @abstractmethod
    def _run_heuristic(self, payload: dict) -> dict:
        """
        Run domain-accurate heuristic logic when no trained model is available.
        Must produce output in the EXACT same schema as _run_inference().
        """
        ...
