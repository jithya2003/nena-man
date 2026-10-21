# ML Runtime Asset Setup & Portability Guide

> **Module 2: Sinhala Text Difficulty Analysis & Sentence Simplification**  
> **Researcher:** Edirisooriya H. S. (IT23179844)  
> **Target Audience:** Team Members, Developers, Evaluators

This guide outlines the exact steps to pull, configure, and execute both **Model 1** (Text Difficulty & Progressive Reading Support) and **Model 2** (Level 4 Sinhala Sentence Simplification) on any development device.

---

## 1. Prerequisites & Assets Overview

### What is Already Tracked in Git
When you pull the `develop` branch, the following are already included:
- Full backend Flask application (`backend/`)
- Full frontend Expo React Native application (`frontend/`)
- Model 1 Random Forest pipeline (`ml/checkpoints/m2_text_difficulty/text_difficulty_rf.joblib`)
- Model 1 Metadata (`ml/checkpoints/m2_text_difficulty/model_metadata.json`)
- All inference pipelines and automated tests

### What Must Be Extracted from the Runtime Asset Zip
Due to repository size policies, large non-Git assets are distributed in a single portable zip (`nena-man-ml-runtime-assets.zip` ~23 MB compressed):
1. **Model 1 Frequency Corpus:**
   - `ml/data/sinhala_frequency/word_frequency_list_2M.si` (68 MB)
   - `ml/data/sinhala_frequency/verified_word_list_200K.si` (7.5 MB)
2. **Model 2 LoRA Adapter (v2):**
   - `ml/checkpoints/m2_text_simplification_v2/best_adapter/adapter_model.safetensors`
   - `ml/checkpoints/m2_text_simplification_v2/best_adapter/adapter_config.json`
   - `ml/checkpoints/m2_text_simplification_v2/best_adapter/tokenizer.json`
   - `ml/checkpoints/m2_text_simplification_v2/best_adapter/tokenizer_config.json`
   - `ml/checkpoints/m2_text_simplification_v2/best_adapter/README.md`

---

## 2. Step-by-Step Setup Instructions

### Step A: Pull Latest Code
From your local `nena-man` repository root:
```bash
git switch develop
git pull origin develop
```

### Step B: Extract Runtime Asset Zip into Repository Root
Copy `nena-man-ml-runtime-assets.zip` to your repository root and extract it:
```bash
# On macOS / Linux:
unzip nena-man-ml-runtime-assets.zip

# On Windows (PowerShell):
Expand-Archive -Path nena-man-ml-runtime-assets.zip -DestinationPath .
```

Verify that the following directory structure now exists:
```text
nena-man/
├── ml/
│   ├── checkpoints/
│   │   ├── m2_text_difficulty/
│   │   │   └── text_difficulty_rf.joblib       # (Tracked in Git)
│   │   └── m2_text_simplification_v2/
│   │       └── best_adapter/                   # (Extracted from Zip)
│   │           ├── adapter_config.json
│   │           ├── adapter_model.safetensors
│   │           ├── tokenizer.json
│   │           └── tokenizer_config.json
│   └── data/
│       └── sinhala_frequency/                  # (Extracted from Zip)
│           ├── verified_word_list_200K.si
│           └── word_frequency_list_2M.si
```

### Step C: Create Python Virtual Environment
We recommend **Python 3.12**:
```bash
# Create virtual environment
python3.12 -m venv .venv

# Activate environment
# On macOS / Linux:
source .venv/bin/activate

# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
```

### Step D: Install Backend Dependencies
Install the pinned project dependencies:
```bash
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### Step E: macOS Apple Silicon Note (Expat Library)
> **Note:** This step is only relevant for macOS users with Apple Silicon (M1/M2/M3/M4) if you encounter `Library not loaded: /opt/homebrew/opt/expat/lib/libexpat.1.dylib` or a `pyexpat` error. It is **not** required on Windows or Linux.

If this error occurs on macOS:
```bash
# Using Homebrew:
brew install expat
export DYLD_LIBRARY_PATH="$(brew --prefix expat)/lib"
# Or:
export DYLD_LIBRARY_PATH="/opt/homebrew/opt/expat/lib"
```

### Step F: Run the ML Runtime Verification Script
Run the automated verification script to confirm everything is in place before launching:
```bash
PYTHONPATH=backend python scripts/verify_ml_runtime.py
```
Expected output:
```text
============================================================
 🔍 Nena Man ML Model Runtime Verification
============================================================

--- Model 1: Text Difficulty & Progressive Support ---
 [PASS] Model 1: Random Forest Checkpoint
 [PASS] Model 1: 2M Frequency Corpus
 [PASS] Model 1: In-Memory Service Initialization

--- Model 2: Sinhala Sentence Simplification (Level 4) ---
 [PASS] Model 2: Adapter Directory
 [PASS] Model 2: Adapter & Tokenizer Files
 [PASS] Model 2: Compute Device Resolution
 [PASS] Model 2: In-Memory Simplifier Model Loading

============================================================
 🎉 ALL ML RUNTIME ASSETS VERIFIED SUCCESSFULLY!
 Both Model 1 and Model 2 are fully operational.
============================================================
```

### Step G: Start the Flask Backend Server
Launch the backend from the repository root:
```bash
PYTHONPATH=backend PORT=5001 .venv/bin/python3 backend/run.py
```
- API Base URL: `http://localhost:5001/api/v1`
- Health check: `http://localhost:5001/api/v1/health`

### Step H: Start Frontend (Web / Mobile)
In a separate terminal window:
```bash
cd frontend
npm install
npm run web
```

#### Frontend Configuration (`frontend/.env`):
For local browser testing, create `frontend/.env` (based on `frontend/.env.example`):
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5001/api/v1
```
*(Do not commit your `.env` file).*

#### Physical Phone Testing Note:
If testing with Expo Go on a physical phone, `localhost` refers to the phone itself and will not reach the backend. Replace `localhost` with your Mac/PC local area network IP (e.g., `http://192.168.1.50:5001/api/v1`).

---

## 3. Base Model Download Behaviour (`google/mt5-small`)

Model 2 fine-tuning uses the `google/mt5-small` foundation model with PEFT LoRA adapter weights.

- **Online Mode (First Run):**  
  If the base model is not already in the Hugging Face cache (`~/.cache/huggingface/hub/`), the backend will automatically download `google/mt5-small` (~1.2 GB) once from Hugging Face on the first Level 4 request. An active internet connection is required only for this initial fetch.
- **Offline Mode (Subsequent Runs):**  
  Once cached, the backend automatically runs fully offline without requiring an active internet connection.

---

## 4. Cross-Platform Compatibility

- **Hardware Acceleration:**  
  - macOS (Apple Silicon): Automatically utilizes `mps` (Metal Performance Shaders).  
  - Linux / Windows with NVIDIA GPU: Automatically utilizes `cuda`.  
  - Other systems / Virtual machines: Automatically falls back to standard `cpu`.
- **Operating Systems:** Fully portable across macOS, Ubuntu/Debian Linux, and Windows 10/11.
