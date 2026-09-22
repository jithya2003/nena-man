"""
nena-man · backend/app/core/response.py
Standardized JSON response helpers used by all module controllers.

All API responses follow this envelope:
{
    "success": true | false,
    "data": <payload>,
    "message": "Human-readable message",
    "timestamp": "ISO-8601 UTC string"
}
"""

from datetime import datetime, timezone
from flask import jsonify


def _now_iso() -> str:
    """Return current UTC timestamp in ISO-8601 format."""
    return datetime.now(timezone.utc).isoformat()


def success_response(data=None, message: str = "OK", status_code: int = 200):
    """
    Return a standardised success JSON response.

    Args:
        data: Any JSON-serialisable payload.
        message: Human-readable success message.
        status_code: HTTP status code (default 200).

    Returns:
        Flask Response tuple (json, status_code).
    """
    payload = {
        "success": True,
        "data": data,
        "message": message,
        "timestamp": _now_iso(),
    }
    return jsonify(payload), status_code


def error_response(message: str, status_code: int = 400, details=None):
    """
    Return a standardised error JSON response.

    Args:
        message: Human-readable error description.
        status_code: HTTP status code (default 400).
        details: Optional dict with additional debugging context.

    Returns:
        Flask Response tuple (json, status_code).
    """
    payload = {
        "success": False,
        "data": None,
        "message": message,
        "timestamp": _now_iso(),
    }
    if details:
        payload["details"] = details
    return jsonify(payload), status_code


def created_response(data=None, message: str = "Resource created successfully"):
    """Convenience wrapper for 201 Created responses."""
    return success_response(data=data, message=message, status_code=201)
