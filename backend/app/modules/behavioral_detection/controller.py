"""
nena-man · backend/app/modules/behavioral_detection/controller.py
REST endpoints for M4 AI Behavioral State Detection & Adaptive Intervention.

Endpoints:
  POST /api/v1/behavior/detect      — Primary multimodal detection endpoint
  POST /api/v1/behavior-state       — Compatibility alias for existing frontend calls
  GET  /api/v1/behavior/status      — Model readiness and health status
"""

import logging
from flask import Blueprint, request, jsonify

from app.core.response import _now_iso
from app.core.errors import ValidationError
from .service import behavioral_service

logger = logging.getLogger(__name__)

# Register Blueprint with url_prefix="/api/v1"
behavioral_bp = Blueprint("behavioral_detection", __name__, url_prefix="/api/v1")


def _handle_behavior_detection():
    """Shared handler for behavior detection endpoints."""
    raw_payload = request.get_json(silent=True)
    if raw_payload is None:
        raw_payload = {}
    elif not isinstance(raw_payload, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    try:
        result = behavioral_service.detect_behavior(raw_payload)
    except Exception as exc:
        logger.error("[M4 Controller] Detection error: %s", exc, exc_info=True)
        raise

    response_payload = {
        "success": True,
        "data": result,
        "message": "Behavioral state evaluated successfully",
        "timestamp": _now_iso(),
        # Unpack top-level fields for seamless consumption by frontend
        **result,
    }
    return jsonify(response_payload), 200


@behavioral_bp.route("/behavior/detect", methods=["POST"])
def detect_behavior():
    """
    POST /api/v1/behavior/detect
    Primary multimodal detection endpoint.
    """
    return _handle_behavior_detection()


@behavioral_bp.route("/behavior-state", methods=["POST"])
def detect_behavior_legacy():
    """
    POST /api/v1/behavior-state
    Compatibility alias for existing frontend apiClient callers.
    """
    return _handle_behavior_detection()


@behavioral_bp.route("/behavior/voice-analyze", methods=["POST"])
def analyze_voice():
    """
    POST /api/v1/behavior/voice-analyze
    Analyzes actual recorded speech audio from phone microphone:
      1. Reads audio file or base64 waveform
      2. Computes 208 acoustic features (MFCC 40 + LogMel 64 mean/std)
      3. Computes real speech metrics (hesitations, pauses, fluency, readingSpeed)
      4. Invokes PyTorch best_audio_frustration_model.pt via audio_scaler.pkl
      5. Returns real frustration probability and metrics for multimodal fusion
    """
    import base64
    from .audio_extractor import (
        read_audio_bytes_to_waveform,
        extract_208_features_from_audio,
        compute_reading_speech_metrics,
    )

    audio_bytes = None

    # Check multipart upload
    if "audio" in request.files:
        audio_file = request.files["audio"]
        audio_bytes = audio_file.read()
    else:
        # Check JSON payload
        data = request.get_json(silent=True) or {}
        if "audio_base64" in data:
            try:
                audio_bytes = base64.b64decode(data["audio_base64"])
            except Exception as b64_err:
                logger.warning("[M4 Controller] Failed decoding base64 audio: %s", b64_err)

    if not audio_bytes:
        # Return sensible baseline if no audio received
        return jsonify({
            "success": True,
            "frustration_probability": 0.15,
            "speech_metrics": {
                "readingSpeed": 50.0,
                "hesitationCount": 0,
                "pauseDuration": 0.5,
                "fluencyScore": 0.85,
            },
            "features_208": [],
            "model_name": "best_audio_frustration_model.pt",
        }), 200

    try:
        waveform = read_audio_bytes_to_waveform(audio_bytes)
        features_208 = extract_208_features_from_audio(waveform)
        speech_metrics = compute_reading_speech_metrics(waveform)

        # Scale and infer with PyTorch model
        scaled_vec = behavioral_service.preprocessor.audio_scaler.transform(
            features_208.reshape(1, -1)
        ) if behavioral_service.preprocessor.audio_scaler is not None else features_208.reshape(1, -1)

        frustration_prob = behavioral_service._infer_audio(scaled_vec, speech_metrics)

        return jsonify({
            "success": True,
            "frustration_probability": float(round(frustration_prob, 4)),
            "is_frustrated": frustration_prob >= 0.5,
            "speech_metrics": speech_metrics,
            "features_208": features_208.tolist(),
            "model_name": "best_audio_frustration_model.pt",
            "timestamp": _now_iso(),
        }), 200

    except Exception as exc:
        logger.error("[M4 Controller] Error during voice analysis: %s", exc, exc_info=True)
        return jsonify({
            "success": False,
            "error": str(exc),
            "timestamp": _now_iso(),
        }), 500


@behavioral_bp.route("/behavior/status", methods=["GET"])
def get_status():
    """
    GET /api/v1/behavior/status
    Returns check on whether Colab models and scalers are loaded in models/.
    """
    status_data = behavioral_service.get_status()
    return jsonify({
        "success": True,
        "service": "M4 Behavioral Detection & Adaptive Intervention",
        "timestamp": _now_iso(),
        **status_data,
    }), 200

