"""
test_m2_text_difficulty.py
==========================
Unit and integration tests for M2 Sinhala Text Difficulty Analysis &
Progressive Reading Support endpoint.

Test Cases Covered:
1. Easy word (e.g. 'උස')
2. Medium word (e.g. 'දෙමාපියන්')
3. Hard word (e.g. 'මුකුණුවැන්න')
4. Easy short sentence (e.g. 'ලේන් අම්මාට දුකයි')
5. Medium short sentence (e.g. 'සීයේ අපි සත්තු වත්තට ගියා')
6. Hard short sentence (e.g. 'මේ ගොවියාට පුත්තු හතර දෙනෙක් හිටියා')
7. Split = Yes ('දෙමාපියන්')
8. Split = No ('උස')
9. Simplification = Yes ('මේ ගොවියාට පුත්තු හතර දෙනෙක් හිටියා')
10. OOV / unknown token case ('දිලිදසනවා')
11. Invalid grade (e.g. grade 4)
12. Invalid text_type (e.g. 'paragraph')
13. Empty / whitespace-only text
14. Model consistency verification against direct joblib pipeline inference
15. Warm inference latency evaluation
"""

import time
import pytest
import joblib
import pandas as pd
from pathlib import Path

from app import create_app
from app.modules.text_difficulty.service import text_difficulty_service, REPO_ROOT


@pytest.fixture(scope="module")
def app():
    """Provides Flask application in testing mode."""
    application = create_app("testing")
    application.config["TESTING"] = True
    return application


@pytest.fixture(scope="module")
def client(app):
    """Provides test client."""
    with app.test_client() as test_client:
        yield test_client


@pytest.fixture(scope="module")
def direct_pipeline():
    """Loads the Random Forest pipeline directly from joblib for consistency testing."""
    model_path = REPO_ROOT / "ml" / "checkpoints" / "m2_text_difficulty" / "text_difficulty_rf.joblib"
    return joblib.load(model_path)


class TestTextDifficultyAPI:
    """Test suite for /api/text-difficulty/analyze endpoint."""

    ENDPOINT = "/api/text-difficulty/analyze"

    def test_case_01_easy_word(self, client):
        """Case 1 & 8: Easy word with Split = No ('උස')."""
        payload = {
            "text": "උස",
            "grade_level": 1,
            "text_type": "word",
        }
        res = client.post(self.ENDPOINT, json=payload)
        assert res.status_code == 200
        data = res.get_json()

        assert data["analysis_status"] == "success"
        assert data["text"] == "උස"
        assert data["features"]["akuru_count"] == 2
        assert data["features"]["pillam_count"] == 0
        assert data["features"]["word_frequency_level"] == 1
        assert data["difficulty"]["predicted"] == "Easy"
        assert data["difficulty"]["probabilities"]["Easy"] > 0.90
        assert data["support"]["split_needed"] is False
        assert data["support"]["simplification_needed"] is False
        assert data["support"]["max_support_level"] == 3
        assert data["support"]["support_path"] == [1, 3]

    def test_case_02_medium_word(self, client):
        """Case 2 & 7: Medium word with Split = Yes ('දෙමාපියන්')."""
        payload = {
            "text": "දෙමාපියන්",
            "grade_level": 2,
            "text_type": "word",
        }
        res = client.post(self.ENDPOINT, json=payload)
        assert res.status_code == 200
        data = res.get_json()

        assert data["analysis_status"] == "success"
        assert data["difficulty"]["predicted"] == "Medium"
        assert data["support"]["split_needed"] is True
        assert data["support"]["simplification_needed"] is False
        assert data["support"]["max_support_level"] == 3
        assert data["support"]["support_path"] == [1, 2, 3]

    def test_case_03_hard_word(self, client):
        """Case 3: Hard word ('මුකුණුවැන්න')."""
        payload = {
            "text": "මුකුණුවැන්න",
            "grade_level": 2,
            "text_type": "word",
        }
        res = client.post(self.ENDPOINT, json=payload)
        assert res.status_code == 200
        data = res.get_json()

        assert data["analysis_status"] == "success"
        assert data["difficulty"]["predicted"] == "Hard"
        assert data["difficulty"]["probabilities"]["Hard"] > 0.90
        assert data["support"]["split_needed"] is True
        assert data["support"]["simplification_needed"] is False
        assert data["support"]["max_support_level"] == 3
        assert data["support"]["support_path"] == [1, 2, 3]

    def test_case_04_easy_short_sentence(self, client):
        """Case 4: Easy short sentence ('ලේන් අම්මාට දුකයි')."""
        payload = {
            "text": "ලේන් අම්මාට දුකයි",
            "grade_level": 1,
            "text_type": "short sentence",
        }
        res = client.post(self.ENDPOINT, json=payload)
        assert res.status_code == 200
        data = res.get_json()

        assert data["analysis_status"] == "success"
        assert data["difficulty"]["predicted"] == "Easy"
        assert data["support"]["split_needed"] is False
        assert data["support"]["simplification_needed"] is False
        assert data["support"]["max_support_level"] == 3
        assert data["support"]["support_path"] == [1, 3]

    def test_case_05_medium_short_sentence(self, client):
        """Case 5: Medium short sentence ('සීයේ අපි සත්තු වත්තට ගියා')."""
        payload = {
            "text": "සීයේ අපි සත්තු වත්තට ගියා",
            "grade_level": 2,
            "text_type": "short sentence",
        }
        res = client.post(self.ENDPOINT, json=payload)
        assert res.status_code == 200
        data = res.get_json()

        assert data["analysis_status"] == "success"
        assert data["difficulty"]["predicted"] == "Medium"
        assert data["support"]["split_needed"] is False
        assert data["support"]["simplification_needed"] is False
        assert data["support"]["max_support_level"] == 3
        assert data["support"]["support_path"] == [1, 3]

    def test_case_06_hard_short_sentence_and_simplification(self, client):
        """Case 6 & 9: Hard short sentence with Simplification = Yes ('මේ ගොවියාට පුත්තු හතර දෙනෙක් හිටියා')."""
        payload = {
            "text": "මේ ගොවියාට පුත්තු හතර දෙනෙක් හිටියා",
            "grade_level": 3,
            "text_type": "short sentence",
        }
        res = client.post(self.ENDPOINT, json=payload)
        assert res.status_code == 200
        data = res.get_json()

        assert data["analysis_status"] == "success"
        assert data["difficulty"]["predicted"] == "Hard"
        assert data["support"]["split_needed"] is True
        assert data["support"]["simplification_needed"] is True
        assert data["support"]["max_support_level"] == 4
        assert data["support"]["support_path"] == [1, 2, 3, 4]
        assert data["simplification"]["needed"] is True
        assert data["simplification"]["available"] is False
        assert data["simplification"]["simplified_text"] is None

    def test_case_10_oov_word_handling(self, client):
        """Case 10: OOV / unknown token triggers needs_word_confirmation without calling Random Forest."""
        # Row 804 token: 'දිලිදසනවා'
        payload = {
            "text": "දිලිදසනවා",
            "grade_level": 2,
            "text_type": "word",
        }
        res = client.post(self.ENDPOINT, json=payload)
        assert res.status_code == 200
        data = res.get_json()

        assert data["analysis_status"] == "needs_word_confirmation"
        assert data["text"] == "දිලිදසනවා"
        assert "දිලිදසනවා" in data["unknown_tokens"]
        assert "message" in data
        assert "One or more words could not be found" in data["message"]
        # Ensure model predictions were NOT generated for OOV
        assert "difficulty" not in data

    def test_case_11_invalid_grade(self, client):
        """Case 11: Invalid grade level fails with 422 ValidationError."""
        payload = {
            "text": "උස",
            "grade_level": 4,
            "text_type": "word",
        }
        res = client.post(self.ENDPOINT, json=payload)
        assert res.status_code == 422
        data = res.get_json()
        assert data["success"] is False
        assert "grade_level" in data["message"].lower() or "grade" in data["message"].lower()

    def test_case_12_invalid_text_type(self, client):
        """Case 12: Invalid text_type fails with 422 ValidationError."""
        payload = {
            "text": "උස",
            "grade_level": 1,
            "text_type": "paragraph",
        }
        res = client.post(self.ENDPOINT, json=payload)
        assert res.status_code == 422
        data = res.get_json()
        assert data["success"] is False
        assert "text_type" in data["message"]

    def test_case_13_empty_and_whitespace_text(self, client):
        """Case 13: Empty or whitespace-only text fails with 422 ValidationError."""
        for empty_val in ["", "   ", "\t\n"]:
            payload = {
                "text": empty_val,
                "grade_level": 1,
                "text_type": "word",
            }
            res = client.post(self.ENDPOINT, json=payload)
            assert res.status_code == 422
            data = res.get_json()
            assert data["success"] is False

    def test_case_14_non_sinhala_text(self, client):
        """Non-Sinhala text fails gracefully with 422."""
        payload = {
            "text": "Hello world",
            "grade_level": 1,
            "text_type": "word",
        }
        res = client.post(self.ENDPOINT, json=payload)
        assert res.status_code == 422
        data = res.get_json()
        assert data["success"] is False

    def test_case_15_model_consistency_check(self, client, direct_pipeline):
        """
        Model Consistency Test:
        Verifies that backend service inference produces IDENTICAL predicted class
        and probabilities compared to direct joblib pipeline inference on known samples.
        """
        known_samples = [
            ("උස", 1, "word"),
            ("දෙමාපියන්", 2, "word"),
            ("මුකුණුවැන්න", 2, "word"),
            ("ලේන් අම්මාට දුකයි", 1, "short sentence"),
            ("සීයේ අපි සත්තු වත්තට ගියා", 2, "short sentence"),
            ("මේ ගොවියාට පුත්තු හතර දෙනෙක් හිටියා", 3, "short sentence"),
        ]

        for text, grade, tt in known_samples:
            # Backend call
            res = client.post(self.ENDPOINT, json={"text": text, "grade_level": grade, "text_type": tt})
            assert res.status_code == 200
            backend_data = res.get_json()

            # Direct pipeline call using features extracted by backend service
            feats = backend_data["features"]
            direct_input = pd.DataFrame([{
                "grade_level": grade,
                "text_type": tt,
                "akuru_count": feats["akuru_count"],
                "pillam_count": feats["pillam_count"],
                "word_frequency_level": feats["word_frequency_level"],
            }])

            direct_pred = direct_pipeline.predict(direct_input)[0]
            direct_probs = direct_pipeline.predict_proba(direct_input)[0]
            classes = list(direct_pipeline.classes_)

            # Strict assertion
            assert backend_data["difficulty"]["predicted"] == direct_pred, (
                f"Mismatch for text '{text}': Backend={backend_data['difficulty']['predicted']} vs Direct={direct_pred}"
            )
            for c, p in zip(classes, direct_probs):
                assert round(float(p), 4) == backend_data["difficulty"]["probabilities"][c]

    def test_case_16_warm_inference_latency(self, client):
        """Evaluates warm inference latency across multiple requests."""
        payload = {
            "text": "දෙමාපියන්",
            "grade_level": 2,
            "text_type": "word",
        }
        latencies = []
        for _ in range(10):
            t0 = time.perf_counter()
            res = client.post(self.ENDPOINT, json=payload)
            lat = (time.perf_counter() - t0) * 1000
            assert res.status_code == 200
            latencies.append(lat)

        avg_latency = sum(latencies) / len(latencies)
        print(f"\nAverage warm API latency over 10 calls: {avg_latency:.2f} ms")
        assert avg_latency < 50.0  # Warm in-memory inference should easily be under 50ms
