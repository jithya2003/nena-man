# Contributing to Nena-Man

We are a 4-person university project team. This guide keeps our commit history readable, merges conflict-free, and secrets safe.

---

## Branch Naming Convention

```
<type>/<module>-<short-description>
```

### Types

| Type | When to use |
|------|-------------|
| `feature` | Adding new functionality |
| `fix` | Fixing a bug |
| `refactor` | Code restructuring with no behaviour change |
| `docs` | Documentation changes only |
| `chore` | Build config, dependencies, tooling |
| `experiment` | ML experiments in the `ml/` workspace |
| `style` | UI-only tweaks (colours, spacing, typography) |

### Module tokens

| Token | Covers |
|-------|--------|
| `m1` | Speech error classifier |
| `m2` | Text difficulty & progressive support |
| `m3` | Recommendation engine |
| `m4` | Behavioral detection & intervention |
| `frontend` | Shared UI, navigation, or app shell |
| `backend` | Shared backend core / infra |
| `infra` | Firebase, CI/CD, deployment config |

### Examples

```
feature/m1-whisper-asr-pipeline
feature/m2-multi-output-rf-classifier
feature/frontend-reading-session-screen
fix/m3-knn-null-embedding-keyerror
refactor/m4-cooldown-engine-state-machine
docs/architecture-conceptual-diagram
chore/frontend-expo-sdk-52-upgrade
experiment/m1-sinbert-fine-tuning
```

---

## Commit Message Format

We follow a simplified [Conventional Commits](https://www.conventionalcommits.org/) style:

```
<type>(<scope>): <imperative-mood summary — ≤72 chars>

[optional body: explain WHY, not WHAT — wrap at 72 chars]

[optional footer: Closes #<issue>, BREAKING CHANGE: ...]
```

### Rules

1. **Subject line**: ≤ 72 characters, **imperative mood** ("Add", not "Added" or "Adding")
2. **Body**: Use when the commit is non-obvious — explain motivation, trade-offs, or context
3. **Never commit secrets**: `.env` files, Firebase credentials, any API key
4. **No large binary files**: `*.pkl` / `*.pt` / `*.h5` / `*.wav` datasets → cloud storage only

### Good Examples

```
feat(m1): add Wav2Vec2 embedding extraction to preprocessing pipeline

Integrates HuggingFace wav2vec2-base to extract 768-dim contextual
embeddings alongside MFCC features. Closes #14.
```

```
fix(m3): handle missing latency feature in KNN feature vector

Response latency is nullable for new users, causing a KeyError.
Now defaults to the session median when the field is absent.
```

```
feat(frontend): implement reading session screen with mock M1 results

Adds the core reading screen: text display, animated record button,
and a mock AI analysis result panel showing error type badges and
severity score. Navigation to the support screen on completion.
```

```
docs: add system architecture diagram to docs/architecture/
```

---

## Pull Request Checklist

Before opening a PR to `main`:

- [ ] Branch is rebased or merged against latest `main`
- [ ] Code runs without errors locally (`npm start` or `python run.py`)
- [ ] No `.env` files, API keys, or large binary files committed
- [ ] PR title follows the commit format
- [ ] PR description explains *what* changed and *why*
- [ ] At least **one teammate** has reviewed and approved

---

## Branch Strategy

```
main            ← protected; merges via reviewed PRs only
│
├── feature/frontend-welcome-screen
├── feature/m1-asr-pipeline
├── feature/m2-text-difficulty-model
├── feature/m3-recommendation-engine
└── feature/m4-behavioral-detection
```

Keep feature branches **short-lived** (days, not weeks). Merge small, merge often to avoid painful conflicts.

---

## Coding Conventions

### Frontend (React Native / TypeScript)

- Use `StyleSheet.create` — no inline style objects
- Name screens with the `Screen` suffix: `HomeScreen`, `ReadingScreen`
- Keep components in `frontend/components/`, screens in `frontend/app/`
- All API calls go through `frontend/services/` (not in components or screens)
- Use the shared design tokens from `frontend/constants/theme.ts`

### Backend (Python / Flask) — Phase 2

- Follow PEP 8; max line length 100
- Keep ML inference logic in `service.py`, route handlers thin in `controller.py`
- Every endpoint must validate input via a Marshmallow schema
- Write a pytest test for every new endpoint

### ML (Notebooks / Training) — Phase 2

- Name notebooks: `NN_description.ipynb` (e.g. `01_eda.ipynb`, `02_feature_engineering.ipynb`)
- Commit only cleaned notebooks (no output cells) — clear outputs before committing
- Document dataset provenance and preprocessing steps in the notebook's first cell
