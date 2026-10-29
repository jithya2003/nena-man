# 🌟 නැණ මං (Nena-Man)

### AI-Powered Sinhala Dyslexia Reading Assistant & Adaptive Intervention Platform

**SLIIT IT4010 &nbsp;·&nbsp; Final Year Research Project &nbsp;·&nbsp; Project ID: J26-IT-361 (2025/2026)**

---

## 📖 Executive Summary

**Nena-Man (නැණ මං)** is an intelligent, emotionally adaptive, multimodal reading assistant mobile platform specifically designed for Sinhala-speaking primary school children (ages 7–8) diagnosed with or displaying symptoms of developmental dyslexia. 

In Sinhala orthography, complex glyph structures, syllabic ligatures (*Pillam* / පිල්ලම්), and visually similar graphemes pose severe cognitive hurdles. **Nena-Man** bridges the critical void in localized assistive educational technology by unifying **four specialized AI research modules** into an integrated, real-time closed-loop intervention ecosystem:

1. **Speech Analysis & Dyslexia Error Classification** (Acoustic & phonetic phonological analysis)
2. **Sinhala Text Difficulty Analysis & Progressive Reading Support** (Difficulty classification, Akuru & Pillam analysis, multi-level reading assistance, and safety-gated AI text simplification)
3. **Adaptive Pedagogical Recommendation & Explainable AI (XAI)** (State-driven curriculum adaptation with SHAP)
4. **Multimodal Affective & Behavioral Detection** (Camera, voice & touch dynamics with interactive calming mini-games)

---

## 👥 Research Team & Individual Modules

| Module | Research Domain & Scope | Researcher | Student ID |
| :--- | :--- | :--- | :--- |
| **M1** | **Speech & Audio ML Reading Error Classifier**<br>Dual-ASR phoneme alignment, dyslexic reading error identification (Substitution, Omission, Reversal, Hesitation), and fluency scoring. | **KULATHILAKA A. M. J. S. K.** | `IT23175198` |
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
│• Fine-tuned   │ │• Akuru/Pillam │  │• Random Forest│   │• PyTorch      │
│  Whisper +    │ │  Feature Ext. │  │  Transition   │   │  BiGRU + Attn │
│  Wav2Vec2     │ │• Multi-Output │  │  Classifier   │   │  (Vision)     │
│• SinBERT      │ │  Random Forest│  │• KNN Activity │   │• 208-Feature  │
│  Error Head   │ │• mT5-small +  │  │  Recommender  │   │  Acoustic Net │
│• MFCC & WPM   │ │  LoRA Simplify│  │• SHAP XAI     │   │• Keras Touch  │
│  Fluency Flow │ │• Level 1-4 Sup│  │  Explainer    │   │• Late-Fusion  │
└───────────────┘ └───────────────┘  └───────────────┘   └───────────────┘
```

### Module 1: Speech & Reading Error Classifier (KULATHILAKA A. M. J. S. K. · `IT23175198`)
* **Objective:** Capture spoken Sinhala reading audio, extract acoustic signatures, and identify dyslexic reading impairments.
* **Model Pipeline:**
  * **Dual-ASR Engine:** Fine-tuned OpenAI Whisper and Wav2Vec2-BERT adapted for Sinhala children's speech acoustics.
  * **Feature Extraction:** Mel-Frequency Cepstral Coefficients (MFCC), jitter, shimmer, pause duration distributions, and Words Per Minute (WPM).
  * **Classifier:** SinBERT contextual classification head classifying errors into `Substitution`, `Omission`, `Reversal`, and `Hesitation`.
* **Served Endpoints:** `POST /api/v1/speech/classify`

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
│   │   └── types.ts              # Final TypeScript interfaces for M1–M4
│   ├── hooks/                    # Custom hooks (e.g., useInteractionTracker)
│   └── components/               # Accessible child-friendly UI widgets
│
├── backend/                      # Flask Microservice Architecture
│   ├── run.py                    # Server startup script (Port 5000)
│   ├── app/
│   │   ├── core/                 # Shared infrastructure (BaseModelSlot, Error handlers)
│   │   └── modules/
│   │       ├── speech_classifier/      # M1 Blueprint & services
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
│   │   ├── m1_speech_classifier/
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
