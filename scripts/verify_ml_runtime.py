#!/usr/bin/env python3
"""
verify_ml_runtime.py
====================
Nena Man — ML Model Runtime Asset & Environment Verification Script
Researcher: Edirisooriya H. S. (IT23179844)

Verifies that all non-Git assets and ML checkpoints for:
- Model 1: Sinhala Text Difficulty Analysis (Random Forest + 2M Frequency Corpus)
- Model 2: Sinhala Sentence Simplification (mT5-small + LoRA v2 Adapter)
are correctly placed and can be loaded in memory.

Usage:
    PYTHONPATH=backend python scripts/verify_ml_runtime.py
"""

import sys
import os
import warnings
from pathlib import Path

# Silence scikit-learn InconsistentVersionWarning for cleaner audit output
warnings.filterwarnings("ignore", message=".*Trying to unpickle estimator.*")


# Resolve project repository root
REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))
backend_path = REPO_ROOT / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))
ml_simp_path = REPO_ROOT / "ml" / "training" / "m2_text_simplification"
if str(ml_simp_path) not in sys.path:
    sys.path.insert(0, str(ml_simp_path))

# ANSI formatting
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_status(component: str, check_name: str, passed: bool, detail: str = ""):
    tag = f"{GREEN}[PASS]{RESET}" if passed else f"{RED}[FAIL]{RESET}"
    print(f" {tag} {BOLD}{component}{RESET}: {check_name}")
    if detail:
        color = CYAN if passed else YELLOW
        print(f"        {color}{detail}{RESET}")


def main():
    print(f"\n{BOLD}{CYAN}============================================================{RESET}")
    print(f"{BOLD}{CYAN} 🔍 Nena Man ML Model Runtime Verification{RESET}")
    print(f"{BOLD}{CYAN}============================================================{RESET}\n")

    overall_passed = True

    # -------------------------------------------------------------------------
    # MODEL 1 AUDIT: Sinhala Text Difficulty Analysis
    # -------------------------------------------------------------------------
    print(f"{BOLD}--- Model 1: Text Difficulty & Progressive Support ---{RESET}")

    rf_model_path = REPO_ROOT / "ml" / "checkpoints" / "m2_text_difficulty" / "text_difficulty_rf.joblib"
    corpus_path = REPO_ROOT / "ml" / "data" / "sinhala_frequency" / "word_frequency_list_2M.si"

    # Check 1: Model file exists
    if rf_model_path.exists() and rf_model_path.stat().st_size > 0:
        print_status("Model 1", "Random Forest Checkpoint", True, f"Found at {rf_model_path.relative_to(REPO_ROOT)} ({rf_model_path.stat().st_size / 1024 / 1024:.2f} MB)")
    else:
        print_status("Model 1", "Random Forest Checkpoint", False, f"Missing: {rf_model_path}")
        overall_passed = False

    # Check 2: Frequency corpus exists
    if corpus_path.exists() and corpus_path.stat().st_size > 0:
        print_status("Model 1", "2M Frequency Corpus", True, f"Found at {corpus_path.relative_to(REPO_ROOT)} ({corpus_path.stat().st_size / 1024 / 1024:.2f} MB)")
    else:
        print_status("Model 1", "2M Frequency Corpus", False, f"Missing: {corpus_path}. Extract from runtime asset zip into ml/data/sinhala_frequency/.")
        overall_passed = False

    # Check 3: Import and test load
    try:
        from app.modules.text_difficulty.service import text_difficulty_service
        text_difficulty_service._ensure_loaded()
        assert text_difficulty_service._pipeline is not None
        assert text_difficulty_service._corpus is not None
        print_status("Model 1", "In-Memory Service Initialization", True, f"Loaded RF estimator classes: {list(text_difficulty_service._pipeline.classes_)}")
    except Exception as exc:
        print_status("Model 1", "In-Memory Service Initialization", False, f"Error initializing Model 1 service: {exc}")
        overall_passed = False

    print()

    # -------------------------------------------------------------------------
    # MODEL 2 AUDIT: Sinhala Sentence Simplification (Level 4)
    # -------------------------------------------------------------------------
    print(f"{BOLD}--- Model 2: Sinhala Sentence Simplification (Level 4) ---{RESET}")

    adapter_dir = REPO_ROOT / "ml" / "checkpoints" / "m2_text_simplification_v2" / "best_adapter"
    required_adapter_files = [
        "adapter_model.safetensors",
        "adapter_config.json",
        "tokenizer.json",
        "tokenizer_config.json",
    ]

    # Check 4: Adapter directory exists
    if adapter_dir.exists() and adapter_dir.is_dir():
        print_status("Model 2", "Adapter Directory", True, f"Found at {adapter_dir.relative_to(REPO_ROOT)}")
    else:
        print_status("Model 2", "Adapter Directory", False, f"Missing: {adapter_dir}. Extract from runtime asset zip into ml/checkpoints/.")
        overall_passed = False

    # Check 5: Required adapter files exist
    all_files_ok = True
    missing_files = []
    if adapter_dir.exists():
        for fname in required_adapter_files:
            fpath = adapter_dir / fname
            if not fpath.exists() or fpath.stat().st_size == 0:
                all_files_ok = False
                missing_files.append(fname)
    else:
        all_files_ok = False
        missing_files = required_adapter_files

    if all_files_ok:
        print_status("Model 2", "Adapter & Tokenizer Files", True, f"All {len(required_adapter_files)} files present in adapter folder")
    else:
        print_status("Model 2", "Adapter & Tokenizer Files", False, f"Missing files in adapter: {', '.join(missing_files)}")
        overall_passed = False

    # Check 6: Import and test load
    try:
        from inference_simplification import SinhalaSimplifier, get_device
        device = get_device()
        print_status("Model 2", "Compute Device Resolution", True, f"Selected device: {device}")

        print("        Loading SinhalaSimplifier (may take a few seconds)...")
        simplifier = SinhalaSimplifier(adapter_path=adapter_dir, device=device)
        assert simplifier.model is not None
        assert simplifier.tokenizer is not None
        print_status("Model 2", "In-Memory Simplifier Model Loading", True, f"mT5-small + LoRA v2 loaded on {simplifier.device}")
    except Exception as exc:
        print_status("Model 2", "In-Memory Simplifier Model Loading", False, f"Failed to load Model 2: {exc}")
        overall_passed = False

    print(f"\n{BOLD}{CYAN}============================================================{RESET}")
    if overall_passed:
        print(f"{BOLD}{GREEN} 🎉 ALL ML RUNTIME ASSETS VERIFIED SUCCESSFULLY!{RESET}")
        print(f" Both Model 1 and Model 2 are fully operational.")
    else:
        print(f"{BOLD}{RED} ⚠️  SOME ML RUNTIME ASSETS ARE MISSING OR COULD NOT BE LOADED.{RESET}")
        print(f" Please see above messages and refer to docs/ML_RUNTIME_SETUP.md.")
    print(f"{BOLD}{CYAN}============================================================{RESET}\n")

    return 0 if overall_passed else 1


if __name__ == "__main__":
    sys.exit(main())
