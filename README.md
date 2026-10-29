# 🌟 නැණ මං (Nena-Man)

### AI-Powered Sinhala Dyslexia Reading Assistant & Adaptive Intervention Platform

**SLIIT IT4010 &nbsp;·&nbsp; Final Year Research Project &nbsp;·&nbsp; Project ID: J26-IT-361 (2025/2026)**

---

## 📖 Executive Summary

**Nena-Man (නැණ මං)** is an intelligent, emotionally adaptive, multimodal reading assistant mobile platform specifically designed for Sinhala-speaking primary school children (ages 7–8) diagnosed with or displaying symptoms of developmental dyslexia. 

In Sinhala orthography, complex glyph structures, syllabic ligatures (*Pillam* / පිල්ලම්), and visually similar graphemes pose severe cognitive hurdles. **Nena-Man** bridges the critical void in localized assistive educational technology by unifying **four specialized AI research modules** into an integrated, real-time closed-loop intervention ecosystem:

1. **Speech Analysis & Dyslexia Error Classification** (Fine-tuned Wav2Vec2 CTC Sinhala ASR, Balanced Random Forest reading error classification, and reading accuracy & fluency indicators)
2. **Sinhala Text Difficulty Analysis & Progressive Reading Support** (Difficulty classification, Akuru & Pillam analysis, multi-level reading assistance, and safety-gated AI text simplification)
3. **Adaptive Pedagogical Recommendation & Explainable AI (XAI)** (State-driven curriculum adaptation with SHAP)
4. **Multimodal Affective & Behavioral Detection** (Camera, voice & touch dynamics with interactive calming mini-games)

---

## 👥 Research Team & Individual Modules

| Module | Research Domain & Scope | Researcher | Student ID |
| :--- | :--- | :--- | :--- |
| **M1** | **Speech & Audio ML Reading Error Classifier**<br>Fine-tuned Wav2Vec2 CTC Sinhala ASR combined with a Balanced Random Forest classifier over hybrid acoustic and ASR/text features, classifying reading outcomes as Correct, Substitution, Omission, or Hesitation, with reading accuracy and fluency indicators. | **KULATHILAKA A. M. J. S. K.** | `IT23175198` |
| **M2** | **Sinhala Text Difficulty Analysis & Progressive Reading Support**<br>Multi-output Random Forest difficulty and support prediction using grade level, Akuru count, Pillam count, and word-frequency features, combined with progressive Highlight, Akuru Split, Audio, and AI Sinhala Text Simplification support. | **EDIRISOORIYA H. S.** | `IT23179844` |
| **M3** | **Adaptive Learning Recommendation Engine & Explainable AI**<br>Multi-signal learner state modeling (11 features), RF difficulty transition (Decrease/Maintain/Increase), KNN peer-similarity activity selection (20 Sinhala exercises), and dual-audience SHAP explanations (Parent/Teacher). | **P. D. RANAWEERA** | `IT23199712` |
| **M4** | **Multimodal Behavioral State Detection & Adaptive Intervention**<br>Real-time affective computing (Engaged, Distracted, Frustrated) fusing vision, acoustic, and touch dynamics with automated cool-down interventions. | **PUSHPAKUMARA A. S. P. L. T.** | `IT23177246` |

---

## 🧠 Comprehensive AI Architecture & Models

```
┌────────────────────────────────────────────────────────────────────────┐
│                      NENA-MAN CLIENT (EXPO / REACT NATIVE)             │
│  - Child Reading UI            - Camera Landmarks / MediaPipe Stream   │
│  - Real-Time Voice Recording   - Touch Dynamics & Interaction Telemetry│
│  - Gamified Interventions (Breathing, Star Catch, Bubble Pop Games)    │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTP / REST API (JSON & Multipart)
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       FLASK BACKEND REST API GATEWAY                   │
│               (BaseModelSlot Abstraction · ML & Heuristic Modes)       │
└───────┬─────────────────┬──────────────────┬───────────────────┬───────┘
        │                 │                  │                   │
        ▼                 ▼                  ▼                   ▼
┌───────────────┐ ┌───────────────┐  ┌───────────────┐   ┌───────────────┐
│  M1: Speech   │ │   M2: Text    │  │  M3: Adaptive │   │ M4: Behavioral│
│ Classifier    │ │  Difficulty   │  │Recommendation │   │   Detection   │
├───────────────┤ ├───────────────┤  ├───────────────┤   ├───────────────┤
│• Wav2Vec2 CTC │ │• Akuru/Pillam │  │• Random Forest│   │• PyTorch      │
│  Sinhala ASR  │ │  Feature Ext. │  │  Transition   │   │  BiGRU + Attn │
│• Acoustic/Text│ │• Multi-Output │  │  Classifier   │   │  (Vision)     │
│  Features     │ │  Random Forest│  │• KNN Activity │   │• 208-Feature  │
│• Balanced RF  │ │• mT5-small +  │  │  Recommender  │   │  Acoustic Net │
│  Classifier   │ │  LoRA Simplify│  │• SHAP XAI     │   │• Keras Touch  │
│• Error/Fluency│ │• Level 1-4 Sup│  │  Explainer    │   │• Late-Fusion  │
└───────────────┘ └───────────────┘  └───────────────┘   └───────────────┘
```

> **M1 deployment note:** M1 inference runs in a **separate Python FastAPI service**, not through the shared Flask gateway. During research testing it runs in Google Colab and is exposed over HTTPS via a Cloudflare Tunnel. The Expo app calls it directly (`POST /analyze-reading`) through `frontend/api/readingAIClient.ts`.

### Module 1: Speech & Reading Error Classifier (KULATHILAKA A. M. J. S. K. · `IT23175198`)
* **Objective:** Take a child's recorded Sinhala reading audio, compare what was spoken with the expected reading text, identify word-level reading errors, and return reading performance and fluency indicators. This is an educational research prototype, **not** a clinical dyslexia diagnosis tool.
* **Dataset Collection & Annotation:**
  * 21 recordings from 21 Sinhala-speaking children with dyslexia, aged 7–9, reading Sinhala letters, words, sentences, and short passages.
  * Recordings were split into reading-task clips and annotated with the expected text, a manual transcription of the spoken text, word-level reading error labels, anonymized child identifiers, and related metadata.
  * Collected with parental/guardian consent and child assent. No personally identifying information was collected or shared.
* **Audio Preprocessing:** Audio validation and segmentation, WAV conversion and resampling to 16 kHz, Sinhala text normalization, comparison of expected and transcribed text, and feature preparation for ASR and classification.
* **Model Pipeline:**
  * **Sinhala ASR (Fine-tuned Wav2Vec2 CTC):** A pretrained Wav2Vec2 speech model fine-tuned (supervised transfer learning) on the Sinhala children's reading dataset with a Connectionist Temporal Classification (CTC) objective. It converts reading audio into Sinhala text for comparison with the expected text.
  * **Reading Error Classifier (Balanced Random Forest):** A supervised Balanced Random Forest trained on 45 hybrid features (10 ASR/text-derived + 35 acoustic). It uses balanced sampling to handle class imbalance and classifies reading outcomes as `Correct`, `Substitution`, `Omission`, or `Hesitation`. The model is saved as a Joblib artifact.
  * **Feature Engineering & Performance Analysis:** Features combine word-level alignment of expected vs. ASR-predicted text with acoustic and timing information from the audio.
    * *Model predictions:* word-level reading outcome labels with confidence values.
    * *Calculated indicators* (computed values, not classifier outputs): reading accuracy, reading speed (words per minute), hesitation count, total pause duration, fluency score, and overall severity.
* **Evaluation (child-independent splits; researcher-reported results):** Training, validation, and test sets are split by child to reduce speaker-level leakage.

  | Component | Split / Metric | Result |
  | :--- | :--- | :--- |
  | Dataset split | Train / Validation / Test | 543 / 120 / 120 clips (test set: 3 held-out children) |
  | Wav2Vec2 CTC ASR | Character Error Rate (CER) | 8.45% |
  | Wav2Vec2 CTC ASR | Word Error Rate (WER) | 26.10% |
  | Balanced Random Forest | Accuracy / Macro F1 / Balanced Accuracy | 81.48% / 0.321 / 37.65% |

  The classifier's high overall accuracy is mostly driven by the majority `Correct` class. Its low macro F1 and balanced accuracy show limited performance on the minority error classes.
* **Deployment & Mobile Integration:**
  * The Python **FastAPI** inference service loads the fine-tuned Wav2Vec2 CTC model and the Balanced Random Forest classifier. It runs in **Google Colab** for research testing and is exposed through a **Cloudflare Tunnel** HTTPS endpoint.
  * The Expo app (`frontend/app/(child)/m1-session.tsx`, `frontend/hooks/useReadingSession.ts`, `frontend/api/readingAIClient.ts`) sends a multipart request with the recorded `audio` and `expected_text`, authenticated with an `X-API-Key` header.
  * The response includes per-word results (`text`, `expected`, `status`, `confidence`), `readingAccuracy`, `errorPatternSummary`, `readingSpeed`, `hesitationCount`, `pauseDuration`, `fluencyScore`, and `severity`. The mobile interface uses these to highlight reading errors and show performance indicators.
  * For UI compatibility, the frontend keeps a `reversal` field in the error summary and defaults it to `0`. Reversal is **not** an output of the final classifier.
  * Model checkpoints and the inference notebook are kept outside this repository (Google Drive / Google Colab / Hugging Face).
* **Limitations:** Small dataset (21 children); weak performance on minority error classes; the temporary tunnel URL changes when the Colab session or tunnel restarts; and outputs are educational indicators, not clinical assessments.
* **Served Endpoint (M1 FastAPI service):** `POST /analyze-reading`

### Module 2: Sinhala Text Difficulty Analysis & Progressive Reading Support (EDIRISOORIYA H. S. · `IT23179844`)
* **Objective:** Analyze the difficulty of Sinhala words and short sentences and provide progressive reading assistance only when the learner requires additional support.
* **Text Difficulty Features:** Uses grade level, Akuru count, Pillam count, and corpus-based word-frequency level as the main model inputs.
* **Difficulty & Support Model:** A multi-output Random Forest (`text_difficulty_rf.joblib`) predicts the text difficulty (`Easy`, `Medium`, or `Hard`) together with `split_needed`, `simplification_needed`, and the maximum progressive support level.
* **Progressive Reading Support:** Assistance begins after an independent reading attempt and can progress through:
  * Level 1 – Highlight / Word Focus
  * Level 2 – Akuru / Orthographic Unit Split
  * Level 3 – Audio Support
  * Level 4 – AI Sinhala Text Simplification

  Support is content-dependent, allowing unnecessary support stages to be skipped.
* **AI Sinhala Text Simplification:** Level 4 uses `google/mt5-small` fine-tuned with LoRA/PEFT using curated human-written Sinhala simplification references. The final adapter is stored under `m2_text_simplification_v2/best_adapter/`.
* **Safety-Gated Generation:** Generated simplifications pass through quality checks before being shown to the learner. If a sufficiently reliable simplification is not available, the system safely returns no simplified sentence instead of displaying an unsuitable output.
* **Backend Integration:** The component is integrated through the text-difficulty backend service and the primary analysis endpoint:
  `POST /api/v1/text-difficulty/analyze`

  The response contains the difficulty prediction, support decisions, and Level 4 simplification availability/output when required.

### Module 3: Adaptive Learning Recommendation Engine & Explainable AI (P. D. RANAWEERA · `IT23199712`)
* **Objective:** Synthesize diagnostic telemetry across speech accuracy, text complexity, response latency, and behavioral engagement into a unified learner state vector to deliver personalized, explainable pedagogical reading interventions.
* **Model Pipeline:**
  * **Multi-Signal Learner State Modeling:** 11-feature normalized vector fusing diagnostic signals across M1 (reading accuracy, speech error count, error rate), M2 (text difficulty), and M4 (affective engagement: *Engaged*, *Distracted*, *Frustrated*), along with session trajectory telemetry (previous accuracy, accuracy trend, attempt count, latency).
  * **Difficulty Transition Classifier (Macro Adaptation):** Calibrated Random Forest Classifier (`rf_difficulty_model.joblib` — 100 estimators, 96.0% accuracy, 0.96 Macro F1) predicting optimal pedagogical difficulty adjustments: `Decrease`, `Maintain`, or `Increase`.
  * **Micro-Activity Recommender:** K-Nearest Neighbors model (`knn_activity_model.joblib` — $k=5$ Euclidean distance over difficulty and skill space) mapping learner weaknesses to 20 curated pedagogical Sinhala exercises (`A001`–`A020`) across 4 dyslexic deficit domains (*Letter Recognition*, *Word Blending/Matching*, *Fluency Practice*, *Reading Comprehension*), linked to frontend interactive quizzes.
  * **Explainable AI (XAI) & Dual-Audience Dashboards:** SHAP (TreeExplainer / KernelExplainer) feature attribution generating dual-perspective pedagogical rationales:
    * *Parent-Friendly Sinhala Rationale:* Culturally appropriate, natural-language Sinhala explanations clarifying why difficulty or activities were adapted.
    * *Teacher Analytics & Visualizations:* Quantitative feature importance breakdowns, historical accuracy trends, and targeted intervention suggestions on teacher dashboards.
* **Served Endpoints:** `POST /api/v1/recommendation/next`, `POST /api/v1/recommend`

### Module 4: Multimodal Behavioral State Detection (PUSHPAKUMARA A. S. P. L. T. · `IT23177246`)
* **Objective:** Detect affective dysregulation, loss of attention, or cognitive overload in real time and automatically trigger therapeutic gamified interventions.
* **Model Pipeline:**
  * **Visual Modality (Pose & Facial Landmarks):** 30 temporal frames of 1503 MediaPipe landmark coordinates processed through a Bidirectional GRU with Temporal Attention (`best_behaviour_v2_bigru_attention.pt`) and standard GRU (`best_behaviour_gru.pt`).
  * **Acoustic Modality (Frustration Detection):** 208-dimensional spectral & acoustic feature feed evaluated by a PyTorch Feedforward Classifier (`best_audio_frustration_model.pt`).
  * **Interaction Modality (Touch Dynamics):** Touch latency, tap speed, miss-clicks, skip frequencies, and idle times processed via a trained Keras Neural Network (`best_interaction_model.keras`).
  * **Late-Fusion Engine:** Weighted confidence-fusion matrix determining final states (`Engaged`, `Distracted`, `Frustrated`, `Overwhelmed`, `Tired`).
  * **Adaptive Interventions:** Triggers gamified micro-interventions:
    * *Balloon / Bubble Breathing Mini-Game* for Frustration / Overload reduction.
    * *Star Reward Game* for Distraction re-engagement.
    * *Cooldown Breaks* for Fatigue management.
* **Served Endpoints:** `POST /api/v1/behavior/detect`, `POST /api/v1/behavior-state`, `GET /api/v1/behavior/status`

---

## 🛠️ Technology Stack

| Domain | Technology / Library |
| :--- | :--- |
| **Mobile Application** | React Native (0.76) · Expo SDK 52 · TypeScript · Expo Router (file-based navigation) · React Native Reanimated |
| **Backend API** | Python 3.11/3.13 · Flask · Flask-CORS · Marshmallow Validation · Thread-Safe Model Slot Architecture |
| **Deep Learning & ML** | PyTorch (`torch`, `torch.nn`) · TensorFlow / Keras · scikit-learn · Joblib · NumPy · Pandas |
| **NLP & Audio Processing** | HuggingFace Transformers · Librosa · SoundFile · MediaPipe · Sinhala Orthographic Analyzers |
| **M1 Speech Inference Service** | FastAPI · Fine-tuned Wav2Vec2 CTC (Hugging Face Transformers) · Balanced Random Forest · Joblib · Google Colab · Cloudflare Tunnel |
| **Explainable AI (XAI)** | SHAP (KernelExplainer / TreeExplainer) |
| **Database & Cloud Auth** | Firebase Firestore · Firebase Authentication |
| **Testing & Quality** | Pytest (Backend, 33+ comprehensive test suites) · TypeScript Compiler (`tsc --noEmit`) |

---

## 📂 Repository Directory Layout

```
nena-man/
├── frontend/                     # React Native / Expo Mobile Application
│   ├── app/                      # Expo Router views
│   │   ├── (auth)/               # Authentication (Sign in, Sign up, Onboarding)
│   │   ├── (child)/              # Child reading & gamified flows
│   │   │   ├── m1-session.tsx    # Interactive reading assessment
│   │   │   ├── reading-comprehension.tsx # Scaffolding & question flow
│   │   │   ├── game-breathing.tsx# Therapeutic balloon breathing game
│   │   │   ├── game-star.tsx     # Focus recovery star-catching game
│   │   │   └── game-bubble.tsx   # Calming bubble popping game
│   │   ├── (parent)/             # Parent performance & emotional dashboard
│   │   └── (teacher)/            # Teacher student management & analytics
│   ├── api/                      # Strongly typed REST client & contract definitions
│   │   ├── client.ts             # Axios/Fetch gateway with retry logic
│   │   ├── endpoints.ts          # Centralized route catalog
│   │   ├── readingAIClient.ts    # M1 client for the separate FastAPI reading service
│   │   └── types.ts              # Final TypeScript interfaces for M1–M4
│   ├── hooks/                    # Custom hooks (e.g., useInteractionTracker)
│   └── components/               # Accessible child-friendly UI widgets
│
├── backend/                      # Flask Microservice Architecture
│   ├── run.py                    # Server startup script (Port 5000)
│   ├── app/
│   │   ├── core/                 # Shared infrastructure (BaseModelSlot, Error handlers)
│   │   └── modules/
│   │       ├── speech_classifier/      # M1 placeholder (live M1 inference runs in separate FastAPI service)
│   │       ├── text_difficulty/        # M2 Blueprint, RF analyzer & simplifier
│   │       ├── recommendation_engine/  # M3 Blueprint, RF/KNN & SHAP XAI
│   │       │   └── models/             # M3 Joblib checkpoints & metadata
│   │       ├── behavioral_detection/   # M4 Blueprint, BiGRU, Audio & Fusion
│   │       │   └── models/             # PyTorch .pt, Keras .keras & Scalers
│   │       ├── auth/                   # User authentication & token verification
│   │       └── reports/                # Child reading progress reporting
│   └── tests/                    # Pytest test cases across all modules
│
├── ml/                           # Offline Research & Training Workspaces
│   ├── checkpoints/              # Local checkpoints (gitignored / synced via cloud)
│   │   ├── m2_text_difficulty/
│   │   └── m2_text_simplification_v2/
│   ├── notebooks/                # Jupyter / Colab notebooks for EDA & training
│   │   ├── m1_speech_classifier/ # Placeholder; M1 notebooks/checkpoints kept in Drive/Colab/HF
│   │   ├── m2_text_difficulty/
│   │   ├── m3_recommendation/
│   │   └── m4_behavioral/        # BiGRU visual, acoustic & interaction notebooks
│   └── training/                 # Production training scripts for each member
│
└── docs/                         # Research artifacts, TAF, architecture diagrams
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js**: `v20.x` or later & **npm**: `v10.x`
* **Python**: `3.11` (recommended) or `3.13`
* **Mobile Environment**: Expo Go on an iOS / Android physical device or Android Studio Emulator

---

### 2. Backend Setup & Startup

1. **Navigate to the backend directory and activate virtual environment:**
   ```bash
   cd backend
   python -m venv .venv
   ```

2. **Activate the environment:**
   * **Windows (PowerShell):**
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   * **macOS / Linux:**
     ```bash
     source .venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Verify environment & execute automated test suite:**
   ```bash
   pytest
   ```
   *(All 33 test suites covering M1–M4 and SHAP explainability should pass).*

5. **Run the Flask Development Server:**
   ```bash
   python run.py
   ```
   *The API will start locally on `http://127.0.0.1:5000` (or `http://0.0.0.0:5000`).*

---

### 3. Frontend Mobile App Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure API connection:**
   Create or verify `.env` in `frontend/`:
   ```env
   EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:5000
   ```
   *(Note: When running on a physical phone via Expo Go, replace `localhost` with your computer's local Wi-Fi IPv4 address).*

3. **Run TypeScript type validation:**
   ```bash
   npx tsc --noEmit
   ```

4. **Start the Expo development server:**
   ```bash
   npx expo start
   ```
   *Scan the generated QR code using the Expo Go mobile app.*

---

### 4. M1 Reading Analysis Service (Separately Hosted)

The M1 FastAPI inference service is **not** started by `backend/run.py`. For research testing it runs in Google Colab behind a Cloudflare Tunnel, and its endpoint is set separately in `frontend/.env`:
```env
EXPO_PUBLIC_USE_MOCK_READING_ANALYSIS=false
EXPO_PUBLIC_READING_AI_BASE_URL=https://<your-cloudflare-tunnel-url>
EXPO_PUBLIC_READING_AI_API_KEY=<m1-service-api-key>
```
* The Colab inference service and its tunnel must both be running for live M1 analysis.
* The temporary Cloudflare URL **changes each time the tunnel restarts**, so update `EXPO_PUBLIC_READING_AI_BASE_URL` and restart Expo (`npx expo start -c`).
* Never commit real tunnel URLs or API keys.

---

## 🛡️ Model Deployment & Graceful Degradation Strategy

To enable seamless collaborative research across the team without requiring identical GPU hardware or massive checkpoint downloads during early development:
* **`BaseModelSlot` Pattern:** If any model checkpoint (`.pt`, `.joblib`, `.keras`) is absent, the backend automatically logs a warning and falls back to deterministic, domain-accurate heuristic estimation (*Stub Mode*).
* **Auto-Activation:** As soon as a team member places their trained checkpoint into `backend/app/modules/<module>/models/`, the server detects it on reboot and smoothly switches to **ML Mode**.
* **Device Independence:** All PyTorch inferences strictly enforce `map_location=torch.device('cpu')`, guaranteeing that models run seamlessly on any teammate's laptop.

---

## 📜 Research Ethics, Integrity & Disclaimers

* **Educational & Research Prototype:** Nena-Man is developed as an academic engineering prototype. It is **not** a clinical diagnostic instrument for dyslexia and should not replace certified speech and language therapists or medical professionals.
* **Child Data Privacy:** All child interactions, touch telemetry, and acoustic samples are anonymized and handled with strict adherence to ethical research standards.

---

## 📄 License & Attribution

Academic Research Project — Developed for **SLIIT IT4010 (Research Project)**, Faculty of Computing, Sri Lanka Institute of Information Technology (2025/2026).  
*All rights reserved by the respective student researchers and academic supervisors.*
