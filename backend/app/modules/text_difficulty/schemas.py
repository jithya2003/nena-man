"""
schemas.py
==========
Module 2: Sinhala Text Difficulty Analysis & Progressive Reading Support
Marshmallow Request and Response Schemas.
"""

import re
from marshmallow import Schema, fields, validate, ValidationError, validates_schema

MAX_SHORT_SENTENCE_WORDS = 18
SHORT_SENTENCE_WORD_LIMIT_MSG = "කෙටි වාක්‍යයක් සඳහා උපරිම වචන 18ක් පමණක් ඇතුළත් කළ හැක."
PUNCT_PATTERN = re.compile(r"^[\.,!?:;\'\"“”‘’`\(\)\[\]\{\}\-—_/\~@#\$%\^&\*\+=<>|\\।॥]+$")


def count_words(text: str) -> int:
    """
    Counts words by normalizing whitespace and ignoring punctuation-only tokens.
    """
    if not text:
        return 0
    cleaned = re.sub(r"\s+", " ", text.strip())
    tokens = [t for t in cleaned.split(" ") if t]
    return sum(1 for t in tokens if not PUNCT_PATTERN.match(t))


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

    @validates_schema
    def validate_word_limit(self, data, **kwargs):
        text_type = data.get("text_type")
        text = data.get("text", "")
        if text_type == "short sentence":
            words = count_words(text)
            if words > MAX_SHORT_SENTENCE_WORDS:
                raise ValidationError(SHORT_SENTENCE_WORD_LIMIT_MSG, field_name="text")
