# M1 — Speech & Audio ML Reading Error Classifier

**Owner**: KULATHILAKA A. M. J. S. K &nbsp;·&nbsp; IT23175198

> **Status**: Placeholder — implementation begins in Phase 2

## Module Responsibility

This Flask Blueprint handles real-time speech analysis for the `/api/v1/speech/classify` endpoint.

## Planned Components

| File | Purpose |
|------|---------|
| `controller.py` | Flask Blueprint; defines `/classify` route |
| `service.py` | ASR pipeline (Whisper + Wav2Vec2-BERT), MFCC extraction, RF/SVM/BiLSTM/SinBERT classification |
| `schemas.py` | Marshmallow schemas for audio upload request and error classification response |
| `models/` | Directory for trained model checkpoints (gitignored) |

## API Contract (planned)

**POST** `/api/v1/speech/classify`

Request: `multipart/form-data` — audio file (WAV/FLAC) + `child_id` + `text_id`

Response:
```json
{
  "transcription": "string",
  "errors": [
    { "type": "substitution|omission|reversal|hesitation", "word": "string", "detected": "string", "severity": 0.0 }
  ],
  "overall_severity": 0.0,
  "error_count": 0,
  "accuracy": 0.0
}
```

## Novel Approach

Dual-ASR ensemble (fine-tuned Whisper + Wav2Vec2-BERT) with fused MFCC and contextual embedding features, classified by SinBERT — the first such pipeline optimised for Sinhala children's speech.
