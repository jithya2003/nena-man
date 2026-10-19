"""
schemas.py
==========
Module 2: Sinhala Text Difficulty Analysis & Progressive Reading Support
Marshmallow Request and Response Schemas.
"""

from marshmallow import Schema, fields, validate, ValidationError


def _validate_non_empty_text(value: str) -> None:
    if not value or not str(value).strip():
        raise ValidationError("The 'text' field cannot be empty or whitespace only.")


class TextDifficultyRequestSchema(Schema):
    """
    Schema for POST /api/text-difficulty/analyze request body.

    Required fields:
    - text: Sinhala word or short sentence.
    - grade_level: 1, 2, or 3.
    - text_type: "word" or "short sentence".
    """

    text = fields.String(
        required=True,
        validate=_validate_non_empty_text,
        error_messages={"required": "The 'text' field is mandatory."},
    )
    grade_level = fields.Integer(
        required=True,
        validate=validate.OneOf([1, 2, 3], error="Grade level must be 1, 2, or 3."),
        error_messages={"required": "The 'grade_level' field is mandatory."},
    )
    text_type = fields.String(
        required=True,
        validate=validate.OneOf(
            ["word", "short sentence"],
            error="text_type must be either 'word' or 'short sentence'.",
        ),
        error_messages={"required": "The 'text_type' field is mandatory."},
    )
