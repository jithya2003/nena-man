"""
nena-man · backend/app/modules/behavioral_detection/preprocessing.py
Feature Extraction, Normalization & Sequence Preprocessing for Multimodal Behavioral Detection.

Supports 3 modalities:
  1. Camera: 30 frames x 1503 landmarks (33 pose + 468 face)
  2. Audio: Voice acoustic / hesitation metrics
  3. Interaction: Touch telemetry (response time, tap speed, idle time, etc.)
"""

import logging
import numpy as np

logger = logging.getLogger(__name__)

# Constants matching Colab training configurations
CAMERA_SEQ_LEN = 30
CAMERA_FEATURE_DIM = 1503

INTERACTION_FEATURE_KEYS = [
    "responseTime",
    "tapSpeed",
    "retryCount",
    "missClicks",
    "idleTime",
    "skipFrequency",
]


class BehavioralPreprocessor:
    """Handles feature transformation, scaling, and sequence padding for all modalities."""

    def __init__(self, scaler_mean: np.ndarray = None, scaler_scale: np.ndarray = None, audio_scaler=None):
        self.camera_mean = scaler_mean
        self.camera_scale = scaler_scale
        self.audio_scaler = audio_scaler

    def preprocess_camera(self, camera_data) -> np.ndarray:
        """
        Preprocesses camera landmark sequence.
        Expects a list or array of shape (N, 1503) or (N, 501, 3).
        Outputs a standardized numpy array of shape (1, 30, 1503).
        """
        if camera_data is None:
            return None

        try:
            arr = np.array(camera_data, dtype=np.float32)

            # Flatten landmark dimensions if provided as (N, 501, 3)
            if arr.ndim == 3 and arr.shape[1] == 501 and arr.shape[2] == 3:
                arr = arr.reshape(arr.shape[0], CAMERA_FEATURE_DIM)

            if arr.ndim == 1:
                # Single frame provided -> expand
                arr = np.repeat(arr[np.newaxis, :], CAMERA_SEQ_LEN, axis=0)
            elif arr.ndim == 2:
                num_frames, feat_dim = arr.shape
                # Ensure feature dimension is 1503 (pad or truncate if minor mismatch)
                if feat_dim < CAMERA_FEATURE_DIM:
                    pad_width = CAMERA_FEATURE_DIM - feat_dim
                    arr = np.pad(arr, ((0, 0), (0, pad_width)), mode='constant')
                elif feat_dim > CAMERA_FEATURE_DIM:
                    arr = arr[:, :CAMERA_FEATURE_DIM]

                # Adjust sequence length to 30 frames
                if num_frames < CAMERA_SEQ_LEN:
                    # Repeat last frame or pad
                    last_frame = arr[-1:] if num_frames > 0 else np.zeros((1, CAMERA_FEATURE_DIM), dtype=np.float32)
                    needed = CAMERA_SEQ_LEN - num_frames
                    pad_frames = np.repeat(last_frame, needed, axis=0)
                    arr = np.concatenate([arr, pad_frames], axis=0)
                elif num_frames > CAMERA_SEQ_LEN:
                    # Take the most recent 30 frames
                    arr = arr[-CAMERA_SEQ_LEN:]

            # Apply z-score normalization if scalers are loaded
            if self.camera_mean is not None and self.camera_scale is not None:
                scale = np.where(self.camera_scale == 0, 1.0, self.camera_scale)
                arr = (arr - self.camera_mean) / scale

            # Add batch dimension: (1, 30, 1503)
            return np.expand_dims(arr, axis=0)

        except Exception as exc:
            logger.warning("[Preprocessor] Failed to preprocess camera data: %s", exc)
            return None

    def preprocess_interaction(self, interaction_data: dict) -> np.ndarray:
        """
        Converts interaction telemetry dict into numpy array:
        [responseTime, tapSpeed, retryCount, missClicks, idleTime, skipFrequency]
        Outputs shape (1, num_features).
        """
        if not interaction_data or not isinstance(interaction_data, dict):
            return None

        try:
            features = [
                float(interaction_data.get("responseTime", 1.2)),
                float(interaction_data.get("tapSpeed", 280.0)),
                float(interaction_data.get("retryCount", 0)),
                float(interaction_data.get("missClicks", 0)),
                float(interaction_data.get("idleTime", 0.0)),
                float(interaction_data.get("skipFrequency", 0.0)),
            ]
            arr = np.array([features], dtype=np.float32)
            return arr
        except Exception as exc:
            logger.warning("[Preprocessor] Failed to preprocess interaction data: %s", exc)
            return None

    def preprocess_audio(self, voice_data) -> np.ndarray:
        """
        Preprocesses acoustic or hesitation metrics from audio/voice input.
        If 208-dim acoustic features or base64 audio are provided, converts to 208-dim
        vector and scales with audio_scaler.pkl.
        Returns scaled numpy array.
        """
        if voice_data is None:
            return None

        try:
            arr = None
            if isinstance(voice_data, dict):
                # 1. Direct 208 features provided
                if "features_208" in voice_data:
                    raw_208 = voice_data["features_208"]
                    arr = np.array(raw_208, dtype=np.float32)
                    if arr.ndim == 1:
                        arr = np.expand_dims(arr, axis=0)

                # 2. Audio base64 provided
                elif "audio_base64" in voice_data:
                    import base64
                    from .audio_extractor import read_audio_bytes_to_waveform, extract_208_features_from_audio
                    raw_bytes = base64.b64decode(voice_data["audio_base64"])
                    waveform = read_audio_bytes_to_waveform(raw_bytes)
                    feats = extract_208_features_from_audio(waveform)
                    arr = np.expand_dims(feats, axis=0)

                # 3. High-level reading metrics
                else:
                    features = [
                        float(voice_data.get("readingSpeed", 60.0)),
                        float(voice_data.get("hesitationCount", 0)),
                        float(voice_data.get("pauseDuration", 0.0)),
                        float(voice_data.get("fluencyScore", 0.8)),
                    ]
                    arr = np.array([features], dtype=np.float32)

            elif isinstance(voice_data, (list, np.ndarray)):
                arr = np.array(voice_data, dtype=np.float32)
                if arr.ndim == 1:
                    arr = np.expand_dims(arr, axis=0)
            else:
                return None

            # Only scale if the vector dimension matches the scaler (208 features)
            if self.audio_scaler is not None and arr is not None and arr.shape[-1] == 208:
                try:
                    arr = self.audio_scaler.transform(arr)
                except Exception as scale_err:
                    logger.warning("[Preprocessor] Audio scaler transform note: %s", scale_err)

            return arr
        except Exception as exc:
            logger.warning("[Preprocessor] Failed to preprocess audio data: %s", exc)
            return None

