"""
nena-man · backend/app/core/firebase.py
Firebase Admin SDK initialisation — called once by create_app().

Reads FIREBASE_SERVICE_ACCOUNT_PATH from environment.
If no service account JSON is present (e.g. in local dev without Firebase),
Firebase init is skipped and auth verification falls back to dev mode.
"""

import os
import logging

logger = logging.getLogger(__name__)

_firebase_initialized = False


def init_firebase(app) -> None:
    """
    Initialise Firebase Admin SDK using the service account JSON file.
    Safe to call multiple times — initialises only once.
    """
    global _firebase_initialized
    if _firebase_initialized:
        return

    sa_path = app.config.get("FIREBASE_SERVICE_ACCOUNT_PATH", "")

    if not sa_path or not os.path.isfile(sa_path):
        logger.warning(
            "[Firebase] ⚠️  Service account JSON not found at '%s'. "
            "Firebase Admin SDK NOT initialised. "
            "Auth verification will run in DEV BYPASS MODE — "
            "do NOT use this in production.",
            sa_path
        )
        return

    try:
        import firebase_admin
        from firebase_admin import credentials

        cred = credentials.Certificate(sa_path)
        firebase_admin.initialize_app(cred, {
            "storageBucket": app.config.get("FIREBASE_STORAGE_BUCKET", ""),
        })
        _firebase_initialized = True
        logger.info("[Firebase] ✅ Firebase Admin SDK initialised successfully.")
    except Exception as exc:
        logger.error("[Firebase] ❌ Failed to initialise Firebase Admin SDK: %s", exc)


def verify_id_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token and return its decoded claims.

    Args:
        id_token: Raw JWT string from the Authorization header.

    Returns:
        Decoded token dict with keys: uid, email, name, etc.

    Raises:
        AuthenticationError if token is invalid or Firebase is unavailable.
    """
    from .errors import AuthenticationError

    if not _firebase_initialized:
        # DEV BYPASS — return a mock user so development doesn't need Firebase
        logger.warning("[Firebase] DEV BYPASS: Returning mock token claims.")
        return {
            "uid": "dev-user-001",
            "email": "dev@nena-man.local",
            "name": "Dev User",
        }

    try:
        from firebase_admin import auth
        decoded = auth.verify_id_token(id_token)
        return decoded
    except Exception as exc:
        raise AuthenticationError(f"Invalid or expired Firebase ID token: {exc}") from exc
