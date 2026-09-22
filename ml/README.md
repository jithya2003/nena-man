# ML Research Workspace

> **Status**: Placeholder scaffold — implementation begins in Phase 2

This directory is the **research workspace** — separate from the served backend code. Notebooks, training scripts, and experiments live here; trained checkpoints and raw datasets do **not** live in git.

## Structure

```
ml/
├── notebooks/          # EDA and experiment notebooks (one subfolder per module)
│   ├── m1_speech_classifier/
│   ├── m2_text_difficulty/
│   ├── m3_recommendation/
│   └── m4_behavioral/
├── training/           # Standalone training scripts
│   ├── m1_speech_classifier/
│   ├── m2_text_difficulty/
│   ├── m3_recommendation/
│   └── m4_behavioral/
├── data/               # ⚠️  gitignored — place raw datasets here locally
└── checkpoints/        # ⚠️  gitignored — place trained models here locally
```

## ⚠️ Data & Checkpoint Storage

Raw datasets and trained model files are **NOT stored in git**. They are stored externally.

| Resource | Location |
|----------|----------|
| Raw audio dataset | Google Drive (link TBD — added by each module owner) |
| Raw text dataset | Google Drive (link TBD) |
| Trained checkpoints (*.pt, *.pkl, *.h5) | Google Drive / HuggingFace Hub (link TBD) |

### How to restore locally

1. Download the required files from the shared Google Drive folder (link shared via team WhatsApp)
2. Place raw data files in `ml/data/`
3. Place trained checkpoints in `ml/checkpoints/<module>/`
4. Place checkpoint copies in `backend/app/modules/<module>/models/` for serving

## Notebook Naming Convention

```
NN_description.ipynb
```

Examples: `01_eda.ipynb`, `02_feature_engineering.ipynb`, `03_model_training.ipynb`

**Before committing a notebook**: Clear all output cells (`Kernel → Restart & Clear Output`) to keep diffs readable and avoid committing embedded data.

## Module Owners

| Directory | Owner | IT No. |
|-----------|-------|--------|
| `m1_speech_classifier/` | KULATHILAKA A.M.J.S.K | IT23175198 |
| `m2_text_difficulty/` | EDIRISOORIYA H.S | IT23179844 |
| `m3_recommendation/` | P.D. RANAWEERA | IT23199712 |
| `m4_behavioral/` | PUSHPAKUMARA A.S.P.L.T | IT23177246 |
