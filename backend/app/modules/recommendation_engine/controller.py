"""
nena-man · backend/app/modules/recommendation_engine/controller.py
Recommendation Engine Blueprint — REST endpoints for M3 Adaptive Learning Recommendations.

Routes:
  POST /api/v1/recommendation/next  — Primary M3 recommendation endpoint (documented contract)
  POST /api/v1/recommend            — Direct endpoint alias for session pipeline
"""

import logging
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError as MarshmallowValidationError

from app.core.response import _now_iso
from app.core.errors import ValidationError
from .schemas import RecommendationRequestSchema
from .service import recommendation_service

logger = logging.getLogger(__name__)

# Register Blueprint with url_prefix="/api/v1" so both /recommendation/next and /recommend are exposed
recommendation_bp = Blueprint("recommendation", __name__, url_prefix="/api/v1")

request_schema = RecommendationRequestSchema()


def _handle_recommendation_request():
    """
    Shared handler for both recommendation endpoints.
    Accepts both camelCase (sessionPipeline) and snake_case (recommendationService) payloads.
    """
    raw_payload = request.get_json(silent=True)
    if raw_payload is None:
        raw_payload = {}
    elif not isinstance(raw_payload, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    # Validate and normalize input schema
    try:
        validated_data = request_schema.load(raw_payload)
    except MarshmallowValidationError as exc:
        raise ValidationError(f"Invalid recommendation input: {exc.messages}")

    try:
        result = recommendation_service.generate_recommendation(
            validated_data, raw_payload=raw_payload
        )
    except Exception as exc:
        logger.error("[M3 Controller] Failed to generate recommendation: %s", exc, exc_info=True)
        raise

    # Return standardized envelope including top-level fields for seamless frontend consumption
    response_payload = {
        "success": True,
        "data": result,
        "message": "Recommendation generated successfully",
        "timestamp": _now_iso(),
        # Top-level unpacked fields ensure zero-breakage direct access by frontend components
        **result,
    }
    return jsonify(response_payload), 200


@recommendation_bp.route("/recommendation/next", methods=["POST"])
def get_next_recommendation():
    """
    POST /api/v1/recommendation/next
    Used by frontend/services/recommendationService.ts.
    """
    return _handle_recommendation_request()


@recommendation_bp.route("/recommend", methods=["POST"])
def get_recommendation():
    """
    POST /api/v1/recommend
    Used by frontend/api/endpoints.ts (session pipeline orchestrator).
    """
    return _handle_recommendation_request()
