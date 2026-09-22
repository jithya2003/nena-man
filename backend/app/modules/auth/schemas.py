"""
nena-man · backend/app/modules/auth/schemas.py
Marshmallow schemas for Auth request/response validation.
"""

from marshmallow import Schema, fields, validate, validates, ValidationError


class RegisterRequestSchema(Schema):
    """Schema for POST /api/v1/auth/register"""
    uid = fields.Str(required=True, metadata={"description": "Firebase UID from client-side auth"})
    email = fields.Email(required=True)
    display_name = fields.Str(required=True, validate=validate.Length(min=2, max=80))
    role = fields.Str(
        required=True,
        validate=validate.OneOf(["child", "parent", "teacher"]),
        metadata={"description": "User role determines which screens and data they see"}
    )
    # Optional child-specific fields
    age = fields.Int(load_default=None, validate=validate.Range(min=5, max=15))
    grade = fields.Int(load_default=None, validate=validate.Range(min=1, max=13))
    # Optional parent/teacher-specific
    school_name = fields.Str(load_default=None, validate=validate.Length(max=120))


class UserProfileResponseSchema(Schema):
    """Shape of user profile data returned from Firestore."""
    uid = fields.Str()
    email = fields.Str()
    display_name = fields.Str()
    role = fields.Str()
    age = fields.Int(allow_none=True)
    grade = fields.Int(allow_none=True)
    school_name = fields.Str(allow_none=True)
    stars = fields.Int()
    streak = fields.Int()
    reading_level = fields.Str()
    created_at = fields.Str()


class VerifyTokenRequestSchema(Schema):
    """Schema for POST /api/v1/auth/verify-token"""
    id_token = fields.Str(required=True, metadata={"description": "Firebase ID token JWT"})
