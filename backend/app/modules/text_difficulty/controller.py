"""
controller.py
=============
Module 2: Sinhala Text Difficulty Analysis & Progressive Reading Support
Flask Blueprint & REST Controller.

Routes:
  POST /api/text-difficulty/analyze
  POST /api/text-difficulty/analyse
  POST /api/v1/text-difficulty/analyze
  POST /api/v1/text-difficulty/analyse
"""

import logging
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError as MarshmallowValidationError

from app.core.response import _now_iso
from app.core.errors import ValidationError

from .schemas import TextDifficultyRequestSchema
from .service import text_difficulty_service

logger = logging.getLogger(__name__)

# Register Blueprint without fixed url_prefix to cleanly bind /api/text-difficulty and /api/v1/text-difficulty
text_bp = Blueprint("text_difficulty", __name__)

request_schema = TextDifficultyRequestSchema()


def _handle_analyze_request():
    """Shared handler for text difficulty analysis endpoints."""
    raw_payload = request.get_json(silent=True)
    if raw_payload is None:
        raise ValidationError("Request body must be valid JSON.")
    elif not isinstance(raw_payload, dict):
        raise ValidationError("Request body must be a valid JSON object.")

    try:
        validated_data = request_schema.load(raw_payload)
    except MarshmallowValidationError as exc:
        first_err = None
        if isinstance(exc.messages, dict):
            for v in exc.messages.values():
                if isinstance(v, list) and v:
                    first_err = v[0]
                    break
                elif isinstance(v, str):
                    first_err = v
                    break
        err_msg = first_err if first_err else f"Invalid input data: {exc.messages}"
        raise ValidationError(err_msg)

    result = text_difficulty_service.analyze(
        text=validated_data["text"],
        grade_level=validated_data["grade_level"],
        text_type=validated_data["text_type"],
    )

    is_oov = result.get("analysis_status") == "needs_word_confirmation"
    message = (
        result.get("message", "One or more words could not be found in the frequency corpus.")
        if is_oov
        else "Text difficulty analysis completed successfully."
    )

    # Return unified response with both standardized envelope and top-level fields
    response_payload = {
        "success": True,
        "data": result,
        "message": message,
        "timestamp": _now_iso(),
        **result,
    }

    return jsonify(response_payload), 200


@text_bp.route("/api/text-difficulty/analyze", methods=["POST"])
@text_bp.route("/api/text-difficulty/analyse", methods=["POST"])
@text_bp.route("/api/v1/text-difficulty/analyze", methods=["POST"])
@text_bp.route("/api/v1/text-difficulty/analyse", methods=["POST"])
def analyze_text():
    """
    POST /api/text-difficulty/analyze

    Analyzes a Sinhala word or short sentence, predicts reading difficulty level (Easy/Medium/Hard)
    using the Random Forest classifier, and evaluates progressive reading support policies.

    Request Body (JSON):
    {
      "text": "<Sinhala word or short sentence>",
      "grade_level": 1 | 2 | 3,
      "text_type": "word" | "short sentence"
    }

    Response (JSON):
    See API specifications for success and needs_word_confirmation structures.
    """
    return _handle_analyze_request()
