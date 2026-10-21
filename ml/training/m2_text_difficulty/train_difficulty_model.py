"""
train_difficulty_model.py
=========================
Module 2: Sinhala Text Difficulty Analysis & Progressive Reading Support
Researcher: Edirisooriya H. S. (IT23179844)

Hybrid System Architecture:
---------------------------
1. Machine Learning Responsibility:
   - Predict Sinhala text difficulty level ONLY:
     Easy / Medium / Hard
   - Target for prototype: initial_difficulty_label (researcher-defined Rubric A).
   - Target for final production: final_difficulty_level (expert-validated ground truth).
2. Progressive Support Responsibility:
   - Progressive reading support decisions remain an interpretable, transparent policy layer:
     split_needed (Candidate S2)
     simplification_needed (Candidate T2)
     max_support_level (Universal Audio Fallback: Level 3 or Level 4)
     support_path (e.g. [1, 3], [1, 2, 3], [1, 3, 4], [1, 2, 3, 4])
   - Machine learning is NOT trained for split, simplification, or max support level.

Research & Validation Clarifications:
------------------------------------
- initial_difficulty_label is a RESEARCHER-DEFINED PROVISIONAL / PSEUDO-LABEL.
- It is NOT expert-validated ground truth.
- It is NOT a clinical label.
- Because provisional labels were generated directly from the underlying features
  (grade_level, akuru_count, pillam_count, word_frequency_level, text_type), high
  model performance mainly evaluates how accurately the Random Forest can approximate
  and smooth the researcher-defined difficulty rubric.
- Model performance metrics must NOT be presented as empirical proof of educational
  or clinical validity.
- Future work must evaluate against expert-reviewed final_difficulty_level labels.

Input Features:
---------------
- Categorical:
    text_type ('word', 'short sentence') -> OneHotEncoder(handle_unknown='ignore')
- Numeric:
    grade_level (1, 2, 3) -> passthrough
    akuru_count (Unicode-aware Sinhala orthographic-unit count) -> passthrough
    pillam_count (operational educational reading-mark count) -> passthrough
    word_frequency_level (1: Common, 2: Medium, 3: Rare) -> passthrough
- Note: No feature scaling (StandardScaler) is applied; Random Forest is scale-invariant.
- Grouping:
    source is used EXCLUSIVELY as the grouping variable in GroupShuffleSplit to prevent
    leakage across educational documents. It is never used as an input feature.
"""

from __future__ import annotations

import datetime
import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


# ---------------------------------------------------------------------------
# Feature & Target Schema Definitions
# ---------------------------------------------------------------------------
CATEGORICAL_FEATURES: List[str] = ["text_type"]
NUMERIC_FEATURES: List[str] = [
    "grade_level",
    "akuru_count",
    "pillam_count",
    "word_frequency_level",
]
ALL_INPUT_FEATURES: List[str] = CATEGORICAL_FEATURES + NUMERIC_FEATURES

TARGET_COLUMN: str = "initial_difficulty_label"
GROUP_COLUMN: str = "source"
CLASS_LABELS: List[str] = ["Easy", "Medium", "Hard"]

CHECKPOINT_DIR: Path = Path("ml/checkpoints/m2_text_difficulty")
MODEL_CHECKPOINT_PATH: Path = CHECKPOINT_DIR / "text_difficulty_rf.joblib"
METADATA_PATH: Path = CHECKPOINT_DIR / "model_metadata.json"
CONFUSION_MATRIX_PATH: Path = CHECKPOINT_DIR / "confusion_matrix.png"
FEATURE_IMPORTANCE_PATH: Path = CHECKPOINT_DIR / "feature_importance.csv"
MISCLASSIFICATIONS_PATH: Path = CHECKPOINT_DIR / "test_misclassifications.csv"


def load_training_data(
    csv_path: Union[str, Path] = "ml/data/sinhala_text_difficulty_processed.csv",
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Loads processed dataset and separates usable records from excluded/quarantined rows.

    Exclusion Criteria:
    - Any row where word_frequency_level is missing/NaN.
    - Any row where initial_difficulty_label is missing/NaN.
    - Specifically excludes Row ID 804 (OOV token: දිලිදසනවා) without altering the file.

    Returns:
    - (usable_df, excluded_df)
    """
    path = Path(csv_path)
    if not path.exists():
        raise FileNotFoundError(f"Processed dataset not found at: {path}")

    df = pd.read_csv(path)

    usable_mask = (
        df[TARGET_COLUMN].notna()
        & df["word_frequency_level"].notna()
    )
    usable_df = df[usable_mask].copy()
    excluded_df = df[~usable_mask].copy()

    usable_df["grade_level"] = usable_df["grade_level"].astype(int)
    usable_df["akuru_count"] = usable_df["akuru_count"].astype(int)
    usable_df["pillam_count"] = usable_df["pillam_count"].astype(int)
    usable_df["word_frequency_level"] = usable_df["word_frequency_level"].astype(int)

    return usable_df, excluded_df


def prepare_features(
    df: pd.DataFrame,
) -> Tuple[pd.DataFrame, pd.Series, pd.Series]:
    """
    Extracts feature matrix X, target series y, and group series.
    """
    X = df[ALL_INPUT_FEATURES].copy()
    y = df[TARGET_COLUMN].copy()
    groups = df[GROUP_COLUMN].copy()

    return X, y, groups


def create_source_aware_split(
    df: pd.DataFrame,
    test_size: float = 0.20,
    random_state: int = 351,
) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
    """
    Creates an 80/20 source-aware train/test split using GroupShuffleSplit.

    Grouping Guarantee:
    - Grouped strictly by 'source' so no educational text document appears in both
      the train set and the test set (zero source overlap).

    Validation Checks:
    - Verifies source overlap between train and test is exactly 0.
    - Verifies 'Reading Book Grade 1.pdf' remains entirely in training.
    - Verifies all three target classes (Easy, Medium, Hard) exist in BOTH splits.
    - Verifies Grade 1, 2, 3 in train, and Grade 2, 3 in test.

    Returns:
    - (train_df, test_df, split_report)
    """
    X, y, groups = prepare_features(df)

    gss = GroupShuffleSplit(
        n_splits=1,
        test_size=test_size,
        random_state=random_state,
    )
    train_idx, test_idx = next(gss.split(X, y, groups=groups))

    train_df = df.iloc[train_idx].copy()
    test_df = df.iloc[test_idx].copy()

    # 1. Verify source overlap
    train_sources = set(train_df[GROUP_COLUMN].unique())
    test_sources = set(test_df[GROUP_COLUMN].unique())
    source_overlap = train_sources.intersection(test_sources)

    if len(source_overlap) > 0:
        raise ValueError(
            f"Source leakage violation: {len(source_overlap)} sources overlap between train and test: {source_overlap}"
        )

    # 2. Verify Reading Book Grade 1.pdf is in train
    if "Reading Book Grade 1.pdf" in test_sources:
        raise ValueError("Reading Book Grade 1.pdf must NOT be placed in test set!")
    if "Reading Book Grade 1.pdf" not in train_sources:
        raise ValueError("Reading Book Grade 1.pdf is missing from training set!")

    # 3. Verify class coverage
    expected_classes = set(CLASS_LABELS)
    train_classes = set(train_df[TARGET_COLUMN].unique())
    test_classes = set(test_df[TARGET_COLUMN].unique())

    missing_train = expected_classes - train_classes
    missing_test = expected_classes - test_classes

    if missing_train:
        raise ValueError(f"Train split missing target class(es): {missing_train}")
    if missing_test:
        raise ValueError(f"Test split missing target class(es): {missing_test}")

    # 4. Verify grade coverage
    train_grades = set(train_df["grade_level"].unique())
    test_grades = set(test_df["grade_level"].unique())
    if not {1, 2, 3}.issubset(train_grades):
        raise ValueError(f"Train split missing required grade levels: {{1, 2, 3}} - {train_grades}")
    if not {2, 3}.issubset(test_grades):
        raise ValueError(f"Test split missing required grade levels: {{2, 3}} - {test_grades}")

    split_report = {
        "train_rows": len(train_df),
        "test_rows": len(test_df),
        "train_pct": round(len(train_df) / len(df) * 100, 2),
        "test_pct": round(len(test_df) / len(df) * 100, 2),
        "train_source_count": len(train_sources),
        "test_source_count": len(test_sources),
        "source_overlap_count": len(source_overlap),
        "grade1_doc_in_train": "Reading Book Grade 1.pdf" in train_sources,
        "train_sources": sorted(list(train_sources)),
        "test_sources": sorted(list(test_sources)),
        "train_class_counts": train_df[TARGET_COLUMN].value_counts().to_dict(),
        "test_class_counts": test_df[TARGET_COLUMN].value_counts().to_dict(),
    }

    return train_df, test_df, split_report


def build_pipeline(
    n_estimators: int = 300,
    random_state: int = 42,
    class_weight: str = "balanced",
    n_jobs: int = -1,
) -> Pipeline:
    """
    Constructs the un-fitted scikit-learn preprocessing and estimator Pipeline.

    Preprocessing:
    - text_type: OneHotEncoder(handle_unknown='ignore')
    - numeric features: 'passthrough' (grade_level, akuru_count, pillam_count, word_frequency_level)
    - Remainder: 'drop'
    - No StandardScaler is used (Random Forest is scale-invariant).

    Estimator:
    - RandomForestClassifier(n_estimators=300, random_state=42, class_weight='balanced', n_jobs=-1)
    """
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
            (
                "num",
                "passthrough",
                NUMERIC_FEATURES,
            ),
        ],
        remainder="drop",
    )

    classifier = RandomForestClassifier(
        n_estimators=n_estimators,
        random_state=random_state,
        class_weight=class_weight,
        n_jobs=n_jobs,
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )

    return pipeline


def calculate_majority_baseline(
    train_y: pd.Series,
    test_y: pd.Series,
) -> Dict[str, Any]:
    """
    Calculates zero-rule majority class reference baseline on the test set.
    """
    majority_class = train_y.value_counts().idxmax()
    majority_train_count = int(train_y.value_counts().max())
    majority_train_pct = round(majority_train_count / len(train_y) * 100, 2)

    test_correct = int((test_y == majority_class).sum())
    majority_test_acc = round(test_correct / len(test_y), 4)

    return {
        "majority_class": majority_class,
        "train_majority_count": majority_train_count,
        "train_majority_pct": majority_train_pct,
        "test_majority_count": test_correct,
        "test_majority_accuracy": majority_test_acc,
        "test_majority_accuracy_pct": round(majority_test_acc * 100, 2),
    }


def plot_and_save_confusion_matrix(
    cm: np.ndarray,
    labels: List[str],
    output_path: Path,
) -> None:
    """
    Generates and saves a clean, publication-ready confusion matrix visualization.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(cm, interpolation="nearest", cmap="Blues")
    ax.figure.colorbar(im, ax=ax)

    ax.set(
        xticks=np.arange(cm.shape[1]),
        yticks=np.arange(cm.shape[0]),
        xticklabels=labels,
        yticklabels=labels,
        ylabel="True Label",
        xlabel="Predicted Label",
        title="Sinhala Text Difficulty Confusion Matrix\n(Held-out Source-Aware Test Set: Seed 351)",
    )

    # Annotate numbers
    thresh = cm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(
                j,
                i,
                format(cm[i, j], "d"),
                ha="center",
                va="center",
                color="white" if cm[i, j] > thresh else "black",
                fontsize=12,
                fontweight="bold",
            )

    fig.tight_layout()
    fig.savefig(output_path, dpi=300)
    plt.close(fig)


def extract_feature_importances(
    pipeline: Pipeline,
) -> pd.DataFrame:
    """
    Extracts feature importances with proper OneHotEncoded feature names.
    """
    rf: RandomForestClassifier = pipeline.named_steps["classifier"]
    preprocessor: ColumnTransformer = pipeline.named_steps["preprocessor"]

    feature_names = preprocessor.get_feature_names_out()
    # Clean up prefixes like cat__ or num__
    clean_names = [
        name.replace("cat__", "").replace("num__", "") for name in feature_names
    ]
    importances = rf.feature_importances_

    fi_df = pd.DataFrame(
        {
            "feature": clean_names,
            "importance": importances,
        }
    ).sort_values(by="importance", ascending=False).reset_index(drop=True)

    fi_df["importance"] = fi_df["importance"].round(4)
    return fi_df


def run_single_inference_smoke_tests(
    pipeline: Pipeline,
    usable_df: pd.DataFrame,
) -> List[Dict[str, Any]]:
    """
    Executes smoke-test predictions on representative examples using raw input features.
    """
    # Find representative samples from dataset
    easy_word = usable_df[(usable_df["initial_difficulty_label"] == "Easy") & (usable_df["text_type"] == "word")].iloc[0]
    med_word = usable_df[(usable_df["initial_difficulty_label"] == "Medium") & (usable_df["text_type"] == "word")].iloc[0]
    hard_word = usable_df[(usable_df["initial_difficulty_label"] == "Hard") & (usable_df["text_type"] == "word")].iloc[0]
    easy_sent = usable_df[(usable_df["initial_difficulty_label"] == "Easy") & (usable_df["text_type"] == "short sentence")].iloc[0]
    med_sent = usable_df[(usable_df["initial_difficulty_label"] == "Medium") & (usable_df["text_type"] == "short sentence")].iloc[0]
    hard_sent = usable_df[(usable_df["initial_difficulty_label"] == "Hard") & (usable_df["text_type"] == "short sentence")].iloc[0]

    samples = [
        ("Representative Easy Word", easy_word),
        ("Representative Medium Word", med_word),
        ("Representative Hard Word", hard_word),
        ("Representative Easy Sentence", easy_sent),
        ("Representative Medium Sentence", med_sent),
        ("Representative Hard Sentence", hard_sent),
    ]

    results = []
    classes = list(pipeline.classes_)

    for desc, row in samples:
        input_dict = {
            "grade_level": int(row["grade_level"]),
            "text_type": str(row["text_type"]),
            "akuru_count": int(row["akuru_count"]),
            "pillam_count": int(row["pillam_count"]),
            "word_frequency_level": int(row["word_frequency_level"]),
        }
        input_df = pd.DataFrame([input_dict])

        pred_class = pipeline.predict(input_df)[0]
        probs = pipeline.predict_proba(input_df)[0]
        prob_dict = {c: round(float(p), 4) for c, p in zip(classes, probs)}

        results.append(
            {
                "description": desc,
                "text_sample": str(row["sinhala_text"]),
                "ground_provisional_label": str(row["initial_difficulty_label"]),
                "input_features": input_dict,
                "predicted_class": str(pred_class),
                "probabilities": prob_dict,
            }
        )

    return results


def train_and_evaluate(
    csv_path: Union[str, Path] = "ml/data/sinhala_text_difficulty_processed.csv",
    split_random_state: int = 351,
    rf_random_state: int = 42,
    n_estimators: int = 300,
) -> Dict[str, Any]:
    """
    Main training execution function.
    Trains Random Forest on source-aware split, evaluates performance,
    saves artifacts, verifies reload, and executes smoke tests.
    """
    start_time = time.time()
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Load Data
    usable_df, excluded_df = load_training_data(csv_path)
    excluded_ids = excluded_df["id"].tolist()

    # 2. Source-aware Split
    train_df, test_df, split_report = create_source_aware_split(
        usable_df,
        test_size=0.20,
        random_state=split_random_state,
    )

    X_train = train_df[ALL_INPUT_FEATURES].copy()
    y_train = train_df[TARGET_COLUMN].copy()
    X_test = test_df[ALL_INPUT_FEATURES].copy()
    y_test = test_df[TARGET_COLUMN].copy()

    # 3. Build & Fit Pipeline
    pipeline = build_pipeline(
        n_estimators=n_estimators,
        random_state=rf_random_state,
        class_weight="balanced",
        n_jobs=-1,
    )

    fit_start = time.time()
    pipeline.fit(X_train, y_train)
    fit_duration = round(time.time() - fit_start, 4)

    # 4. Predict
    train_pred = pipeline.predict(X_train)
    test_pred = pipeline.predict(X_test)
    test_proba = pipeline.predict_proba(X_test)

    # 5. Metrics
    # Train Metrics
    train_acc = round(float(np.mean(y_train == train_pred)), 4)
    train_macro_f1 = round(float(f1_score(y_train, train_pred, average="macro", zero_division=0)), 4)

    # Test Metrics
    test_acc = round(float(np.mean(y_test == test_pred)), 4)
    macro_prec = round(float(precision_score(y_test, test_pred, average="macro", zero_division=0)), 4)
    macro_rec = round(float(recall_score(y_test, test_pred, average="macro", zero_division=0)), 4)
    macro_f1 = round(float(f1_score(y_test, test_pred, average="macro", zero_division=0)), 4)
    weighted_f1 = round(float(f1_score(y_test, test_pred, average="weighted", zero_division=0)), 4)
    bal_acc = round(float(balanced_accuracy_score(y_test, test_pred)), 4)

    cm = confusion_matrix(y_test, test_pred, labels=CLASS_LABELS)
    clf_rep_dict = classification_report(
        y_test, test_pred, labels=CLASS_LABELS, output_dict=True, zero_division=0
    )
    clf_rep_str = classification_report(
        y_test, test_pred, labels=CLASS_LABELS, zero_division=0
    )

    # 6. Baseline
    baseline = calculate_majority_baseline(y_train, y_test)
    abs_improvement = round(test_acc - baseline["test_majority_accuracy"], 4)

    # 7. Error Analysis (Misclassifications)
    misclassified_mask = y_test != test_pred
    misclassified_df = test_df[misclassified_mask].copy()
    misclassified_df["true_label"] = y_test[misclassified_mask]
    misclassified_df["predicted_label"] = test_pred[misclassified_mask]

    misclass_export_cols = [
        "id",
        "sinhala_text",
        "source",
        "grade_level",
        "text_type",
        "akuru_count",
        "pillam_count",
        "word_frequency_level",
        "true_label",
        "predicted_label",
    ]
    # Keep only available columns
    avail_cols = [c for c in misclass_export_cols if c in misclassified_df.columns]
    misclassified_df[avail_cols].to_csv(MISCLASSIFICATIONS_PATH, index=False)

    # 8. Confusion Matrix Artifact
    plot_and_save_confusion_matrix(cm, CLASS_LABELS, CONFUSION_MATRIX_PATH)

    # 9. Feature Importance
    fi_df = extract_feature_importances(pipeline)
    fi_df.to_csv(FEATURE_IMPORTANCE_PATH, index=False)

    # 10. Save Full Pipeline
    joblib.dump(pipeline, MODEL_CHECKPOINT_PATH)

    # 11. Save Metadata
    metadata = {
        "model_name": "Sinhala Text Difficulty Random Forest Classifier",
        "model_type": "RandomForestClassifier",
        "prototype_status": "PROTOTYPE",
        "target": TARGET_COLUMN,
        "class_labels": CLASS_LABELS,
        "feature_columns": ALL_INPUT_FEATURES,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "training_rows": len(train_df),
        "test_rows": len(test_df),
        "excluded_row_ids": excluded_ids,
        "train_source_count": split_report["train_source_count"],
        "test_source_count": split_report["test_source_count"],
        "source_overlap": split_report["source_overlap_count"],
        "split_method": "GroupShuffleSplit (groups=source)",
        "split_random_state": split_random_state,
        "rf_random_state": rf_random_state,
        "n_estimators": n_estimators,
        "class_weight": "balanced",
        "training_timestamp": timestamp,
        "fit_duration_seconds": fit_duration,
        "train_accuracy": train_acc,
        "train_macro_f1": train_macro_f1,
        "accuracy": test_acc,
        "macro_precision": macro_prec,
        "macro_recall": macro_rec,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1,
        "balanced_accuracy": bal_acc,
        "majority_class": baseline["majority_class"],
        "majority_baseline_accuracy": baseline["test_majority_accuracy"],
        "absolute_improvement_over_baseline": abs_improvement,
        "label_status": "researcher-defined provisional labels; not expert validated",
        "grade1_evaluation_limitation": (
            "All Grade 1 rows originate from one source document that is retained in training; "
            "the held-out source-level test set contains no Grade 1 rows."
        ),
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    # 12. Model Reload Test
    reloaded_pipeline: Pipeline = joblib.load(MODEL_CHECKPOINT_PATH)
    reloaded_test_pred = reloaded_pipeline.predict(X_test)
    assert np.array_equal(test_pred, reloaded_test_pred), (
        "Reload verification failed: Reloaded predictions do NOT match original predictions!"
    )
    reload_verified = True

    # 13. Single-inference smoke tests
    smoke_test_results = run_single_inference_smoke_tests(reloaded_pipeline, usable_df)

    total_duration = round(time.time() - start_time, 2)

    return {
        "timestamp": timestamp,
        "total_duration": total_duration,
        "fit_duration": fit_duration,
        "split_report": split_report,
        "train_df": train_df,
        "test_df": test_df,
        "train_acc": train_acc,
        "train_macro_f1": train_macro_f1,
        "test_acc": test_acc,
        "macro_prec": macro_prec,
        "macro_rec": macro_rec,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1,
        "bal_acc": bal_acc,
        "cm": cm,
        "clf_rep_dict": clf_rep_dict,
        "clf_rep_str": clf_rep_str,
        "baseline": baseline,
        "abs_improvement": abs_improvement,
        "misclass_count": len(misclassified_df),
        "misclassified_df": misclassified_df[avail_cols],
        "feature_importances": fi_df.to_dict(orient="records"),
        "reload_verified": reload_verified,
        "smoke_test_results": smoke_test_results,
        "metadata": metadata,
    }


def main() -> None:
    """
    Main training script execution.
    """
    print("====================================================================")
    print(" TRAINING RANDOM FOREST: SINHALA TEXT DIFFICULTY PROTOTYPE")
    print(" (Split random_state=351 · Estimator random_state=42)")
    print("====================================================================")

    results = train_and_evaluate()

    print("\n--- 1. Data Split Summary ---")
    sr = results["split_report"]
    print(f"Train rows: {sr['train_rows']} ({sr['train_pct']}%) | Sources: {sr['train_source_count']}")
    print(f"Test rows:  {sr['test_rows']} ({sr['test_pct']}%) | Sources: {sr['test_source_count']}")
    print(f"Source overlap: {sr['source_overlap_count']}")
    print(f"Grade 1 doc in train: {sr['grade1_doc_in_train']}")

    print("\n--- 2. Training Duration & Fit ---")
    print(f"Model fit time: {results['fit_duration']} seconds")
    print(f"Total pipeline execution: {results['total_duration']} seconds")

    print("\n--- 3. Performance Metrics ---")
    print(f"Train Accuracy:         {results['train_acc']:.4f}")
    print(f"Train Macro F1:         {results['train_macro_f1']:.4f}")
    print(f"Test Accuracy:          {results['test_acc']:.4f}")
    print(f"Test Balanced Accuracy: {results['bal_acc']:.4f}")
    print(f"Test Macro Precision:   {results['macro_prec']:.4f}")
    print(f"Test Macro Recall:      {results['macro_rec']:.4f}")
    print(f"Test Macro F1:          {results['macro_f1']:.4f}")
    print(f"Test Weighted F1:       {results['weighted_f1']:.4f}")

    print("\n--- 4. Majority Baseline Comparison ---")
    bl = results["baseline"]
    print(f"Majority Class (Train): {bl['majority_class']} ({bl['train_majority_pct']}%)")
    print(f"Baseline Test Accuracy: {bl['test_majority_accuracy']:.4f} ({bl['test_majority_accuracy_pct']}%)")
    print(f"Model Test Accuracy:    {results['test_acc']:.4f}")
    print(f"Absolute Improvement:   +{results['abs_improvement'] * 100:.2f}% (+{results['abs_improvement']:.4f})")

    print("\n--- 5. Classification Report ---")
    print(results["clf_rep_str"])

    print("--- 6. Raw Confusion Matrix (Order: Easy, Medium, Hard) ---")
    print(f"{'':>10} | {'Pred Easy':>10} | {'Pred Med':>10} | {'Pred Hard':>10}")
    print("-" * 46)
    for row_name, row_vals in zip(CLASS_LABELS, results["cm"]):
        print(f"{row_name:>10} | {row_vals[0]:>10d} | {row_vals[1]:>10d} | {row_vals[2]:>10d}")

    print(f"\n--- 7. Misclassifications Analysis ({results['misclass_count']} errors out of 130 test rows) ---")
    if results["misclass_count"] > 0:
        print(results["misclassified_df"].to_string(index=False))
    else:
        print("Zero misclassifications!")

    print("\n--- 8. Feature Importances ---")
    for row in results["feature_importances"]:
        print(f"  {row['feature']:<25s}: {row['importance']:.4f}")

    print(f"\n--- 9. Artifact Paths Saved ---")
    print(f"  Model:                 {MODEL_CHECKPOINT_PATH}")
    print(f"  Metadata:              {METADATA_PATH}")
    print(f"  Confusion Matrix:      {CONFUSION_MATRIX_PATH}")
    print(f"  Feature Importance:    {FEATURE_IMPORTANCE_PATH}")
    print(f"  Misclassifications:    {MISCLASSIFICATIONS_PATH}")

    print(f"\n--- 10. Model Reload Test ---")
    print(f"  Reload & prediction check: {'PASSED (Identical predictions)' if results['reload_verified'] else 'FAILED'}")

    print(f"\n--- 11. Single-Inference Smoke Tests ---")
    for st in results["smoke_test_results"]:
        print(f"  [{st['description']}] Text: '{st['text_sample']}'")
        print(f"    Input:       {st['input_features']}")
        print(f"    Target:      {st['ground_provisional_label']} -> Predicted: {st['predicted_class']}")
        print(f"    Probabilities: {st['probabilities']}\n")


if __name__ == "__main__":
    main()
