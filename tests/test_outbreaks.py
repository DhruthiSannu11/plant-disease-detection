"""
Unit & Integration Tests for Outbreak Location Mapping & Celery Tasks (/api/v1/outbreaks).
"""

import io
import base64
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from PIL import Image

from backend.app.main import app
from backend.app.db.base import Base
from backend.app.db.models import CropLocation, ScanRecord
from backend.app.api.deps import get_db
from backend.app.workers.tasks import (
    _calculate_haversine_distance,
    archive_scan_image_task,
    check_outbreak_cluster_alert_task,
    generate_diagnostic_pdf_task,
)

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create fresh in-memory database tables for each test."""
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


def test_get_outbreaks_empty(client):
    """Test GeoJSON endpoint returns empty feature collection when no records exist."""
    response = client.get("/api/v1/outbreaks/geojson")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert data["total_features"] == 0
    assert data["features"] == []


def test_create_outbreak_report(client):
    """Test manual reporting of an outbreak point."""
    payload = {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "crop": "Tomato",
        "disease_name": "Tomato___Late_blight",
        "severity": "Critical",
    }
    response = client.post("/api/v1/outbreaks", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["type"] == "Feature"
    assert data["geometry"]["type"] == "Point"
    assert data["geometry"]["coordinates"] == [-122.4194, 37.7749]  # [lon, lat]
    assert data["properties"]["crop"] == "Tomato"
    assert data["properties"]["disease_name"] == "Tomato___Late_blight"
    assert data["properties"]["severity"] == "Critical"


def test_get_outbreaks_geojson_filtered(client, db_session):
    """Test GeoJSON query filtering by crop, severity, and days."""
    now = datetime.now(timezone.utc)
    # Seed 3 locations
    loc1 = CropLocation(
        latitude=36.7783,
        longitude=-119.4179,
        crop="Tomato",
        disease_name="Tomato___Bacterial_spot",
        severity="High",
        created_at=now,
    )
    loc2 = CropLocation(
        latitude=38.5816,
        longitude=-121.4944,
        crop="Apple",
        disease_name="Apple___Apple_scab",
        severity="Moderate",
        created_at=now - timedelta(days=5),
    )
    loc3 = CropLocation(
        latitude=34.0522,
        longitude=-118.2437,
        crop="Tomato",
        disease_name="Tomato___Late_blight",
        severity="Critical",
        created_at=now - timedelta(days=45),  # Older than 30 days
    )
    db_session.add_all([loc1, loc2, loc3])
    db_session.commit()

    # 1. Query all within 30 days
    res = client.get("/api/v1/outbreaks/geojson?days=30")
    assert res.status_code == 200
    assert res.json()["total_features"] == 2

    # 2. Query filtered by crop=Tomato within 60 days
    res_tomato = client.get("/api/v1/outbreaks/geojson?crop=Tomato&days=60")
    assert res_tomato.status_code == 200
    assert res_tomato.json()["total_features"] == 2

    # 3. Query filtered by severity=Moderate
    res_mod = client.get("/api/v1/outbreaks/geojson?severity=Moderate")
    assert res_mod.status_code == 200
    assert res_mod.json()["total_features"] == 1
    assert res_mod.json()["features"][0]["properties"]["crop"] == "Apple"


def test_outbreak_stats(client, db_session):
    """Test summary statistics endpoint."""
    now = datetime.now(timezone.utc)
    locations = [
        CropLocation(latitude=10.0, longitude=20.0, crop="Tomato", disease_name="Tomato___Late_blight", severity="Severe", created_at=now),
        CropLocation(latitude=10.1, longitude=20.1, crop="Tomato", disease_name="Tomato___Late_blight", severity="Severe", created_at=now),
        CropLocation(latitude=10.2, longitude=20.2, crop="Potato", disease_name="Potato___Early_blight", severity="Moderate", created_at=now),
    ]
    db_session.add_all(locations)
    db_session.commit()

    res = client.get("/api/v1/outbreaks/stats")
    assert res.status_code == 200
    stats = res.json()

    assert stats["total_outbreaks"] == 3
    assert stats["total_crops_affected"] == 2
    assert stats["total_diseases_detected"] == 2
    assert stats["severity_breakdown"]["Severe"] == 2
    assert stats["severity_breakdown"]["Moderate"] == 1
    assert stats["top_affected_crops"][0]["crop"] == "Tomato"
    assert stats["top_affected_crops"][0]["count"] == 2


def test_outbreak_clusters(client, db_session):
    """Test spatial clustering of nearby outbreaks."""
    now = datetime.now(timezone.utc)
    # 2 points close together
    loc1 = CropLocation(latitude=37.77, longitude=-122.42, crop="Corn", disease_name="Corn___Common_rust", severity="High", created_at=now)
    loc2 = CropLocation(latitude=37.78, longitude=-122.41, crop="Corn", disease_name="Corn___Common_rust", severity="High", created_at=now)
    # 1 point far away
    loc3 = CropLocation(latitude=40.71, longitude=-74.00, crop="Corn", disease_name="Corn___Common_rust", severity="Moderate", created_at=now)

    db_session.add_all([loc1, loc2, loc3])
    db_session.commit()

    res = client.get("/api/v1/outbreaks/clusters?grid_size=0.2")
    assert res.status_code == 200
    data = res.json()
    assert data["total_clusters"] == 2
    # The cluster with 2 cases should be ranked first
    assert data["clusters"][0]["case_count"] == 2
    assert data["clusters"][0]["crop"] == "Corn"


def test_haversine_distance():
    """Verify geographic distance calculation."""
    # Distance between SF (37.7749, -122.4194) and San Jose (37.3382, -121.8863) is approx 68-70 km
    dist = _calculate_haversine_distance(37.7749, -122.4194, 37.3382, -121.8863)
    assert 65.0 < dist < 75.0

    # Same location distance is 0
    assert _calculate_haversine_distance(10.0, 20.0, 10.0, 20.0) == 0.0


def test_celery_archive_scan_image_task(tmp_path, monkeypatch):
    """Test image archival background task creates files and thumbnails."""
    monkeypatch.setattr("backend.app.workers.tasks.STORAGE_DIR", str(tmp_path / "scans"))
    monkeypatch.setattr("backend.app.workers.tasks.THUMBNAIL_DIR", str(tmp_path / "thumbs"))

    # Create dummy 100x100 green image and convert to base64
    img = Image.new("RGB", (100, 100), color=(34, 139, 34))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")

    result = archive_scan_image_task(scan_id=999, image_base64=b64_str)
    assert result["status"] == "success"
    assert result["scan_id"] == 999
    assert "uploads" in result["image_path"] or str(tmp_path) in result["image_path"]


def test_celery_generate_diagnostic_pdf_task(db_session, monkeypatch):
    """Test generating diagnostic summary report from scan record."""
    scan = ScanRecord(
        crop="Apple",
        disease_name="Apple___Black_rot",
        confidence=0.985,
        severity="Severe",
        latitude=37.5,
        longitude=-122.1,
    )
    db_session.add(scan)
    db_session.commit()
    db_session.refresh(scan)

    # Monkeypatch SessionLocal in tasks module to use our test session
    monkeypatch.setattr("backend.app.workers.tasks.SessionLocal", lambda: db_session)

    result = generate_diagnostic_pdf_task(scan_id=scan.id, user_email="farmer@example.com")
    assert result["status"] == "success"
    summary = result["report_summary"]
    assert summary["crop"] == "Apple"
    assert summary["disease_name"] == "Apple___Black_rot"
    assert len(summary["treatment"]["organic_remedies"]) > 0
    assert summary["dispatched_to"] == "farmer@example.com"
