# M2 — Sinhala Text Difficulty Analysis & Progressive Reading Support

**Owner**: EDIRISOORIYA H. S &nbsp;·&nbsp; IT23179844

> **Status**: Placeholder — implementation begins in Phase 2

## Module Responsibility

This Flask Blueprint handles text difficulty prediction and progressive support recommendations for `/api/v1/text/analyse`.

## Planned Components

| File | Purpose |
|------|---------|
| `controller.py` | Flask Blueprint; defines `/analyse` route |
| `service.py` | Sinhala NLP feature extraction (word length, syllable/akuru count, pillam usage), multi-output RF classifier |
| `schemas.py` | Marshmallow schemas for text input and structured JSON support-flags response |
| `models/` | Trained multi-output RF model checkpoint (gitignored) |

## API Contract (planned)

**POST** `/api/v1/text/analyse`

Request: `{ "text": "string", "child_id": "string" }`

Response:
```json
{
  "difficulty_level": "easy|medium|hard",
  "support_flags": {
    "highlight": true,
    "syllable_split": true,
    "audio": false,
    "picture": false
  },
  "syllables": ["string"],
  "features": {}
}
```

## Novel Approach

Introduces Sinhala-specific dyslexia-aware readability metrics (akuru count, pillam density) in a multi-output classification model that simultaneously predicts difficulty level AND the exact combination of progressive support strategies required.
