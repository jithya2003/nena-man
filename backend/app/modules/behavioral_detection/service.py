"""
nena-man · backend/app/modules/behavioral_detection/service.py
Behavioral Detection Service — Multimodal Inference Runner for Team Deployment.

Designed to run universally on ANY teammate's machine (CPU / GPU, Windows / Mac / Linux):
  1. Uses relative pathing: os.path.join(os.path.dirname(__file__), "models")
  2. Embeds exact PyTorch model architectures for state_dict restoration
  3. Enforces CPU map_location so GPU is never required
  4. Supports joblib unpickling for sklearn scalers
  5. Provides graceful heuristics if PyTorch/TensorFlow are not installed on a teammate's laptop
"""

import os
import logging
import pickle
import numpy as np

from .preprocessing import BehavioralPreprocessor
from .fusion import MultimodalFusionEngine, CLASSES

logger = logging.getLogger(__name__)

# Relative model path — works on any machine regardless of installation path
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


# ── PyTorch Model Architectures (Restores exact Colab trained architectures) ──

try:
    import torch
    import torch.nn as nn

    class BehaviourGRU(nn.Module):
        """Camera Landmark Sequence Classifier (30 frames x 1503 landmarks) - V1."""
        def __init__(self, input_size=1503, hidden_size=128, num_layers=2, num_classes=3):
            super().__init__()
            self.gru = nn.GRU(
                input_size=input_size,
                hidden_size=hidden_size,
                num_layers=num_layers,
                batch_first=True,
            )
            self.classifier = nn.Sequential(
                nn.Linear(hidden_size, 64),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.Linear(64, num_classes),
            )

        def forward(self, x):
            out, _ = self.gru(x)
            last_hidden = out[:, -1, :]
            return self.classifier(last_hidden)

    class BehaviourBiGRU(nn.Module):
        """Camera Landmark Sequence Classifier with BiGRU and Temporal Attention (30 frames x 1503 landmarks) - V2."""
        def __init__(self, input_size=1503, hidden_size=96, num_layers=2, num_classes=3, dropout=0.35):
            super().__init__()
            self.gru = nn.GRU(
                input_size=input_size,
                hidden_size=hidden_size,
                num_layers=num_layers,
                batch_first=True,
                bidirectional=True,
                dropout=dropout,
            )
            self.attention = nn.Sequential(
                nn.Linear(hidden_size * 2, 64),
                nn.Tanh(),
                nn.Linear(64, 1),
            )
            self.classifier = nn.Sequential(
                nn.Linear(hidden_size * 2, 96),
                nn.ReLU(),
                nn.Dropout(0.4),
                nn.Linear(96, num_classes),
            )

        def forward(self, x):
            gru_out, _ = self.gru(x)
            scores = self.attention(gru_out)
            weights = torch.softmax(scores, dim=1)
            context = torch.sum(weights * gru_out, dim=1)
            return self.classifier(context)

    class AudioFrustrationModel(nn.Module):
        """Voice Acoustic / Frustration Classifier."""
        def __init__(self, input_size=208, num_classes=2):
            super().__init__()
            self.network = nn.Sequential(
                nn.Linear(input_size, 128),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.Linear(128, 64),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.Linear(64, num_classes),
            )

        def forward(self, x):
            return self.network(x)

except ImportError:
    torch = None
    nn = None
    BehaviourGRU = None
    AudioFrustrationModel = None


class BehavioralDetectionService:
    """Orchestrates model inference across all 3 modalities."""

    def __init__(self):
        self.camera_model = None
        self.camera_model_version = None
        self.audio_model = None
        self.interaction_model = None
        self.interaction_scaler = None
        self.preprocessor = None
        self.fusion_engine = MultimodalFusionEngine()

        self._load_models_and_scalers()

    def _load_models_and_scalers(self):
        """Loads PyTorch, Keras, and Scaler artifacts with universal fallback."""
        scaler_mean = None
        scaler_scale = None
        audio_scaler = None

        # 1. Load Camera Scalers
        mean_path = os.path.join(MODELS_DIR, "scaler_mean.npy")
        scale_path = os.path.join(MODELS_DIR, "scaler_scale.npy")
        if os.path.exists(mean_path) and os.path.exists(scale_path):
            try:
                scaler_mean = np.load(mean_path)
                scaler_scale = np.load(scale_path)
                logger.info("[M4 Service] Loaded camera scalers successfully (dim=%d).", scaler_mean.shape[0])
            except Exception as exc:
                logger.warning("[M4 Service] Failed loading camera scalers: %s", exc)

        # 2. Load Audio Scaler (supports both joblib and pickle)
        audio_scaler_path = os.path.join(MODELS_DIR, "audio_scaler.pkl")
        if os.path.exists(audio_scaler_path):
            try:
                import joblib
                audio_scaler = joblib.load(audio_scaler_path)
                logger.info("[M4 Service] Loaded audio scaler with joblib successfully.")
            except Exception:
                try:
                    with open(audio_scaler_path, "rb") as f:
                        audio_scaler = pickle.load(f)
                    logger.info("[M4 Service] Loaded audio scaler with pickle.")
                except Exception as exc:
                    logger.warning("[M4 Service] Could not load audio scaler: %s", exc)

        self.preprocessor = BehavioralPreprocessor(
            scaler_mean=scaler_mean,
            scaler_scale=scaler_scale,
            audio_scaler=audio_scaler,
        )

        # 3. Load Camera PyTorch Model (Prefers V2 BiGRU + Attention if present, falls back to V1 GRU)
        cam_v2_path = os.path.join(MODELS_DIR, "best_behaviour_v2_bigru_attention.pt")
        cam_v1_path = os.path.join(MODELS_DIR, "best_behaviour_gru.pt")

        if os.path.exists(cam_v2_path) and torch is not None and BehaviourBiGRU is not None:
            try:
                ckpt = torch.load(cam_v2_path, map_location=torch.device('cpu'))
                self.camera_model = BehaviourBiGRU(
                    input_size=ckpt.get("input_size", 1503),
                    hidden_size=ckpt.get("hidden_size", 96),
                    num_layers=ckpt.get("num_layers", 2),
                    num_classes=ckpt.get("num_classes", 3),
                )
                state_dict = ckpt["model_state_dict"] if "model_state_dict" in ckpt else ckpt
                self.camera_model.load_state_dict(state_dict)
                self.camera_model.eval()
                self.camera_model_version = "v2_bigru_attention"
                logger.info("[M4 Service] Loaded PyTorch camera BiGRU+Attention (V2) model successfully.")
            except Exception as exc:
                logger.warning("[M4 Service] Could not load V2 camera model (%s). Trying V1 GRU.", exc)

        if self.camera_model is None and os.path.exists(cam_v1_path) and torch is not None and BehaviourGRU is not None:
            try:
                ckpt = torch.load(cam_v1_path, map_location=torch.device('cpu'))
                self.camera_model = BehaviourGRU(
                    input_size=ckpt.get("input_size", 1503),
                    hidden_size=ckpt.get("hidden_size", 128),
                    num_layers=ckpt.get("num_layers", 2),
                    num_classes=ckpt.get("num_classes", 3),
                )
                state_dict = ckpt["model_state_dict"] if "model_state_dict" in ckpt else ckpt
                self.camera_model.load_state_dict(state_dict)
                self.camera_model.eval()
                self.camera_model_version = "v1_gru"
                logger.info("[M4 Service] Loaded PyTorch camera GRU (V1) model successfully.")
            except Exception as exc:
                logger.warning("[M4 Service] Could not load camera GRU (%s). Heuristic fallback active.", exc)

        if self.camera_model is None:
            logger.info("[M4 Service] Camera model running in heuristic fallback mode.")

        # 4. Load Audio PyTorch Model
        audio_model_path = os.path.join(MODELS_DIR, "best_audio_frustration_model.pt")
        if os.path.exists(audio_model_path) and torch is not None and AudioFrustrationModel is not None:
            try:
                ckpt = torch.load(audio_model_path, map_location=torch.device('cpu'))
                self.audio_model = AudioFrustrationModel(
                    input_size=ckpt.get("input_size", 208),
                    num_classes=len(ckpt.get("classes", [0, 1])),
                )
                state_dict = ckpt["model_state_dict"] if "model_state_dict" in ckpt else ckpt
                self.audio_model.load_state_dict(state_dict)
                self.audio_model.eval()
                logger.info("[M4 Service] Loaded PyTorch audio frustration model successfully.")
            except Exception as exc:
                logger.warning("[M4 Service] Could not load audio frustration model (%s).", exc)
        else:
            logger.info("[M4 Service] Audio model running in heuristic fallback mode.")

        # 5. Load Interaction Keras Model
        interaction_model_path = os.path.join(MODELS_DIR, "best_interaction_model.keras")
        if os.path.exists(interaction_model_path):
            try:
                import tensorflow as tf
                self.interaction_model = tf.keras.models.load_model(interaction_model_path)
                logger.info("[M4 Service] Loaded Keras interaction model successfully.")
            except Exception as exc:
                try:
                    from tensorflow import keras
                    self.interaction_model = keras.models.load_model(interaction_model_path)
                    logger.info("[M4 Service] Loaded Keras interaction model successfully via keras.")
                except Exception as inner_exc:
                    logger.warning("[M4 Service] Could not load Keras interaction model (%s). Heuristic fallback active.", inner_exc)
        else:
            logger.info("[M4 Service] Interaction model running in heuristic fallback mode.")

        # 6. Interaction scaler (REQUIRED for the Keras model: it was trained on scaled telemetry).
        interaction_scaler_path = os.path.join(MODELS_DIR, "interaction_scaler.pkl")
        if os.path.exists(interaction_scaler_path):
            try:
                import joblib
                self.interaction_scaler = joblib.load(interaction_scaler_path)
                logger.info("[M4 Service] Loaded interaction scaler.")
            except Exception as exc:
                logger.warning("[M4 Service] Could not load interaction scaler: %s", exc)
        elif self.interaction_model is not None:
            logger.warning(
                "[M4 Service] interaction_scaler.pkl missing — Keras interaction model disabled, "
                "using evidence-based telemetry rules instead."
            )

    def get_status(self) -> dict:
        """Returns readiness status for all model checkpoint and scaler artifacts."""
        files = {
            "best_behaviour_v2_bigru_attention.pt": os.path.exists(os.path.join(MODELS_DIR, "best_behaviour_v2_bigru_attention.pt")),
            "best_behaviour_gru.pt": os.path.exists(os.path.join(MODELS_DIR, "best_behaviour_gru.pt")),
            "scaler_mean.npy": os.path.exists(os.path.join(MODELS_DIR, "scaler_mean.npy")),
            "scaler_scale.npy": os.path.exists(os.path.join(MODELS_DIR, "scaler_scale.npy")),
            "best_audio_frustration_model.pt": os.path.exists(os.path.join(MODELS_DIR, "best_audio_frustration_model.pt")),
            "audio_scaler.pkl": os.path.exists(os.path.join(MODELS_DIR, "audio_scaler.pkl")),
            "best_interaction_model.keras": os.path.exists(os.path.join(MODELS_DIR, "best_interaction_model.keras")),
            "interaction_scaler.pkl": os.path.exists(os.path.join(MODELS_DIR, "interaction_scaler.pkl")),
        }
        loaded_status = {
            "camera_model_loaded": self.camera_model is not None,
            "camera_model_version": self.camera_model_version or "heuristic",
            "audio_model_loaded": self.audio_model is not None,
            "interaction_model_loaded": self.interaction_model is not None,
            "interaction_model_active": self.interaction_model is not None and self.interaction_scaler is not None,
            "interaction_mode": (
                "keras_model" if (self.interaction_model is not None and self.interaction_scaler is not None)
                else "evidence_rules"
            ),
        }
        return {
            "models_directory": MODELS_DIR,
            "artifacts_found": files,
            "all_artifacts_ready": all(files.values()),
            "models_runtime_loaded": loaded_status,
            "classes": CLASSES,
        }

    def _infer_camera(self, camera_tensor: np.ndarray) -> np.ndarray:
        """Runs camera model or heuristic if model not loaded."""
        if camera_tensor is None:
            return None

        if self.camera_model is not None and torch is not None:
            try:
                with torch.no_grad():
                    t_in = torch.from_numpy(camera_tensor).float()
                    out = self.camera_model(t_in)
                    probs = torch.softmax(out, dim=-1).cpu().numpy().flatten()[:3]
                    return probs
            except Exception as exc:
                logger.warning("[M4 Service] Camera inference error: %s", exc)

        return np.array([0.70, 0.20, 0.10], dtype=np.float32)

    def _infer_interaction(self, interaction_vector: np.ndarray, raw_dict: dict) -> np.ndarray:
        """Runs interaction Keras model or evidence-based expert logic rules."""
        if interaction_vector is None:
            return None

        # Evidence-based logic rules from Proposal Section 3.2 & Appendix C
        misses = float(raw_dict.get("missClicks", 0))
        idle = float(raw_dict.get("idleTime", 0))
        retries = float(raw_dict.get("retryCount", 0))
        tap_speed = float(raw_dict.get("tapSpeed", 280))
        skip_freq = float(raw_dict.get("skipFrequency", 0))

        # Frustration rule: High repeated errors / retries / wrong answers / erratic agitation
        if misses >= 2 or retries >= 2 or (tap_speed < 180 and misses >= 1):
            return np.array([0.10, 0.15, 0.75], dtype=np.float32)  # Frustrated

        if misses == 1 or retries == 1:
            return np.array([0.25, 0.25, 0.50], dtype=np.float32)  # Mild hesitation / early struggle

        # Distraction rule: High idle inactivity without interaction or high skipping
        # (Calibrated to 10s as requested for responsive testing and distraction detection)
        if idle >= 9.5 or skip_freq >= 0.35:
            return np.array([0.10, 0.80, 0.10], dtype=np.float32)  # Distracted


        # If PInSoRo movement features are explicitly provided, pass through trained Keras model
        has_pinsoro_features = (
            isinstance(raw_dict, dict)
            and any(k in raw_dict for k in ("pose_movement_mean", "hand_movement_mean", "face_movement_mean"))
        )

        if has_pinsoro_features and self.interaction_model is not None and self.interaction_scaler is not None:
            try:
                scaled = self.interaction_scaler.transform(interaction_vector)
                preds = self.interaction_model.predict(scaled, verbose=0)
                probs = preds.flatten()[:3]
                sum_p = np.sum(probs)
                if sum_p > 0 and not np.isnan(probs).any():
                    return probs / sum_p
            except Exception as exc:
                logger.warning("[M4 Service] Interaction model inference error: %s", exc)

        return np.array([0.85, 0.10, 0.05], dtype=np.float32)  # Engaged


    def _infer_audio(self, audio_vector: np.ndarray, raw_dict: dict) -> float:
        """Runs audio model or heuristic for frustration probability."""
        if isinstance(raw_dict, dict) and raw_dict.get("frustration_probability") is not None:
            return float(raw_dict["frustration_probability"])

        if audio_vector is None:
            return None

        # The trained audio model expects the full 208-dim acoustic feature vector.
        # M1 summary metrics (4 values) are NOT valid model input, so they use the heuristic below.
        if (
            self.audio_model is not None
            and torch is not None
            and audio_vector.shape[-1] == 208
        ):

            try:
                with torch.no_grad():
                    t_in = torch.from_numpy(audio_vector).float()
                    out = self.audio_model(t_in)
                    probs = torch.softmax(out, dim=-1).cpu().numpy().flatten()
                    # Class 1 is 'Frustrated'
                    return float(probs[1]) if len(probs) > 1 else float(probs[0])
            except Exception as exc:
                logger.warning("[M4 Service] Audio inference error: %s", exc)

        # Heuristic audio evaluation based on hesitation & pauses
        if isinstance(raw_dict, dict):
            hesitations = float(raw_dict.get("hesitationCount", 0))
            pauses = float(raw_dict.get("pauseDuration", 0))
            fluency = float(raw_dict.get("fluencyScore", 0.8))
            if fluency > 1.0:
                fluency = fluency / 100.0  # accept 0-100 scale from M1
            if hesitations >= 4 or pauses > 6.0 or fluency < 0.4:
                return 0.75
            elif hesitations >= 2 or pauses > 3.0:
                return 0.40
            return 0.15

        return 0.20

    def detect_behavior(self, payload: dict) -> dict:
        """
        Main detection pipeline:
          1. Extract modalities from payload
          2. Preprocess & Scale
          3. Model Inference
          4. Late Fusion & Intervention Routing
        """
        raw_interaction = payload.get("interaction")
        raw_camera = payload.get("camera")
        raw_voice = payload.get("voice")
        session_id = payload.get("session_id") or payload.get("child_id")

        # Flat payload fallback
        if raw_interaction is None and ("responseTime" in payload or "tapSpeed" in payload):
            raw_interaction = payload

        # Step 1: Preprocess inputs
        cam_tensor = self.preprocessor.preprocess_camera(raw_camera) if raw_camera else None
        int_vector = self.preprocessor.preprocess_interaction(raw_interaction) if raw_interaction else None
        aud_vector = self.preprocessor.preprocess_audio(raw_voice) if raw_voice else None

        # Step 2: Individual model predictions
        cam_probs = self._infer_camera(cam_tensor) if cam_tensor is not None else None
        int_probs = self._infer_interaction(int_vector, raw_interaction or {}) if int_vector is not None else None
        voice_fru_prob = self._infer_audio(aud_vector, raw_voice or {}) if aud_vector is not None else None

        # Step 3: Multimodal Fusion
        state, confidence, weights, intervention = self.fusion_engine.fuse(
            camera_probs=cam_probs,
            interaction_probs=int_probs,
            voice_frustration_prob=voice_fru_prob,
            session_id=session_id,
        )

        return {
            "behaviour_state": state,
            "behavioralState": state,  # camelCase alias for sessionPipeline compatibility
            "confidence": confidence,
            "predictionConfidence": confidence,
            # Engaged => keep reading (celebration reward is optional, not a forced interruption)
            "intervention_required": intervention is not None and state != "Engaged",
            "interventionRequired": intervention is not None and state != "Engaged",
            "intervention": intervention,
            "recommendedIntervention": intervention["game"] if intervention else None,
            "modality_contributions": weights,
        }


# Singleton service instance
behavioral_service = BehavioralDetectionService()
