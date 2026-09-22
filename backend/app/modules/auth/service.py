"""
nena-man · backend/app/modules/auth/service.py
Auth business logic — Firestore user profile management.

Responsibilities:
  - Create user profile document in Firestore on first registration.
  - Retrieve user profile by UID.
  - Update user profile fields.

Firestore Collection Structure:
  users/{uid}
    ├── uid: string
    ├── email: string
    ├── display_name: string
    ├── role: "child" | "parent" | "teacher"
    ├── age: int | null
    ├── grade: int | null
    ├── school_name: string | null
    ├── stars: int (default 0)
    ├── streak: int (default 0)
    ├── reading_level: "easy" | "medium" | "hard" (default "easy")
    ├── created_at: ISO-8601 timestamp
    └── updated_at: ISO-8601 timestamp
"""

import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_firestore():
    """Get Firestore client. Returns None if Firebase is not initialized (dev bypass)."""
    try:
        from firebase_admin import firestore
        return firestore.client()
    except Exception as exc:
        logger.warning("[AuthService] Firestore not available: %s — using in-memory stub.", exc)
        return None


# In-memory stub store for dev bypass mode (no Firebase)
_DEV_USER_STORE: dict = {}


def create_user_profile(data: dict) -> dict:
    """
    Create a user profile document in Firestore.
    If Firebase is not configured, stores in memory (dev mode).

    Args:
        data: Validated dict from RegisterRequestSchema.

    Returns:
        The created user profile dict.
    """
    uid = data["uid"]
    now = _now_iso()

    profile = {
        "uid": uid,
        "email": data["email"],
        "display_name": data["display_name"],
        "role": data["role"],
        "age": data.get("age"),
        "grade": data.get("grade"),
        "school_name": data.get("school_name"),
        "stars": 0,
        "streak": 0,
        "reading_level": "easy",
        "created_at": now,
        "updated_at": now,
    }

    db = _get_firestore()
    if db:
        db.collection("users").document(uid).set(profile)
        logger.info("[AuthService] Created Firestore profile for uid=%s role=%s", uid, data["role"])
    else:
        _DEV_USER_STORE[uid] = profile
        logger.info("[AuthService] DEV: Stored in-memory profile for uid=%s", uid)

    return profile


def get_user_profile(uid: str) -> dict | None:
    """
    Retrieve user profile from Firestore by UID.
    Returns None if the user does not exist.

    Args:
        uid: Firebase UID string.

    Returns:
        User profile dict or None.
    """
    db = _get_firestore()
    if db:
        doc = db.collection("users").document(uid).get()
        if doc.exists:
            return doc.to_dict()
        return None
    # Dev bypass
    return _DEV_USER_STORE.get(uid)


def update_user_profile(uid: str, updates: dict) -> dict | None:
    """
    Partially update a user profile.

    Args:
        uid: Firebase UID.
        updates: Dict of fields to update.

    Returns:
        Updated profile dict or None if user not found.
    """
    profile = get_user_profile(uid)
    if not profile:
        return None

    updates["updated_at"] = _now_iso()
    profile.update(updates)

    db = _get_firestore()
    if db:
        db.collection("users").document(uid).update(updates)
    else:
        _DEV_USER_STORE[uid] = profile

    return profile
