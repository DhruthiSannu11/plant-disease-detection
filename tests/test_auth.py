"""
Unit & Integration Tests for User Authentication & Profile Endpoints (/api/v1/auth).
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.db.base import Base
from backend.app.api.deps import get_db

# Use in-memory SQLite database with StaticPool for isolated test execution
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


def test_register_user_success(client):
    """Verify POST /api/v1/auth/register creates a user and returns a valid JWT token."""
    payload = {
        "email": "farmer.john@example.com",
        "password": "SecurePassword123",
        "full_name": "Farmer John",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "farmer.john@example.com"
    assert data["user"]["full_name"] == "Farmer John"
    assert "hashed_password" not in data["user"]


def test_register_duplicate_email_fails(client):
    """Verify POST /api/v1/auth/register with duplicate email returns HTTP 400."""
    payload = {
        "email": "duplicate@example.com",
        "password": "Password123",
        "full_name": "Original User",
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_login_user_success(client):
    """Verify POST /api/v1/auth/login with valid credentials returns JWT token."""
    register_payload = {
        "email": "login.test@example.com",
        "password": "MySecretPassword",
        "full_name": "Login Tester",
    }
    client.post("/api/v1/auth/register", json=register_payload)

    login_payload = {
        "email": "login.test@example.com",
        "password": "MySecretPassword",
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "login.test@example.com"


def test_login_invalid_password_fails(client):
    """Verify POST /api/v1/auth/login with wrong password returns HTTP 401."""
    register_payload = {
        "email": "wrong.pass@example.com",
        "password": "CorrectPassword",
    }
    client.post("/api/v1/auth/register", json=register_payload)

    login_payload = {
        "email": "wrong.pass@example.com",
        "password": "IncorrectPassword",
    }
    response = client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_get_current_user_profile(client):
    """Verify GET /api/v1/auth/me with Bearer token returns profile and stats."""
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": "profile.user@example.com", "password": "Password123", "full_name": "Profile User"},
    )
    token = reg.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "profile.user@example.com"
    assert data["stats"]["total_scans"] == 0


def test_get_current_user_profile_unauthorized(client):
    """Verify GET /api/v1/auth/me without token returns HTTP 401."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
