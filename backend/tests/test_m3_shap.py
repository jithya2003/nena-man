"""
nena-man · backend/tests/test_m3_shap.py
Unit and integration tests for M3 SHAP-based local explainability.

Validates:
  1. Prediction class linking: SHAP explanation matches the model's actual predicted class.
  2. Contribution serialization: All SHAP values are finite floats, JSON-serializable, with no NaNs/Infs.
  3. Positive and negative contributions: Correct attribution direction corresponding to class probability shifts.
  4. Fallback behavior: When SHAP is unavailable or disabled, system falls back safely and does not label values as SHAP.
  5. API compatibility: Top-level response and xaiFactors retain exact fields required by frontend.
  6. KNN preservation: Activity recommendations continue functioning accurately alongside SHAP.
"""

import json
import math
import pytest
from app import create_app
from app.modules.recommendation_engine.service import recommendation_service


@pytest.fixture
def client():
    """Provides Flask test client."""
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


class TestM3SHAPExplainability:
    """Test suite for SHAP explainability in RecommendationService."""

    def test_shap_explanation_structure_and_serialization(self):
        """Verifies that SHAP explanation contains all required fields and is JSON-serializable."""
        payload = {
            "readingAccuracy": 0.82,
            "errorPatternSummary": {"substitution": 1, "omission": 0, "reversal": 0, "hesitation": 1},
            "difficultyLevel": "medium",
            "behavioralState": "Focused",
            "responseLatency": 1.4,
            "previousAccuracy": 0.80,
            "activityHistory": ["text_001"],
            "difficultyHistory": ["Maintain"],
        }

        result = recommendation_service.generate_recommendation(payload)

        # 1. Top-level envelope checks
        assert "shapExplanation" in result
        shap_exp = result["shapExplanation"]
        assert shap_exp["method"] == "TreeExplainer"
        assert shap_exp["isShap"] is True
        assert shap_exp["predictedClass"] == result["difficultyAction"]
        assert isinstance(shap_exp["predictedClassIndex"], int)
        assert isinstance(shap_exp["baseProbability"], float)
        assert isinstance(shap_exp["predictedProbability"], float)

        # 2. Contributions validation
        features = shap_exp["featureContributions"]
        assert len(features) == 11

        for feat in features:
            assert "feature" in feat
            assert "featureKey" in feat
            assert "rawValue" in feat
            assert "shapValue" in feat
            assert "direction" in feat
            assert feat["direction"] in ["positive", "negative", "neutral"]
            assert "description" in feat

            # Verify finite values
            assert math.isfinite(feat["shapValue"])
            assert not math.isnan(feat["shapValue"])

        # 3. JSON serialization check
        serialized = json.dumps(result)
        assert isinstance(serialized, str)
        deserialized = json.loads(serialized)
        assert deserialized["shapExplanation"]["method"] == "TreeExplainer"

    def test_predicted_class_linking_increase(self):
        """Verifies that high performance predicts Increase and SHAP values explain Increase."""
        high_perf_payload = {
            "readingAccuracy": 0.96,
            "errorCount": 0,
            "difficultyLevel": 2,
            "behavioralState": "Focused",
            "responseLatency": 1.0,
            "previousAccuracy": 0.92,
            "activityHistory": ["text_001", "text_002"],
            "difficultyHistory": ["Maintain", "Increase"],
        }

        result = recommendation_service.generate_recommendation(high_perf_payload)
        shap_exp = result["shapExplanation"]

        # Must predict Increase
        assert result["difficultyAction"] == "Increase"
        assert shap_exp["predictedClass"] == "Increase"
        assert shap_exp["predictedClassIndex"] == 1  # DECREASE=0, INCREASE=1, MAINTAIN=2

        # Check that positive contributors to Increase exist (e.g., high accuracy or low error)
        positive_features = [f for f in shap_exp["featureContributions"] if f["direction"] == "positive"]
        assert len(positive_features) > 0

    def test_predicted_class_linking_decrease(self):
        """Verifies that low performance predicts Decrease and SHAP values explain Decrease."""
        low_perf_payload = {
            "readingAccuracy": 0.40,
            "errorCount": 7,
            "difficultyLevel": 3,
            "behavioralState": "Distracted",
            "responseLatency": 6.5,
            "previousAccuracy": 0.50,
            "activityHistory": ["text_001"],
            "difficultyHistory": ["Maintain"],
        }

        result = recommendation_service.generate_recommendation(low_perf_payload)
        shap_exp = result["shapExplanation"]

        assert result["difficultyAction"] == "Decrease"
        assert shap_exp["predictedClass"] == "Decrease"
        assert shap_exp["predictedClassIndex"] == 0  # DECREASE=0, INCREASE=1, MAINTAIN=2

        # Verify that error count / reading accuracy push model toward Decrease
        positive_contributors = [f for f in shap_exp["featureContributions"] if f["direction"] == "positive"]
        pos_keys = [f["featureKey"] for f in positive_contributors]
        assert "reading_accuracy" in pos_keys or "error_count" in pos_keys

    def test_positive_and_negative_contributions_present(self):
        """Verifies that local explanation contains both supporting and opposing attributions."""
        # Realistic payload with high accuracy but an upward trend against Maintain
        payload = {
            "readingAccuracy": 0.82,
            "errorCount": 2,
            "difficultyLevel": 2,
            "behavioralState": "Focused",
            "responseLatency": 1.4,
            "previousAccuracy": 0.70,  # +12% jump in accuracy opposes Maintain
            "activityHistory": ["text_001"],
            "difficultyHistory": ["Maintain"],
        }

        result = recommendation_service.generate_recommendation(payload)
        shap_exp = result["shapExplanation"]

        directions = {f["direction"] for f in shap_exp["featureContributions"]}
        assert "positive" in directions
        assert "negative" in directions

    def test_fallback_behavior_when_shap_disabled(self):
        """Verifies fallback behavior when SHAP is disabled: never labeled as SHAP."""
        payload = {
            "readingAccuracy": 0.82,
            "difficultyLevel": "medium",
            "behavioralState": "Focused",
        }

        try:
            recommendation_service._enable_shap = False
            result = recommendation_service.generate_recommendation(payload)

            shap_exp = result["shapExplanation"]
            assert shap_exp["method"] == "heuristic_fallback"
            assert shap_exp["isShap"] is False
            assert shap_exp["fallbackReason"] is not None
            assert shap_exp["featureContributions"] == []

            # Verify xaiFactors are present for frontend, but marked as fallback
            xai_factors = result["xaiFactors"]
            assert len(xai_factors) > 0
            for factor in xai_factors:
                assert "[Heuristic Fallback]" in factor["description"]
                # Fallback items must not have a valid shapValue attached
                assert factor.get("shapValue") is None

        finally:
            recommendation_service._enable_shap = True

    def test_frontend_compatibility_and_knn_preservation(self, client):
        """Verifies that POST /api/v1/recommend returns complete response with KNN activities and SHAP."""
        payload = {
            "childId": "test_child_001",
            "readingAccuracy": 0.85,
            "errorCount": 1,
            "difficultyLevel": "medium",
            "behavioralState": "focused",
            "responseLatency": 1.2,
            "previousAccuracy": 0.83,
        }

        resp = client.post("/api/v1/recommend", json=payload)
        assert resp.status_code == 200
        data = resp.get_json()

        # Check frontend-required keys
        assert data["success"] is True
        assert data["difficultyAction"] in ["Increase", "Maintain", "Decrease"]
        assert data["nextActivityId"].startswith("quiz_")
        assert len(data["recommendedActivities"]) >= 1

        # Check xaiFactors schema
        assert isinstance(data["xaiFactors"], list)
        assert len(data["xaiFactors"]) <= 4
        for f in data["xaiFactors"]:
            assert "name" in f
            assert "weight" in f
            assert isinstance(f["weight"], int)
            assert 0 <= f["weight"] <= 100
            assert f["direction"] in ["positive", "negative", "neutral"]
            assert "description" in f

        # Check shapExplanation presence
        assert "shapExplanation" in data
        assert data["shapExplanation"]["method"] == "TreeExplainer"
        assert data["shapExplanation"]["isShap"] is True
