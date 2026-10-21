"""
nena-man · backend/app/modules/behavioral_detection/fusion.py
Multimodal Late-Fusion Decision Engine with Temporal Smoothing.

Classes:
  0: Engaged
  1: Distracted
  2: Frustrated

Weights:
  - Camera:      0.55 (55%)
  - Interaction: 0.30 (30%)
  - Voice:       0.15 (15%)
"""

import logging
from typing import Dict, List, Optional, Tuple
import numpy as np

logger = logging.getLogger(__name__)

CLASSES = ["Engaged", "Distracted", "Frustrated"]
BASE_WEIGHTS = {
    "camera": 0.55,
    "interaction": 0.30,
    "voice": 0.15,
}

CONFIDENCE_THRESHOLD = 0.40  # Minimum confidence required to accept predicted state
SMOOTHING_ALPHA = 0.65       # EMA weight for new prediction vs history (0.65 current + 0.35 past)


class MultimodalFusionEngine:
    """Combines predictions from Camera, Interaction, and Audio modalities."""

    def __init__(self):
        # In-memory history for temporal smoothing per child/session: { child_id: [p_eng, p_dis, p_fru] }
        self._history: Dict[str, np.ndarray] = {}

    def fuse(
        self,
        camera_probs: Optional[np.ndarray] = None,       # shape: (3,) [Engaged, Distracted, Frustrated]
        interaction_probs: Optional[np.ndarray] = None,  # shape: (3,) [Engaged, Distracted, Frustrated]
        voice_frustration_prob: Optional[float] = None,  # float in [0, 1]
        session_id: Optional[str] = None,
    ) -> Tuple[str, float, Dict[str, float], Optional[Dict[str, str]]]:
        """
        Fuses available modalities, handles missing inputs, applies temporal smoothing,
        and determines the intervention policy.

        Returns:
            Tuple: (predicted_state, confidence, modality_contributions, intervention_obj)
        """
        active_weights = {}

        if camera_probs is not None:
            active_weights["camera"] = BASE_WEIGHTS["camera"]
        if interaction_probs is not None:
            active_weights["interaction"] = BASE_WEIGHTS["interaction"]
        if voice_frustration_prob is not None:
            active_weights["voice"] = BASE_WEIGHTS["voice"]

        total_weight = sum(active_weights.values())

        # Scenario 1: No modalities available
        if total_weight == 0.0:
            logger.info("[Fusion] No modalities provided. Returning default Engaged state.")
            return "Engaged", 0.50, {}, None

        # Re-normalize weights among available modalities
        normalized_weights = {k: v / total_weight for k, v in active_weights.items()}

        fused_probs = np.zeros(3, dtype=np.float32)

        # 1. Camera contribution (3 probabilities)
        if "camera" in normalized_weights:
            fused_probs += normalized_weights["camera"] * np.array(camera_probs, dtype=np.float32)

        # 2. Interaction contribution (3 probabilities)
        if "interaction" in normalized_weights:
            fused_probs += normalized_weights["interaction"] * np.array(interaction_probs, dtype=np.float32)

        # 3. Voice contribution (Frustration probability distribution)
        if "voice" in normalized_weights:
            # Voice model outputs frustration probability: [Engaged, Distracted, Frustrated]
            p_fru = float(voice_frustration_prob)
            p_eng = max(0.0, (1.0 - p_fru) * 0.70)
            p_dis = max(0.0, (1.0 - p_fru) * 0.30)
            voice_dist = np.array([p_eng, p_dis, p_fru], dtype=np.float32)
            fused_probs += normalized_weights["voice"] * voice_dist

        # Normalize final probability vector
        sum_p = np.sum(fused_probs)
        if sum_p > 0:
            fused_probs = fused_probs / sum_p
        else:
            fused_probs = np.array([0.34, 0.33, 0.33], dtype=np.float32)

        # 4. Temporal Smoothing via Exponential Moving Average (EMA)
        if session_id:
            if session_id in self._history:
                prior = self._history[session_id]
                fused_probs = (SMOOTHING_ALPHA * fused_probs) + ((1.0 - SMOOTHING_ALPHA) * prior)
            self._history[session_id] = fused_probs

        predicted_idx = int(np.argmax(fused_probs))
        confidence = float(fused_probs[predicted_idx])
        predicted_state = CLASSES[predicted_idx]

        # Apply confidence threshold
        if confidence < CONFIDENCE_THRESHOLD:
            # Low confidence fallback
            logger.debug("[Fusion] Confidence %.2f below threshold %.2f, defaulting to Engaged", confidence, CONFIDENCE_THRESHOLD)
            predicted_state = "Engaged"

        # 5. Determine Intervention
        intervention = self._select_intervention(predicted_state, confidence)

        return predicted_state, round(confidence, 3), normalized_weights, intervention

    def _select_intervention(self, state: str, confidence: float) -> Optional[Dict[str, str]]:
        """
        Maps predicted behavioral state to adaptive intervention mini-games.
        """
        if state == "Frustrated":
            return {
                "game": "game-breathing",
                "title": "Balloon Breathing",
                "description": "A calming deep-breathing exercise to reduce cognitive frustration.",
                "duration_seconds": 60,
            }
        elif state == "Distracted":
            return {
                "game": "game-star",
                "title": "Catch the Star",
                "description": "An attention re-centering star game to rebuild focus.",
                "duration_seconds": 45,
            }
        elif state == "Engaged":
            # Celebration reward for high engagement and successful reading
            return {
                "game": "game-bubble",
                "title": "Bubble Pop Celebration",
                "description": "A fun, rewarding bubble-popping celebration for high focus and engagement!",
                "duration_seconds": 45,
                "type": "celebration_reward",
            }

        return None

    def reset_session(self, session_id: str):
        """Clears temporal history for a completed session."""
        self._history.pop(session_id, None)
