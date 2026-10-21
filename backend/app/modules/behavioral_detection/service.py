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
        """Camera Landmark Sequence Classifier (30 frames x 1503 landmarks)."""
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
            # Use representation from last temporal frame
            last_hidden = out[:, -1, :]
            return self.classifier(last_hidden)

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
        self.audio_model = None
        self.interaction_model = None
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

        # 3. Load Camera PyTorch GRU Model
        cam_model_path = os.path.join(MODELS_DIR, "best_behaviour_gru.pt")
        if os.path.exists(cam_model_path) and torch is not None and BehaviourGRU is not None:
            try:
                ckpt = torch.load(cam_model_path, map_location=torch.device('cpu'))
                self.camera_model = BehaviourGRU(
                    input_size=ckpt.get("input_size", 1503),
                    hidden_size=ckpt.get("hidden_size", 128),
                    num_layers=ckpt.get("num_layers", 2),
                    num_classes=ckpt.get("num_classes", 3),
                )
                state_dict = ckpt["model_state_dict"] if "model_state_dict" in ckpt else ckpt
                self.camera_model.load_state_dict(state_dict)
                self.camera_model.eval()
                logger.info("[M4 Service] Loaded PyTorch camera GRU model successfully.")
            except Exception as exc:
                logger.warning("[M4 Service] Could not load camera GRU (%s). Heuristic fallback active.", exc)
        else:
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

    def get_status(self) -> dict:
        """Returns readiness status for all 6 model checkpoint artifacts."""
        files = {
            "best_behaviour_gru.pt": os.path.exists(os.path.join(MODELS_DIR, "best_behaviour_gru.pt")),
            "scaler_mean.npy": os.path.exists(os.path.join(MODELS_DIR, "scaler_mean.npy")),
            "scaler_scale.npy": os.path.exists(os.path.join(MODELS_DIR, "scaler_scale.npy")),
            "best_audio_frustration_model.pt": os.path.exists(os.path.join(MODELS_DIR, "best_audio_frustration_model.pt")),
            "audio_scaler.pkl": os.path.exists(os.path.join(MODELS_DIR, "audio_scaler.pkl")),
            "best_interaction_model.keras": os.path.exists(os.path.join(MODELS_DIR, "best_interaction_model.keras")),
        }
        loaded_status = {
            "camera_model_loaded": self.camera_model is not None,
            "audio_model_loaded": self.audio_model is not None,
            "interaction_model_loaded": self.interaction_model is not None,
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
        """Runs interaction Keras model or rule-based fallback."""
        if interaction_vector is None:
            return None

        if self.interaction_model is not None:
            try:
                preds = self.interaction_model.predict(interaction_vector, verbose=0)
                probs = preds.flatten()[:3]
                sum_p = np.sum(probs)
                return probs / sum_p if sum_p > 0 else np.array([0.5, 0.3, 0.2], dtype=np.float32)
            except Exception as exc:
                logger.warning("[M4 Service] Interaction model inference error: %s", exc)

        # Intelligent rule-based fallback based on interaction telemetry
        misses = float(raw_dict.get("missClicks", 0))
        idle = float(raw_dict.get("idleTime", 0))
        retries = float(raw_dict.get("retryCount", 0))
        tap_speed = float(raw_dict.get("tapSpeed", 280))

        if misses >= 3 or retries >= 3 or (tap_speed < 180 and misses >= 2):
            return np.array([0.15, 0.20, 0.65], dtype=np.float32)  # Frustrated
        elif idle >= 5.0 or raw_dict.get("skipFrequency", 0) > 0.3:
            return np.array([0.20, 0.65, 0.15], dtype=np.float32)  # Distracted
        else:
            return np.array([0.75, 0.15, 0.10], dtype=np.float32)  # Engaged

    def _infer_audio(self, audio_vector: np.ndarray, raw_dict: dict) -> float:
        """Runs audio model or heuristic for frustration probability."""
        if audio_vector is None:
            return None

        if self.audio_model is not None and torch is not None:
            try:
                with torch.no_grad():
                    # Align feature dimension if needed
                    arr = audio_vector
                    if arr.shape[-1] != 208:
                        # Pad or slice to 208 dimensions
                        if arr.shape[-1] < 208:
                            pad_width = 208 - arr.shape[-1]
                            arr = np.pad(arr, ((0, 0), (0, pad_width)), mode='constant')
                        else:
                            arr = arr[:, :208]
                    t_in = torch.from_numpy(arr).float()
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
        session_id = payload.get("session_id") or payload.get("child_id", "default_session")

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
            "intervention_required": intervention is not None,
            "interventionRequired": intervention is not None,
            "intervention": intervention,
            "recommendedIntervention": intervention["game"] if intervention else None,
            "modality_contributions": weights,
        }


# Singleton service instance
behavioral_service = BehavioralDetectionService()
