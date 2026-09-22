"""
nena-man · backend/app/core/auth.py
Firebase ID token verification middleware / decorator.

Usage in any Blueprint controller:
    from app.core.auth import require_auth

    @bp.route("/classify", methods=["POST"])
    @require_auth
    def classify(current_user):
        uid = current_user["uid"]
        ...
"""

import logging
from functools import wraps
from flask import request
from .firebase import verify_id_token
from .errors import AuthenticationError

logger = logging.getLogger(__name__)


def require_auth(f):
    """
    Flask route decorator that validates the Firebase ID token from the
    Authorization header (Bearer <token>).

    Injects `current_user` dict as the first argument to the decorated function.
    In DEV BYPASS MODE (no Firebase configured), allows all requests through.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise AuthenticationError(
                "Missing Authorization header. Expected: 'Bearer <Firebase ID Token>'"
            )
        id_token = auth_header.split("Bearer ", 1)[1].strip()
        if not id_token:
            raise AuthenticationError("Empty Bearer token.")

        current_user = verify_id_token(id_token)
        return f(current_user, *args, **kwargs)

    return decorated_function


def optional_auth(f):
    """
    Like require_auth but does NOT block unauthenticated requests.
    Injects `current_user` (dict or None) as first arg.
    Useful for public endpoints that show different content for logged-in users.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        current_user = None
        if auth_header.startswith("Bearer "):
            id_token = auth_header.split("Bearer ", 1)[1].strip()
            try:
                current_user = verify_id_token(id_token)
            except AuthenticationError:
                pass  # Treat as unauthenticated
        return f(current_user, *args, **kwargs)

    return decorated_function
