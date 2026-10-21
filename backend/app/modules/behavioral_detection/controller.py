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
