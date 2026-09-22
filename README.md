# 🌟 නැණ මං (Nena-Man)

### AI-Powered Sinhala Dyslexia Reading Assistant

**SLIIT IT4010 &nbsp;·&nbsp; Project ID: J26-IT-361 &nbsp;·&nbsp;

---

## Overview

**Nena-Man** (නැණ මං) is an integrated, AI-powered mobile reading assistant designed for Sinhala-speaking children aged 7–8 with dyslexia. It combines four specialised AI modules to deliver real-time, personalised, and emotionally adaptive reading interventions — bridging a critical gap in localised, intelligent special-education tools for Sri Lankan children.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile App** | React Native · Expo SDK 52 · Expo Router (file-based routing) |
| **Backend API** | Python 3.11 · Flask REST API |
| **Database / Auth** | Firebase Firestore · Firebase Authentication |
| **ML Inference** | Served via Flask API (not on-device) |
| **ML Training** | scikit-learn · PyTorch · HuggingFace Transformers |

---

## Repository Structure

```
nena-man/
├── frontend/          # Expo / React Native mobile prototype
│   ├── app/           # Expo Router pages (file-based routing)
│   ├── components/    # Shared UI components
│   ├── constants/     # Design tokens (theme, colours, typography)
│   ├── mock/          # Mock AI responses for prototype demo
│   └── types/         # TypeScript type definitions
│
├── backend/           # Flask REST API — 4 independent module Blueprints
│   └── app/modules/
│       ├── speech_classifier/
│       ├── text_difficulty/
│       ├── recommendation_engine/
│       └── behavioral_detection/
│
├── ml/                # Research workspace — notebooks & training scripts
│   ├── notebooks/     # EDA and experiment notebooks (per module)
│   ├── training/      # Model training scripts
│   ├── data/          # ⚠️  gitignored — raw datasets stored externally
│   └── checkpoints/   # ⚠️  gitignored — trained models stored externally
│
└── docs/              # Project documentation
    ├── taf/           # Topic Assessment Form
    ├── architecture/  # System diagrams
    ├── meeting-notes/ # Sprint / weekly meeting notes
    └── api/           # API contract documentation
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 20, npm ≥ 10
- Expo Go app on a physical device **or** Android / iOS simulator
- Python 3.11 (for backend — Phase 2)
- Firebase project (see `docs/architecture/README.md`)

### Frontend (Prototype — current phase)

```bash
cd frontend
cp .env.example .env          # fill in your Firebase config values
npm install
npx expo start                # scan QR code with Expo Go
```

### Backend (Phase 2)

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env          # fill in secrets
python run.py                 # starts Flask dev server on :5000
```

> **⚠️ Model Checkpoints** — Trained model files are **NOT** stored in git.
> See `ml/README.md` for instructions on downloading checkpoints from cloud storage.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch naming conventions and commit message guidelines.

---

## License

Academic use only — SLIIT IT4010 Final Year Project, 2025/26.
