"""
Unit tests for FastAPI backend health check endpoints.
"""

from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    """Verify GET /api/v1/health returns 200 OK and healthy status payload."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"
    assert "environment" in data


def test_root_endpoint():
    """Verify GET / returns API welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "version" in data
