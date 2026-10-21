"""
nena-man · backend/app/modules/recommendation_engine/service.py
Service layer for M3: Adaptive Learning Recommendation Engine & Explainable AI.

Integrates:
  1. Random Forest Difficulty-Transition Classifier (rf_difficulty_model.joblib)
  2. K-Nearest Neighbors Activity Recommender (knn_activity_model.joblib)
  3. Activity Metadata (activity_metadata.json) mapped to frontend Activity Registry
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Tuple

import joblib
import pandas as pd
import numpy as np

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    shap = None
    SHAP_AVAILABLE = False

logger = logging.getLogger(__name__)

# Base directory for model artifacts (relative to this service file)
MODULE_DIR = Path(__file__).resolve().parent
MODELS_DIR = MODULE_DIR / "models"
RF_MODEL_PATH = MODELS_DIR / "rf_difficulty_model.joblib"
KNN_MODEL_PATH = MODELS_DIR / "knn_activity_model.joblib"
METADATA_PATH = MODELS_DIR / "activity_metadata.json"
MODEL_INFO_PATH = MODELS_DIR / "model_info.json"

# Mapping from Random Forest raw model classes to Title Case
ACTION_MAP = {
    "INCREASE": "Increase",
    "MAINTAIN": "Maintain",
    "DECREASE": "Decrease",
}

# Human-readable labels and formatting for the 11 RF input features
FEATURE_METADATA: Dict[str, Dict[str, Any]] = {
    "reading_accuracy": {
        "name": "Reading Accuracy",
        "format": lambda v: f"{float(v):.1f}%",
    },
    "error_count": {
        "name": "Speech Error Count",
        "format": lambda v: f"{int(v)} errors",
    },
    "error_rate": {
        "name": "Error Rate",
        "format": lambda v: f"{float(v):.2f}",
    },
    "response_time_avg": {
        "name": "Response Latency",
        "format": lambda v: f"{float(v):.1f}s",
    },
    "text_difficulty": {
        "name": "Text Difficulty",
        "format": lambda v: f"Level {int(v)}",
    },
    "previous_accuracy": {
        "name": "Previous Accuracy",
        "format": lambda v: f"{float(v):.1f}%",
    },
    "accuracy_trend": {
        "name": "Accuracy Trend",
        "format": lambda v: f"{float(v):+.1f}%",
    },
    "attempt_count": {
        "name": "Session Attempt Count",
        "format": lambda v: f"{int(v)} attempts",
    },
    "current_difficulty": {
        "name": "Current Difficulty",
        "format": lambda v: f"Level {int(v)}",
    },
    "skill_id": {
        "name": "Target Skill Category",
        "format": lambda v: str(v).replace("_", " ").title(),
    },
    "behaviour_state": {
        "name": "Behavioral Engagement",
        "format": lambda v: str(v).title(),
    },
}

# Cross-reference mapping from KNN activity IDs (A001–A020) to frontend ACTIVITY_REGISTRY
# All destination IDs are verified to exist in frontend/constants/activityRegistry.ts
ACTIVITY_ID_MAP: Dict[str, Dict[str, Any]] = {
    "A001": {"frontendId": "quiz_l_01", "route": "/(child)/quiz-letter", "title": "සිංහල අකුරු හඳුනාගැනීම (Vowel Recognition)"},
    "A002": {"frontendId": "quiz_l_02", "route": "/(child)/quiz-letter", "title": "අකුරු ශබ්ද හඳුනාගැනීම (Letter Sound Discrimination)"},
    "A003": {"frontendId": "quiz_w_01", "route": "/(child)/quiz-word", "title": "සරල වචන කියවීම (Flower Word Matching)"},
    "A004": {"frontendId": "quiz_w_04", "route": "/(child)/quiz-word", "title": "සරල වාක්‍ය කියවීම (Sentence Reading Practice)"},
    "A005": {"frontendId": "quiz_w_03", "route": "/(child)/quiz-word", "title": "කෙටි කතාවක අර්ථය (Comprehension Basics)"},
    "A006": {"frontendId": "quiz_l_03", "route": "/(child)/quiz-letter", "title": "අකුරු ගැළපීම (Letter Shape Recognition)"},
    "A007": {"frontendId": "quiz_l_04", "route": "/(child)/quiz-letter", "title": "සමාන අකුරු හඳුනාගැනීම (Curved Letter Recognition)"},
    "A008": {"frontendId": "quiz_l_02", "route": "/(child)/quiz-letter", "title": "අකුරේ ශබ්දය හඳුනාගැනීම (Sound Discrimination)"},
    "A009": {"frontendId": "quiz_w_01", "route": "/(child)/quiz-word", "title": "අකුරු එකතු කර වචන සෑදීම (Word Building)"},
    "A010": {"frontendId": "quiz_w_01", "route": "/(child)/quiz-word", "title": "වචනය සහ රූපය ගැළපීම (Word-Picture Matching)"},
    "A011": {"frontendId": "quiz_w_02", "route": "/(child)/quiz-word", "title": "සරල වචන කියවීම (Tree Word Matching)"},
    "A012": {"frontendId": "quiz_w_05", "route": "/(child)/quiz-word", "title": "වචන අනුපිළිවෙළ (Word Recognition)"},
    "A013": {"frontendId": "quiz_w_01", "route": "/(child)/quiz-word", "title": "වාක්‍ය කියවීම (Sentence Word Practice)"},
    "A014": {"frontendId": "quiz_w_02", "route": "/(child)/quiz-word", "title": "වාක්‍යයක වචන හඳුනාගැනීම (Sentence Analysis)"},
    "A015": {"frontendId": "quiz_w_04", "route": "/(child)/quiz-word", "title": "වාක්‍යයේ හිස්තැන පිරවීම (Sentence Gap Fill)"},
    "A016": {"frontendId": "quiz_w_03", "route": "/(child)/quiz-word", "title": "කෙටි කතාවක් කියවීම (Short Story Comprehension)"},
    "A017": {"frontendId": "quiz_w_03", "route": "/(child)/quiz-word", "title": "කතාවේ චරිත හඳුනාගැනීම (Character Recognition)"},
    "A018": {"frontendId": "quiz_w_04", "route": "/(child)/quiz-word", "title": "කතාවේ සිදුවීම හඳුනාගැනීම (Story Sequence)"},
    "A019": {"frontendId": "quiz_w_04", "route": "/(child)/quiz-word", "title": "කෙටි ඡේදයක අර්ථය (Passage Meaning)"},
    "A020": {"frontendId": "quiz_w_05", "route": "/(child)/quiz-word", "title": "කතාවක තොරතුරු සම්බන්ධ කිරීම (Story Context)"},
}

# Safe skill-based fallback mappings if an unmapped activity is encountered
SKILL_FALLBACK_MAP: Dict[str, str] = {
    "letter_recognition": "quiz_l_01",
    "phonics": "quiz_l_02",
    "word_building": "quiz_w_01",
    "sentence_reading": "quiz_w_04",
    "comprehension": "quiz_w_03",
}


class RecommendationService:
    """Service encapsulating Random Forest difficulty adaptation, KNN activity retrieval, and SHAP explainability."""

    def __init__(self):
        self._rf_pipeline = None
        self._knn_pipeline = None
        self._activity_metadata: List[Dict[str, Any]] = []
        self._model_info: Dict[str, Any] = {}
        self._rf_explainer = None
        self._rf_feature_names: List[str] = []
        self._enable_shap = True
        self._initialized = False

    def _load_artifacts(self) -> None:
        """Loads and caches the model pipelines and metadata from disk."""
        if self._initialized:
            return

        try:
            if not RF_MODEL_PATH.exists():
                raise FileNotFoundError(f"Random Forest model not found at {RF_MODEL_PATH}")
            if not KNN_MODEL_PATH.exists():
                raise FileNotFoundError(f"KNN model not found at {KNN_MODEL_PATH}")
            if not METADATA_PATH.exists():
                raise FileNotFoundError(f"Activity metadata not found at {METADATA_PATH}")

            # Ensure backward compatibility for ColumnTransformer unpickling across scikit-learn versions
            try:
                import sklearn.compose._column_transformer as _ct
                if not hasattr(_ct, '_RemainderColsList'):
                    class _RemainderColsList(list):
                        pass
                    _ct._RemainderColsList = _RemainderColsList
            except Exception:
                pass

            logger.info("[M3 Service] Loading Random Forest model from %s", RF_MODEL_PATH)
            self._rf_pipeline = joblib.load(RF_MODEL_PATH)

            logger.info("[M3 Service] Loading KNN model from %s", KNN_MODEL_PATH)
            self._knn_pipeline = joblib.load(KNN_MODEL_PATH)

            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                self._activity_metadata = json.load(f)

            if MODEL_INFO_PATH.exists():
                with open(MODEL_INFO_PATH, "r", encoding="utf-8") as f:
                    self._model_info = json.load(f)

            # Initialize SHAP TreeExplainer on Random Forest classifier
            if SHAP_AVAILABLE and self._enable_shap:
                try:
                    clf = self._rf_pipeline.named_steps["classifier"]
                    prep = self._rf_pipeline.named_steps["preprocessing"]
                    self._rf_feature_names = list(prep.get_feature_names_out())
                    self._rf_explainer = shap.TreeExplainer(clf)
                    logger.info("[M3 Service] Initialized TreeExplainer on Random Forest classifier")
                except Exception as explainer_err:
                    logger.warning("[M3 Service] Could not initialize TreeExplainer: %s", explainer_err)
                    self._rf_explainer = None
            else:
                self._rf_explainer = None

            self._initialized = True
            logger.info(
                "[M3 Service] Successfully loaded M3 artifacts. Activities count: %d. SHAP available: %s",
                len(self._activity_metadata),
                self._rf_explainer is not None,
            )
        except Exception as exc:
            logger.error("[M3 Service] Failed to load model artifacts: %s", exc)
            raise

    def _normalize_features(
        self, data: Dict[str, Any], raw_payload: Dict[str, Any]
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Normalizes varied incoming payloads (camelCase or snake_case) into the exact
        11 Random Forest input features expected by the trained pipeline.
        """
        # 1. Reading Accuracy: Model was trained on percentage scale [0.0 - 100.0]
        raw_acc = (
            data.get("readingAccuracy")
            if data.get("readingAccuracy") is not None
            else data.get("reading_accuracy")
        )
        if raw_acc is None and isinstance(data.get("speech_errors"), dict):
            raw_acc = data["speech_errors"].get("accuracy")

        if raw_acc is None:
            reading_accuracy = 80.0
        elif raw_acc <= 1.0:
            reading_accuracy = float(raw_acc * 100.0)
        else:
            reading_accuracy = float(raw_acc)
        reading_accuracy = max(0.0, min(100.0, reading_accuracy))

        # 2. Previous Accuracy
        raw_prev = (
            data.get("previousAccuracy")
            if data.get("previousAccuracy") is not None
            else data.get("previous_accuracy")
        )
        if raw_prev is None:
            previous_accuracy = reading_accuracy
        elif raw_prev <= 1.0:
            previous_accuracy = float(raw_prev * 100.0)
        else:
            previous_accuracy = float(raw_prev)
        previous_accuracy = max(0.0, min(100.0, previous_accuracy))

        # 3. Accuracy Trend
        accuracy_trend = reading_accuracy - previous_accuracy

        # 4. Error Count
        error_count = data.get("errorCount") or data.get("error_count")
        if error_count is None and isinstance(data.get("errorPatternSummary"), dict):
            eps = data["errorPatternSummary"]
            error_count = sum(
                v for v in [eps.get("substitution"), eps.get("omission"), eps.get("reversal"), eps.get("hesitation")]
                if isinstance(v, (int, float))
            )
        elif error_count is None and isinstance(data.get("speech_errors"), dict):
            error_count = data["speech_errors"].get("errorCount")

        if error_count is None:
            error_count = int(round(max(0.0, (100.0 - reading_accuracy) / 10.0)))
        error_count = max(0, int(error_count))

        # 5. Error Rate (0.0 - 1.0)
        error_rate = min(1.0, max(0.0, float(error_count) / 10.0))

        # 6. Response Time Avg (Seconds)
        resp_time = (
            data.get("responseLatency")
            if data.get("responseLatency") is not None
            else data.get("response_latency")
        )
        if resp_time is None and data.get("response_latency_ms") is not None:
            resp_time = float(data["response_latency_ms"]) / 1000.0
        elif resp_time is None and isinstance(data.get("speech_errors"), dict):
            resp_time = data["speech_errors"].get("pauseDuration")

        if resp_time is None:
            response_time_avg = 2.5
        elif resp_time > 30.0:  # Value passed in milliseconds
            response_time_avg = float(resp_time) / 1000.0
        else:
            response_time_avg = float(resp_time)
        response_time_avg = max(0.2, min(30.0, response_time_avg))

        # 7. Text Difficulty / Current Difficulty (1 to 5 scale)
        diff_raw = (
            data.get("difficultyLevel")
            or data.get("text_difficulty")
            or data.get("difficulty_level")
            or "medium"
        )
        if isinstance(diff_raw, (int, float)):
            diff_num = int(diff_raw)
        else:
            diff_str = str(diff_raw).strip().lower()
            if diff_str in ["easy", "level 1", "level_1"]:
                diff_num = 1
            elif diff_str in ["medium", "level 2", "level 3", "level_2", "level_3"]:
                diff_num = 2
            elif diff_str in ["hard", "level 4", "level 5", "level_4", "level_5"]:
                diff_num = 4
            else:
                diff_num = 2
        diff_num = max(1, min(5, diff_num))

        # 8. Attempt Count
        history = data.get("activityHistory") or data.get("activity_history") or []
        attempt_count = max(1, len(history))

        # 9. Skill ID derivation
        skill_id = data.get("skillId") or data.get("skill_id")
        if not skill_id:
            first_act = history[0] if history else ""
            if first_act.startswith("quiz_w_"):
                skill_id = "word_building"
            elif first_act in ["quiz_l_02", "quiz_l_05"]:
                skill_id = "phonics"
            elif first_act.startswith("quiz_l_"):
                skill_id = "letter_recognition"
            elif first_act.startswith("text_") or not first_act:
                skill_id = "sentence_reading"
            else:
                skill_id = "sentence_reading"

        valid_skills = ["comprehension", "letter_recognition", "phonics", "sentence_reading", "word_building"]
        if skill_id not in valid_skills:
            skill_id = "sentence_reading"

        # 10. Behavioral State
        b_state_raw = (
            data.get("behavioralState")
            or data.get("behavior_state")
            or data.get("behaviour_state")
            or "focused"
        )
        b_state_str = str(b_state_raw).strip().lower()
        if b_state_str in ["focused", "engaged"]:
            behaviour_state = "focused"
        elif b_state_str in ["distracted", "frustrated", "tired", "overwhelmed"]:
            behaviour_state = "distracted"
        else:
            behaviour_state = "neutral"

        # Construct single-row DataFrame with the exact 11 features expected by RF pipeline
        rf_dict = {
            "reading_accuracy": reading_accuracy,
            "error_count": float(error_count),
            "error_rate": float(error_rate),
            "response_time_avg": float(response_time_avg),
            "text_difficulty": float(diff_num),
            "previous_accuracy": float(previous_accuracy),
            "accuracy_trend": float(accuracy_trend),
            "attempt_count": float(attempt_count),
            "current_difficulty": float(diff_num),
            "skill_id": skill_id,
            "behaviour_state": behaviour_state,
        }

        feature_df = pd.DataFrame([rf_dict])
        return feature_df, rf_dict

    def generate_recommendation(
        self, data: Dict[str, Any], raw_payload: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Executes end-to-end M3 recommendation pipeline:
          1. Normalizes input signals
          2. Runs Random Forest difficulty-transition prediction
          3. Queries KNN activity recommender for nearest candidate activities
          4. Maps candidate activities to valid frontend registry IDs
          5. Generates human-readable explainable rationale
        """
        self._load_artifacts()
        raw_payload = raw_payload or {}

        # 1. Prepare normalized features
        rf_input_df, extracted_meta = self._normalize_features(data, raw_payload)
        current_diff = int(extracted_meta["current_difficulty"])
        current_skill = extracted_meta["skill_id"]

        # 2. Predict difficulty transition using Random Forest
        raw_pred = self._rf_pipeline.predict(rf_input_df)[0]
        prediction_action = ACTION_MAP.get(str(raw_pred).upper(), "Maintain")

        # Extract prediction confidence
        confidence = 0.85
        if hasattr(self._rf_pipeline, "predict_proba"):
            try:
                probas = self._rf_pipeline.predict_proba(rf_input_df)[0]
                classes = list(self._rf_pipeline.classes_)
                if raw_pred in classes:
                    class_idx = classes.index(raw_pred)
                    confidence = round(float(probas[class_idx]), 2)
            except Exception as prob_err:
                logger.warning("[M3 Service] Could not compute predict_proba: %s", prob_err)

        # 3. Determine target difficulty for KNN query
        if prediction_action == "Increase":
            target_diff = min(5, current_diff + 1)
        elif prediction_action == "Decrease":
            target_diff = max(1, current_diff - 1)
        else:
            target_diff = current_diff

        # 4. Query KNN Activity Recommender
        knn_query_df = pd.DataFrame([{"difficulty_level": float(target_diff), "skill_id": current_skill}])
        try:
            knn_prep = self._knn_pipeline.named_steps["preprocessing"]
            knn_estimator = self._knn_pipeline.named_steps["knn"]
            transformed_query = knn_prep.transform(knn_query_df)

            n_neighbors = min(5, len(self._activity_metadata))
            distances, raw_indices = knn_estimator.kneighbors(transformed_query, n_neighbors=n_neighbors)
            candidate_indices = raw_indices[0].tolist()
        except Exception as knn_err:
            logger.warning("[M3 Service] KNN query failed: %s. Using default metadata order.", knn_err)
            candidate_indices = list(range(min(5, len(self._activity_metadata))))

        # 5. Validate candidate indices and map to frontend Activity Registry
        ranked_activities = []
        seen_frontend_ids = set()
        rank = 1

        for idx in candidate_indices:
            if not (0 <= idx < len(self._activity_metadata)):
                continue

            act = self._activity_metadata[idx]
            model_act_id = act.get("activity_id", f"A{idx+1:03d}")
            act_name = act.get("activity_name", "Learning Activity")
            act_skill = act.get("skill_id", current_skill)
            act_diff = int(act.get("difficulty_level", target_diff))

            # Cross-reference with verified frontend registry mapping
            mapping_info = ACTIVITY_ID_MAP.get(model_act_id)
            if mapping_info:
                frontend_id = mapping_info["frontendId"]
                title = mapping_info["title"]
            else:
                # Safe fallback to prevent broken or invented IDs
                frontend_id = SKILL_FALLBACK_MAP.get(act_skill, "quiz_l_01")
                title = f"{act_name} ({frontend_id})"

            # Deduplicate by frontend activity ID
            if frontend_id in seen_frontend_ids and len(seen_frontend_ids) >= 3:
                continue

            seen_frontend_ids.add(frontend_id)
            ranked_activities.append({
                "activityId": frontend_id,
                "activity_id": frontend_id,
                "title": title,
                "rank": rank,
                "skill_category": act_skill,
                "difficulty_level": act_diff,
                "model_activity_id": model_act_id,
            })
            rank += 1
            if len(ranked_activities) >= 3:
                break

        # Fallback if no valid activities resolved
        if not ranked_activities:
            default_frontend_id = SKILL_FALLBACK_MAP.get(current_skill, "quiz_l_01")
            ranked_activities.append({
                "activityId": default_frontend_id,
                "activity_id": default_frontend_id,
                "title": f"මූලික අභ්‍යාසය ({default_frontend_id})",
                "rank": 1,
                "skill_category": current_skill,
                "difficulty_level": target_diff,
                "model_activity_id": "A001",
            })

        primary_activity = ranked_activities[0]
        next_activity_id = primary_activity["activityId"]
        next_activity_label = primary_activity["title"]

        # 6. Build Human-Readable Rationale
        acc_val = extracted_meta["reading_accuracy"]
        err_val = int(extracted_meta["error_count"])
        b_state = extracted_meta["behaviour_state"]

        rationale_lines = []
        if prediction_action == "Increase":
            rationale_lines.append(
                f"කියවීමේ නිරවද්‍යතාවය {acc_val:.0f}% මට්ටමක පවතින අතර දරුවා උනන්දුවෙන් සහභාගී වේ."
            )
            rationale_lines.append(
                "නිරවද්‍යතා ප්‍රවණතාව ඉහළ මට්ටමක ඇති බැවින් මීළඟ අභියෝග මට්ටමට යාමට නිර්දේශ කෙරේ."
            )
        elif prediction_action == "Decrease":
            rationale_lines.append(
                f"දරුවාට කියවීමේදී අපහසුතා (වැරදි {err_val} ක්) හෝ වෙහෙසක් හඳුනා ගැනිණි."
            )
            rationale_lines.append(
                "කියවීමේ පීඩනය අවම කර ආත්මවිශ්වාසය ගොඩනැංවීම සඳහා සරල අභ්‍යාසයක් නිර්දේශ කෙරේ."
            )
        else:
            rationale_lines.append(
                f"කියවීමේ සාමාන්‍ය නිරවද්‍යතාවය {acc_val:.0f}% කි. වත්මන් අපහසුතා මට්ටම ස්ථාවරව පවතී."
            )
            rationale_lines.append(
                "අමතර පුහුණුව මඟින් කුසලතාව තහවුරු කර ගැනීම සඳහා වත්මන් මට්ටම පවත්වා ගැනීම යෝග්‍ය වේ."
            )

        # 7. Compute Genuine Local SHAP Feature Explanations (with Safe Fallback)
        xai_factors, shap_explanation = self._generate_shap_explanation(
            rf_input_df=rf_input_df,
            extracted_meta=extracted_meta,
            raw_pred=raw_pred,
            prediction_action=prediction_action,
            confidence=confidence,
        )

        # 8. Assemble Unified Response Object
        return {
            "recommendation": prediction_action,
            "difficultyAction": prediction_action,
            "nextActivityId": next_activity_id,
            "next_activity_id": next_activity_id,
            "nextActivityLabel": next_activity_label,
            "targetPhonemeSkill": f"Sinhala {current_skill.replace('_', ' ').title()}",
            "target_skill": current_skill,
            "confidence": confidence,
            "recommendedActivities": ranked_activities,
            "recommended_activities": ranked_activities,
            "rationale": rationale_lines,
            "xaiFactors": xai_factors,
            "shapExplanation": shap_explanation,
            "meta": {
                "rf_inputs": extracted_meta,
                "target_difficulty": target_diff,
                "explainability_method": shap_explanation["method"],
            },
        }

    def _extract_multiclass_shap_slice(
        self, shap_output: Any, expected_val: Any, pred_idx: int
    ) -> Tuple[np.ndarray, float]:
        """
        Extracts 1D feature attribution array and base value for the predicted class,
        handling 3D ndarray, list-of-arrays, and Explanation objects across SHAP versions.
        """
        if hasattr(shap_output, "values"):
            shap_data = shap_output.values
        else:
            shap_data = shap_output

        if isinstance(shap_data, np.ndarray):
            if shap_data.ndim == 3:
                # Shape: (n_samples, n_features, n_classes)
                class_slice = shap_data[0, :, pred_idx]
            elif shap_data.ndim == 2:
                # Binary or single-output
                class_slice = shap_data[0, :]
            else:
                class_slice = shap_data.flatten()
        elif isinstance(shap_data, list):
            # List of length n_classes, each of shape (n_samples, n_features)
            class_slice = shap_data[pred_idx][0]
        else:
            class_slice = np.array(shap_data)

        # Extract base value / expected value for this predicted class
        if hasattr(expected_val, "__getitem__") and not isinstance(expected_val, (str, bytes)):
            try:
                base_val = float(expected_val[pred_idx])
            except (IndexError, KeyError):
                base_val = float(expected_val[0])
        else:
            base_val = float(expected_val)

        return np.asarray(class_slice, dtype=float), float(base_val)

    def _build_description(
        self, feature_key: str, raw_val: Any, shap_val: float, direction: str, action: str
    ) -> str:
        """
        Builds an objective, non-clinical machine-learning attribution description
        explaining how this feature shifted the prediction toward or away from the predicted class.
        """
        meta = FEATURE_METADATA.get(feature_key, {"name": feature_key.title(), "format": str})
        formatted_val = meta["format"](raw_val)
        label = meta["name"]

        if direction == "positive":
            return (
                f"{label} ({formatted_val}) shifted the model toward recommending '{action}' "
                f"(local attribution: +{shap_val:.3f})."
            )
        elif direction == "negative":
            return (
                f"{label} ({formatted_val}) opposed the recommendation for '{action}' "
                f"(local attribution: {shap_val:.3f})."
            )
        else:
            return (
                f"{label} ({formatted_val}) had neutral impact on predicting '{action}' "
                f"(local attribution: {shap_val:.3f})."
            )

    def _generate_shap_explanation(
        self,
        rf_input_df: pd.DataFrame,
        extracted_meta: Dict[str, Any],
        raw_pred: str,
        prediction_action: str,
        confidence: float,
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Computes genuine per-prediction SHAP values using TreeExplainer.
        Maps transformed features back to original feature groups, determines direction,
        computes normalized weights for xaiFactors, and builds full shapExplanation.
        """
        if not self._enable_shap or self._rf_explainer is None:
            return self._generate_heuristic_fallback(
                extracted_meta, prediction_action, reason="SHAP explainer not enabled or unavailable"
            )

        try:
            prep = self._rf_pipeline.named_steps["preprocessing"]
            clf = self._rf_pipeline.named_steps["classifier"]
            classes = list(clf.classes_)

            if raw_pred not in classes:
                raise ValueError(f"Predicted class '{raw_pred}' not found in classifier classes {classes}")
            pred_idx = classes.index(raw_pred)

            # Transform raw row into 17-dimensional preprocessed array
            X_trans = prep.transform(rf_input_df)

            # Compute local SHAP values
            raw_shap_output = self._rf_explainer.shap_values(X_trans)
            class_shaps, base_val = self._extract_multiclass_shap_slice(
                raw_shap_output, self._rf_explainer.expected_value, pred_idx
            )

            feature_names = self._rf_feature_names or list(prep.get_feature_names_out())

            # 1. Collect raw transformed feature contributions
            raw_contributions = []
            for i, fn in enumerate(feature_names):
                val = float(class_shaps[i])
                dir_str = "positive" if val > 0.001 else "negative" if val < -0.001 else "neutral"
                raw_contributions.append({
                    "transformedFeature": str(fn),
                    "shapValue": round(val, 4),
                    "direction": dir_str,
                })

            # 2. Group transformed features into original 11 feature categories
            grouped_sums: Dict[str, float] = {}
            for i, fn in enumerate(feature_names):
                val = float(class_shaps[i])
                if fn.startswith("numeric__"):
                    parent_key = fn.replace("numeric__", "")
                elif fn.startswith("categorical__skill_id_"):
                    parent_key = "skill_id"
                elif fn.startswith("categorical__behaviour_state_"):
                    parent_key = "behaviour_state"
                else:
                    parent_key = fn
                grouped_sums[parent_key] = grouped_sums.get(parent_key, 0.0) + val

            # 3. Build structured list for all 11 original features
            grouped_contributions = []
            for feat_key, feat_meta in FEATURE_METADATA.items():
                shap_val = float(grouped_sums.get(feat_key, 0.0))
                raw_val = extracted_meta.get(feat_key, "")
                dir_str = "positive" if shap_val > 0.001 else "negative" if shap_val < -0.001 else "neutral"
                desc = self._build_description(feat_key, raw_val, shap_val, dir_str, prediction_action)

                grouped_contributions.append({
                    "feature": feat_meta["name"],
                    "featureKey": feat_key,
                    "rawValue": raw_val,
                    "shapValue": round(shap_val, 4),
                    "direction": dir_str,
                    "description": desc,
                })

            # Sort by absolute SHAP contribution descending
            grouped_contributions.sort(key=lambda x: abs(x["shapValue"]), reverse=True)

            # 4. Build top-4 xaiFactors for frontend consumption with normalized integer weights
            top_factors = grouped_contributions[:4]
            total_abs = sum(abs(item["shapValue"]) for item in top_factors)
            xai_factors = []
            if total_abs > 0:
                for item in top_factors:
                    pct = int(round((abs(item["shapValue"]) / total_abs) * 100))
                    pct = max(1, min(99, pct))
                    xai_factors.append({
                        "name": item["feature"],
                        "weight": pct,
                        "direction": item["direction"],
                        "description": item["description"],
                        "featureKey": item["featureKey"],
                        "shapValue": item["shapValue"],
                    })
            else:
                for item in top_factors:
                    xai_factors.append({
                        "name": item["feature"],
                        "weight": 25,
                        "direction": item["direction"],
                        "description": item["description"],
                        "featureKey": item["featureKey"],
                        "shapValue": item["shapValue"],
                    })

            # 5. Build full shapExplanation envelope
            shap_explanation = {
                "method": "TreeExplainer",
                "isShap": True,
                "predictedClass": prediction_action,
                "predictedClassIndex": int(pred_idx),
                "baseProbability": round(float(base_val), 4),
                "predictedProbability": round(float(confidence), 4),
                "featureContributions": grouped_contributions,
                "rawTransformedContributions": raw_contributions,
                "fallbackReason": None,
            }

            return xai_factors, shap_explanation

        except Exception as exc:
            logger.error("[M3 Service] SHAP computation failed: %s. Using heuristic fallback.", exc, exc_info=True)
            return self._generate_heuristic_fallback(
                extracted_meta, prediction_action, reason=f"SHAP calculation error: {str(exc)}"
            )

    def _generate_heuristic_fallback(
        self, extracted_meta: Dict[str, Any], prediction_action: str, reason: str = "Fallback"
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Fallback explainability logic when SHAP is unavailable or encounters an error.
        Explicitly identifies values as heuristic fallback and does NOT label them as SHAP.
        """
        acc_val = extracted_meta["reading_accuracy"]
        err_val = int(extracted_meta["error_count"])
        b_state = extracted_meta["behaviour_state"]
        resp_time = extracted_meta["response_time_avg"]

        xai_factors = [
            {
                "name": "Reading Accuracy",
                "weight": 40,
                "direction": "positive" if acc_val >= 75 else "negative" if acc_val < 60 else "neutral",
                "description": f"[Heuristic Fallback] Reading accuracy recorded at {acc_val:.1f}%.",
                "featureKey": "reading_accuracy",
            },
            {
                "name": "Speech Error Count",
                "weight": 30,
                "direction": "negative" if err_val >= 3 else "positive",
                "description": f"[Heuristic Fallback] Speech error count recorded at {err_val}.",
                "featureKey": "error_count",
            },
            {
                "name": "Behavioral State",
                "weight": 20,
                "direction": "positive" if b_state == "focused" else "neutral",
                "description": f"[Heuristic Fallback] Behavioral engagement state: '{b_state}'.",
                "featureKey": "behaviour_state",
            },
            {
                "name": "Response Latency",
                "weight": 10,
                "direction": "neutral",
                "description": f"[Heuristic Fallback] Average pause latency: {resp_time:.1f}s.",
                "featureKey": "response_time_avg",
            },
        ]

        shap_explanation = {
            "method": "heuristic_fallback",
            "isShap": False,
            "predictedClass": prediction_action,
            "predictedClassIndex": None,
            "baseProbability": None,
            "predictedProbability": None,
            "featureContributions": [],
            "rawTransformedContributions": [],
            "fallbackReason": reason,
        }

        return xai_factors, shap_explanation


# Singleton instance for import by controller
recommendation_service = RecommendationService()
