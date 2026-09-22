"""
nena-man · backend/app/modules/auth/controller.py
Auth Blueprint — REST endpoints for user registration and profile management.

Routes:
  POST /api/v1/auth/register       — Create Firestore user profile after Firebase client auth
  POST /api/v1/auth/verify-token   — Verify Firebase ID token and return decoded user claims
  GET  /api/v1/auth/profile        — Get current user's Firestore profile (requires auth)
  PUT  /api/v1/auth/profile        — Update profile fields (requires auth)
"""

import logging
from flask import Blueprint, request
from marshmallow import ValidationError as MarshmallowValidationError

from app.core.response import success_response, error_response, created_response
from app.core.errors import ValidationError, NotFoundError
from app.core.auth import require_auth
from app.core.firebase import verify_id_token

from .schemas import RegisterRequestSchema, VerifyTokenRequestSchema
from .service import create_user_profile, get_user_profile, update_user_profile

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

register_schema = RegisterRequestSchema()
verify_schema = VerifyTokenRequestSchema()


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    POST /api/v1/auth/register

    Called immediately after Firebase client-side signup (createUserWithEmailAndPassword).
    Creates the Firestore user profile document with role, grade, and other metadata.

    Body (JSON):
    {
        "uid": "firebase-uid",
        "email": "user@example.com",
        "display_name": "සෙනුලි",
        "role": "child" | "parent" | "teacher",
        "age": 8,          // optional — child only
        "grade": 3,        // optional — child only
        "school_name": "" // optional — parent/teacher
    }
    """
    raw = request.get_json(silent=True)
    if not raw:
        raise ValidationError("Request body must be valid JSON.")

    try:
        data = register_schema.load(raw)
    except MarshmallowValidationError as exc:
        raise ValidationError(str(exc.messages))

    # Check if user already exists
    existing = get_user_profile(data["uid"])
    if existing:
        return success_response(
            data=existing,
            message="User profile already exists.",
            status_code=200
        )

    profile = create_user_profile(data)
    logger.info("[Auth] Registered user uid=%s role=%s", data["uid"], data["role"])
    return created_response(data=profile, message="User profile created successfully.")


@auth_bp.route("/verify-token", methods=["POST"])
def verify_token():
    """
    POST /api/v1/auth/verify-token

    Verify a Firebase ID token and return decoded claims + Firestore profile.
    Used during app startup to confirm session validity.

    Body (JSON):
    { "id_token": "<firebase-jwt>" }
    """
    raw = request.get_json(silent=True)
    if not raw:
        raise ValidationError("Request body must be valid JSON.")

    try:
        data = verify_schema.load(raw)
    except MarshmallowValidationError as exc:
        raise ValidationError(str(exc.messages))

    claims = verify_id_token(data["id_token"])
    uid = claims.get("uid")
    profile = get_user_profile(uid) if uid else None

    return success_response(
        data={
            "claims": claims,
            "profile": profile,
        },
        message="Token verified successfully."
    )


@auth_bp.route("/profile", methods=["GET"])
@require_auth
def get_profile(current_user):
    """
    GET /api/v1/auth/profile
    Headers: Authorization: Bearer <Firebase ID Token>

    Returns the authenticated user's Firestore profile.
    """
    uid = current_user["uid"]
    profile = get_user_profile(uid)
    if not profile:
        raise NotFoundError(f"No profile found for uid={uid}. Please register first.")
    return success_response(data=profile, message="Profile retrieved.")


@auth_bp.route("/profile", methods=["PUT"])
@require_auth
def update_profile(current_user):
    """
    PUT /api/v1/auth/profile
    Headers: Authorization: Bearer <Firebase ID Token>

    Update allowed profile fields.
    """
    uid = current_user["uid"]
    raw = request.get_json(silent=True) or {}

    # Only allow safe fields to be updated
    allowed_fields = {"display_name", "age", "grade", "school_name", "reading_level"}
    updates = {k: v for k, v in raw.items() if k in allowed_fields}

    if not updates:
        raise ValidationError("No valid fields provided for update.")

    updated = update_user_profile(uid, updates)
    if not updated:
        raise NotFoundError(f"No profile found for uid={uid}.")

    return success_response(data=updated, message="Profile updated successfully.")
