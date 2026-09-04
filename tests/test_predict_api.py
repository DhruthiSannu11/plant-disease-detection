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


def test_predict_valid_image(monkeypatch):
    """Verify POST /api/v1/predict with valid JPEG leaf upload returns prediction & Grad-CAM heatmap."""
    mock_predictions = [
        {"class_id": 29, "disease_name": "Tomato___Early_blight", "confidence": 0.985},
        {"class_id": 30, "disease_name": "Tomato___Late_blight", "confidence": 0.010},
        {"class_id": 32, "disease_name": "Tomato___Septoria_leaf_spot", "confidence": 0.005},
    ]

    from backend.app.services.onnx_service import ONNXInferenceService
    monkeypatch.setattr(ONNXInferenceService, "predict", lambda self, img, top_k=3: (mock_predictions, 18.5))

    image_bytes = create_dummy_leaf_image_bytes(format="JPEG")
    files = {"file": ("test_leaf.jpg", image_bytes, "image/jpeg")}
    response = client.post("/api/v1/predict", files=files)

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert "prediction" in data
    assert data["prediction"]["disease_name"] == "Tomato___Early_blight"
    assert data["prediction"]["confidence"] == 0.985

    assert "details" in data["prediction"]
    details = data["prediction"]["details"]
    assert details["common_name"] == "Tomato Early Blight"
    assert len(details["organic_remedies"]) > 0
    assert len(details["chemical_treatments"]) > 0

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


def test_predict_low_confidence_image():
    """Verify POST /api/v1/predict with grayscale CT scan / medical image returns HTTP 422 Unprocessable Entity."""
    # Create pure grayscale medical CT scan simulation image
    ct_np = np.zeros((224, 224, 3), dtype=np.uint8)
    ct_np[50:170, 50:170] = 180
    ct_np[80:130, 80:130] = 60
    img = Image.fromarray(ct_np)
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")

    files = {"file": ("ct_scan.jpg", buffer.getvalue(), "image/jpeg")}
    response = client.post("/api/v1/predict", files=files)

    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert "Unrecognized / Non-Leaf Image" in data["detail"]


def test_predict_non_plant_object_image():
    """Verify POST /api/v1/predict with non-plant animal / object photo returns HTTP 422 Unprocessable Entity."""
    # Create golden fur color simulation image (golden retriever fur)
    fur_np = np.zeros((224, 224, 3), dtype=np.uint8)
    fur_np[:, :] = [218, 165, 32]  # Goldenrod fur color
    img = Image.fromarray(fur_np)
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")

    files = {"file": ("dog_photo.jpg", buffer.getvalue(), "image/jpeg")}
    response = client.post("/api/v1/predict", files=files)

    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert "Non-Plant Image Detected" in data["detail"]


def test_predict_low_confidence_threshold(monkeypatch):
    """Verify that predictions below the 45% confidence threshold trigger HTTP 422 error."""
    mock_low_conf_predictions = [
        {"class_id": 29, "disease_name": "Tomato___Early_blight", "confidence": 0.284},
        {"class_id": 30, "disease_name": "Tomato___Late_blight", "confidence": 0.250},
        {"class_id": 32, "disease_name": "Tomato___Septoria_leaf_spot", "confidence": 0.200},
    ]

    from backend.app.services.onnx_service import ONNXInferenceService
    monkeypatch.setattr(ONNXInferenceService, "predict", lambda self, img, top_k=3: (mock_low_conf_predictions, 20.0))

    # Create dummy leaf with sufficient green color to pass green mask filter
    green_np = np.zeros((224, 224, 3), dtype=np.uint8)
    green_np[:, :] = [34, 139, 34]  # Forest green
    img = Image.fromarray(green_np)
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")

    files = {"file": ("low_conf_leaf.jpg", buffer.getvalue(), "image/jpeg")}
    response = client.post("/api/v1/predict", files=files)

    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert "Low Confidence Detected" in data["detail"]

