"""
Unit & Integration Tests for Scan History Endpoints (/api/v1/scans).
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.db.base import Base
from backend.app.db import models  # noqa: F401
from backend.app.api.deps import get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create fresh database tables for each test and drop after."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Override get_db dependency with test database session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_token(client):
    """Register and login a test user to get a Bearer token."""
    res = client.post(
        "/api/v1/auth/register",
        json={"email": "scan.tester@example.com", "password": "Password123", "full_name": "Scan Tester"},
    )
    return res.json()["access_token"]


def test_create_scan_record(client, auth_token):
    """Verify POST /api/v1/scans creates a scan record with botanical details and coordinates."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    scan_payload = {
        "crop": "Tomato",
        "disease_name": "Tomato___Early_blight",
        "confidence": 0.965,
        "severity": "High",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "location_name": "North Field Zone A",
        "notes": "Lesions observed on lower foliage.",
    }

    response = client.post("/api/v1/scans", json=scan_payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] > 0
    assert data["crop"] == "Tomato"
    assert data["disease_name"] == "Tomato___Early_blight"
    assert data["confidence"] == 0.965
    assert data["details"] is not None
    assert data["details"]["common_name"] == "Tomato Early Blight"
    assert len(data["details"]["organic_remedies"]) > 0


def test_list_user_scans_pagination(client, auth_token):
    """Verify GET /api/v1/scans retrieves paginated list of scans for logged-in user."""
    headers = {"Authorization": f"Bearer {auth_token}"}

    # Create 3 scans
    for i in range(3):
        client.post(
            "/api/v1/scans",
            json={
                "crop": f"Crop_{i}",
                "disease_name": "Tomato___Early_blight",
                "confidence": 0.90 + (i * 0.02),
            },
            headers=headers,
        )

    response = client.get("/api/v1/scans?skip=0&limit=2", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["page_size"] == 2


def test_filter_scans_by_crop(client, auth_token):
    """Verify GET /api/v1/scans filtering by crop name."""
    headers = {"Authorization": f"Bearer {auth_token}"}

    client.post("/api/v1/scans", json={"crop": "Potato", "disease_name": "Potato___Early_blight", "confidence": 0.95}, headers=headers)
    client.post("/api/v1/scans", json={"crop": "Apple", "disease_name": "Apple___Apple_scab", "confidence": 0.92}, headers=headers)
    client.post("/api/v1/scans", json={"crop": "Potato", "disease_name": "Potato___Late_blight", "confidence": 0.88}, headers=headers)

    response = client.get("/api/v1/scans?crop=Potato", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    for item in data["items"]:
        assert "Potato" in item["crop"]


def test_get_scan_by_id(client, auth_token):
    """Verify GET /api/v1/scans/{scan_id} returns detailed scan information."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    create_res = client.post(
        "/api/v1/scans",
        json={"crop": "Tomato", "disease_name": "Tomato___Early_blight", "confidence": 0.97},
        headers=headers,
    )
    scan_id = create_res.json()["id"]

    response = client.get(f"/api/v1/scans/{scan_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == scan_id
    assert data["details"]["scientific_name"] == "Alternaria solani"


def test_delete_scan_record(client, auth_token):
    """Verify DELETE /api/v1/scans/{scan_id} deletes a scan from history."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    create_res = client.post(
        "/api/v1/scans",
        json={"crop": "Corn", "disease_name": "Corn_(maize)___Northern_Leaf_Blight", "confidence": 0.91},
        headers=headers,
    )
    scan_id = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/scans/{scan_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Verify scan no longer exists
    get_res = client.get(f"/api/v1/scans/{scan_id}", headers=headers)
    assert get_res.status_code == 404
