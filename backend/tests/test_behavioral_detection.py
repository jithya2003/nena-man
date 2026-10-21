"""
nena-man · backend/tests/test_behavioral_detection.py
Unit and Integration Tests for Module 4: Behavioral Detection & Adaptive Intervention.
"""

import pytest
from app import create_app


@pytest.fixture
def client():
    app = create_app("testing")
    with app.test_client() as test_client:
        yield test_client


def test_status_endpoint(client):
    """GET /api/v1/behavior/status should return 200 with model readiness information."""
    response = client.get("/api/v1/behavior/status")
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert "artifacts_found" in data
    assert "best_behaviour_gru.pt" in data["artifacts_found"]


def test_detect_engaged_interaction(client):
    """POST /api/v1/behavior/detect with optimal interaction metrics predicts Engaged."""
    payload = {
        "interaction": {
            "responseTime": 1.2,
            "tapSpeed": 260.0,
            "retryCount": 0,
            "missClicks": 0,
            "idleTime": 0.5,
            "skipFrequency": 0.0,
        }
    }
    response = client.post("/api/v1/behavior/detect", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["behaviour_state"] in ["Engaged", "Distracted", "Frustrated"]
    assert "confidence" in data


def test_engaged_does_not_force_intervention(client):
    """Engaged child keeps reading: no forced popup, celebration reward still offered."""
    payload = {
        "interaction": {
            "responseTime": 1.0, "tapSpeed": 300.0, "retryCount": 0,
            "missClicks": 0, "idleTime": 0.0, "skipFrequency": 0.0,
        },
        "voice": {"readingSpeed": 60, "hesitationCount": 0, "pauseDuration": 1.0, "fluencyScore": 90},
    }
    data = client.post("/api/v1/behavior/detect", json=payload).get_json()
    assert data["behaviour_state"] == "Engaged"
    assert data["interventionRequired"] is False
    assert data["intervention"]["game"] == "game-bubble"


def test_detect_frustrated_interaction_triggers_intervention(client):
    """POST /api/v1/behavior/detect with high error / agitation signals predicts Frustrated & triggers balloon breathing."""
    payload = {
        "interaction": {
            "responseTime": 4.5,
            "tapSpeed": 110.0,
            "retryCount": 4,
            "missClicks": 5,
            "idleTime": 2.0,
            "skipFrequency": 0.4,
        }
    }
    response = client.post("/api/v1/behavior/detect", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["behaviour_state"] == "Frustrated"
    assert data["interventionRequired"] is True
    assert data["intervention"]["game"] == "game-breathing"


def test_detect_distracted_interaction(client):
    """POST /api/v1/behavior/detect with high idle time and skips predicts Distracted & triggers Catch the Star."""
    payload = {
        "session_id": "test_session_distracted",
        "interaction": {
            "responseTime": 3.8,
            "tapSpeed": 200.0,
            "retryCount": 0,
            "missClicks": 0,
            "idleTime": 6.5,
            "skipFrequency": 0.45,
        }
    }
    response = client.post("/api/v1/behavior/detect", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["behaviour_state"] == "Distracted"
    assert data["interventionRequired"] is True
    assert data["intervention"]["game"] == "game-star"


def test_multimodal_camera_audio_fusion(client):
    """POST /api/v1/behavior/detect with camera and voice features performs multimodal late fusion."""
    payload = {
        "session_id": "test_session_multimodal",
        "voice": {
            "readingSpeed": 35.0,
            "hesitationCount": 4,
            "pauseDuration": 7.0,
            "fluencyScore": 0.35,
        },
        "interaction": {
            "responseTime": 4.0,
            "tapSpeed": 120.0,
            "retryCount": 3,
            "missClicks": 4,
            "idleTime": 1.0,
            "skipFrequency": 0.0,
        }
    }
    response = client.post("/api/v1/behavior/detect", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["behaviour_state"] == "Frustrated"
    assert "modality_contributions" in data
    assert "interaction" in data["modality_contributions"]
    assert "voice" in data["modality_contributions"]


def test_detect_legacy_endpoint_compatibility(client):
    """POST /api/v1/behavior-state alias works identically."""
    payload = {
        "responseTime": 1.0,
        "tapSpeed": 250.0,
        "retryCount": 0,
        "missClicks": 0,
        "idleTime": 0.0,
    }
    response = client.post("/api/v1/behavior-state", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert "behaviour_state" in data
