"""
API Integration Tests for FastAPI Prediction Endpoint (/api/v1/predict).
"""

import io
import pytest
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def create_dummy_leaf_image_bytes(format: str = "JPEG", size=(224, 224)) -> bytes:
    """Helper function generating dummy leaf RGB image bytes."""
    img_np = np.zeros((size[1], size[0], 3), dtype=np.uint8)
    img_np[:, :] = [34, 139, 34]  # Forest Green
    img_np[80:140, 80:140] = [139, 69, 19]  # Simulated lesion spot

    img = Image.fromarray(img_np)
    buffer = io.BytesIO()
    img.save(buffer, format=format)
    return buffer.getvalue()


def test_health_check_endpoint():
    """Verify health check endpoint returns 200 OK and healthy status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data


def test_predict_valid_image():
    """Verify POST /api/v1/predict with valid JPEG leaf upload returns prediction & Grad-CAM heatmap."""
    image_bytes = create_dummy_leaf_image_bytes(format="JPEG")

    files = {"file": ("test_leaf.jpg", image_bytes, "image/jpeg")}
    response = client.post("/api/v1/predict", files=files)

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "prediction" in data
    assert "disease_name" in data["prediction"]
    assert "confidence" in data["prediction"]
    assert isinstance(data["prediction"]["confidence"], float)
    assert 0.0 <= data["prediction"]["confidence"] <= 1.0

    assert "top_k" in data
    assert len(data["top_k"]) == 3

    assert "inference_time_ms" in data
    assert data["inference_time_ms"] > 0.0

    assert "heatmap_base64" in data
    assert data["heatmap_base64"] is not None
    assert data["heatmap_base64"].startswith("data:image/jpeg;base64,")


def test_predict_invalid_file_type():
    """Verify POST /api/v1/predict with non-image file returns 400 Bad Request."""
    invalid_bytes = b"Hello, this is a plain text file."
    files = {"file": ("document.txt", invalid_bytes, "text/plain")}

    response = client.post("/api/v1/predict", files=files)
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "Invalid image format" in data["detail"]


def test_predict_empty_payload():
    """Verify POST /api/v1/predict with 0-byte file returns 400 Bad Request."""
    empty_bytes = b""
    files = {"file": ("empty.jpg", empty_bytes, "image/jpeg")}

    response = client.post("/api/v1/predict", files=files)
    assert response.status_code == 400
    data = response.json()
    assert "empty" in data["detail"].lower()
