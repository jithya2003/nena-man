# M3 — Adaptive Learning Recommendation Engine

**Owner**: P. D. RANAWEERA &nbsp;·&nbsp; IT23199712

> **Status**: Placeholder — implementation begins in Phase 2

## Module Responsibility

This Flask Blueprint generates personalised, explainable learning recommendations for `/api/v1/recommendation/next`.

## Planned Components

| File | Purpose |
|------|---------|
| `controller.py` | Flask Blueprint; defines `/next` route |
| `service.py` | Feature aggregation (speech errors + text difficulty + behavioral state + response latency), RF difficulty-transition classifier, KNN peer-similarity activity selector, SHAP explainability layer |
| `schemas.py` | Marshmallow schemas for unified learner-state vector input and recommendation response |
| `models/` | RF and KNN model checkpoints (gitignored) |

## API Contract (planned)

**POST** `/api/v1/recommendation/next`

Request:
```json
{
  "child_id": "string",
  "speech_errors": {},
  "text_difficulty": "easy|medium|hard",
  "behavior_state": "string",
  "response_latency_ms": 0
}
```

Response:
```json
{
  "recommendation": "Decrease|Maintain|Increase",
  "next_activity_id": "string",
  "rationale": "Human-readable explanation",
  "confidence": 0.0,
  "feature_importances": {}
}
```

## Novel Approach

First multi-signal dyslexia recommendation engine fusing four concurrent input streams into a unified learner-state vector, with ML-driven macro difficulty calibration, peer-similarity activity selection, and a parent-readable explainable AI layer.
