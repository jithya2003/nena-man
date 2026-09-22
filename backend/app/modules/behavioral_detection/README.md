# M4 — AI-Based Behavioral State Detection & Emotion-Aware Adaptive Intervention

**Owner**: PUSHPAKUMARA A. S. P. L. T &nbsp;·&nbsp; IT23177246

> **Status**: Placeholder — implementation begins in Phase 2

## Module Responsibility

This Flask Blueprint detects real-time behavioral/emotional states and triggers adaptive interventions for `/api/v1/behavior/detect`.

## Planned Components

| File | Purpose |
|------|---------|
| `controller.py` | Flask Blueprint; defines `/detect` route |
| `service.py` | Multimodal feature aggregation (interaction events + voice metrics + attention signals), RF vs XGBoost classifier, Adaptive Cool-Down Engine |
| `schemas.py` | Marshmallow schemas for multimodal signal input and intervention response |
| `models/` | RF and XGBoost model checkpoints (gitignored) |

## Behavioral States

| State | Description |
|-------|-------------|
| `focused` | Child is on-task, low error rate |
| `engaged` | Active participation, positive responses |
| `frustrated` | High error rate, long latency, agitation signals |
| `distracted` | Off-task interaction patterns |
| `tired` | Slowed response, reduced engagement |

## Interventions

| Trigger State | Intervention |
|--------------|-------------|
| `frustrated` | Balloon breathing mini-game |
| `distracted` | Star reward game |
| `tired` | Motivational break prompt |

## API Contract (planned)

**POST** `/api/v1/behavior/detect`

Request: `{ "child_id": "string", "interaction_events": [], "voice_metrics": {}, "session_duration_s": 0 }`

Response:
```json
{
  "state": "focused|engaged|frustrated|distracted|tired",
  "confidence": 0.0,
  "intervention_triggered": true,
  "intervention": "balloon_breathing|star_game|motivational|break",
  "message": "string"
}
```

## Novel Approach

First affective computing layer for a dyslexia reading app — predicts five emotional states from non-intrusive interaction cues (no camera required) and autonomously triggers targeted cool-down activities to protect learner emotional well-being.
