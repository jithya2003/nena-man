# Backend — Flask REST API

> **Status**: Placeholder scaffold — Phase 2 (not yet implemented)

This directory will contain the Flask REST API that serves all four AI modules to the React Native frontend.

## Planned Structure

```
backend/
├── app/
│   ├── __init__.py              # create_app() factory
│   ├── config.py                # DevelopmentConfig / ProductionConfig
│   ├── core/                    # Shared utilities
│   │   ├── firebase.py          # Firebase Admin SDK init
│   │   ├── auth.py              # Token verification middleware
│   │   ├── response.py          # Standardised JSON response helpers
│   │   └── model_loader.py      # Generic model load / cache utility
│   └── modules/
│       ├── speech_classifier/   # M1 — Blueprint
│       ├── text_difficulty/     # M2 — Blueprint
│       ├── recommendation_engine/ # M3 — Blueprint
│       └── behavioral_detection/  # M4 — Blueprint
├── tests/                       # Pytest test suites
├── requirements.txt
├── run.py                       # Flask dev entry point
└── wsgi.py                      # Production WSGI entry point
```

## Module Owners

| Module directory | Owner | IT No. |
|------------------|-------|--------|
| `speech_classifier/` | KULATHILAKA A.M.J.S.K | IT23175198 |
| `text_difficulty/` | EDIRISOORIYA H.S | IT23179844 |
| `recommendation_engine/` | P.D. RANAWEERA | IT23199712 |
| `behavioral_detection/` | PUSHPAKUMARA A.S.P.L.T | IT23177246 |

## API Design (planned)

| Method | Endpoint | Module |
|--------|----------|--------|
| POST | `/api/v1/speech/classify` | M1 |
| POST | `/api/v1/text/analyse` | M2 |
| POST | `/api/v1/recommendation/next` | M3 |
| POST | `/api/v1/behavior/detect` | M4 |

## Setup (Phase 2)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
python run.py
```

> ⚠️ Trained model checkpoints must be placed in each module's `models/` directory.
> See `ml/README.md` for download instructions.
