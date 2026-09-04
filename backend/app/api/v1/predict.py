"""
FastAPI Plant Disease Prediction Endpoint (/api/v1/predict).
Accepts image upload, runs ONNX inference, and returns Grad-CAM visual heatmaps.
"""

import io
from datetime import datetime, timezone

from fastapi import APIRouter, File, UploadFile, HTTPException, status
from PIL import Image

from backend.app.schemas.predict import PredictionResponse, ClassPrediction
from backend.app.services.onnx_service import ONNXInferenceService
from backend.app.services.gradcam_service import GradCAMService
from backend.app.services.diagnosis_service import DiagnosisService

router = APIRouter(tags=["Diagnostics & Predictions"])

# File upload constraints
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit


@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Classify Plant Disease & Generate Grad-CAM Heatmap",
    description="Upload a leaf photo (JPEG/PNG/WebP, max 10MB) to receive top-3 38-class plant disease predictions and a Grad-CAM visual heatmap overlay.",
)
async def predict_plant_disease(
    file: UploadFile = File(..., description="Uploaded leaf photo image file")
) -> PredictionResponse:
    """
    Diagnostic Prediction API Endpoint.
    """
    # 1. Validate MIME Type
    content_type = file.content_type or ""
    if content_type.lower() not in ALLOWED_MIME_TYPES and not content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"❌ Invalid image format: '{content_type}'. Please upload JPEG, PNG, or WebP image files.",
        )

    # 2. Read File Bytes & Validate Size
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"❌ Failed to read uploaded file contents: {str(e)}",
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="❌ Uploaded file is empty (0 bytes). Please upload a valid image file.",
        )

    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"❌ Payload too large ({len(contents)/(1024*1024):.2f} MB). Maximum allowed size is 10 MB.",
        )

    # 3. Parse PIL Image
    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()  # Verify image header
        image = Image.open(io.BytesIO(contents))  # Re-open for operations
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="❌ Corrupted or invalid image file data. Unable to parse image.",
        )

    # 4. Plant Leaf vs Non-Plant Object Guardrails
    import numpy as np
    import cv2

    img_rgb_np = np.array(image.convert("RGB"), dtype=np.uint8)

    # 4a. Grayscale / Medical Scan / X-Ray Check (RGB channel difference)
    img_float = img_rgb_np.astype(np.float32)
    rgb_channel_diff = np.mean(
        np.abs(img_float[:, :, 0] - img_float[:, :, 1])
        + np.abs(img_float[:, :, 1] - img_float[:, :, 2])
    )

    if rgb_channel_diff < 5.0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "⚠️ Unrecognized / Non-Leaf Image. Grayscale or medical scan detected (CT scan / X-ray). "
                "Please upload a color photo of a plant leaf."
            ),
        )

    # 4b. Vegetation / Green Leaf Mask Check (Filters dogs, faces, animals, cars, objects)
    img_hsv = cv2.cvtColor(img_rgb_np, cv2.COLOR_RGB2HSV)
    lower_green = np.array([30, 25, 25], dtype=np.uint8)
    upper_green = np.array([90, 255, 255], dtype=np.uint8)
    green_mask = cv2.inRange(img_hsv, lower_green, upper_green)

    vegetation_ratio = np.sum(green_mask > 0) / green_mask.size

    if vegetation_ratio < 0.08:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"⚠️ Non-Plant Image Detected (Vegetation coverage: {vegetation_ratio * 100:.1f}%). "
                "The uploaded photo appears to be an animal, human face, or non-botanical object. "
                "Please upload a clear photo of a plant leaf."
            ),
        )

    # 5. Execute ONNX Model Classification & Botanical Diagnosis Retrieval
    try:
        onnx_service = ONNXInferenceService()
        raw_predictions, inference_time_ms = onnx_service.predict(image, top_k=3)
        diagnosis_service = DiagnosisService()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"❌ Inference processing failed: {str(e)}",
        )

    top_1_raw = raw_predictions[0]
    top_1_prediction = ClassPrediction(
        class_id=top_1_raw["class_id"],
        disease_name=top_1_raw["disease_name"],
        confidence=top_1_raw["confidence"],
        details=diagnosis_service.get_diagnosis(top_1_raw["disease_name"]),
    )

    # 5b. Minimum Confidence Threshold Guardrail (e.g., 45% / 0.45)
    # Authentic leaf scans score >85% confidence. Non-plant objects (phones, hands, rooms) produce flat distributions (<35%).
    MIN_CONFIDENCE_THRESHOLD = 0.45
    if top_1_prediction.confidence < MIN_CONFIDENCE_THRESHOLD:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"⚠️ Non-Plant Image / Low Confidence Detected ({top_1_prediction.confidence * 100:.1f}%). "
                "The AI model does not recognize this image as a known crop leaf. "
                "Please upload or capture a clear, focused photo of a plant leaf."
            ),
        )

    top_k_predictions = [
        ClassPrediction(
            class_id=p["class_id"],
            disease_name=p["disease_name"],
            confidence=p["confidence"],
            details=diagnosis_service.get_diagnosis(p["disease_name"]),
        )
        for p in raw_predictions
    ]

    # 6. Generate Grad-CAM Visual Heatmap Base64
    heatmap_base64 = None
    try:
        gradcam_service = GradCAMService()
        heatmap_base64 = gradcam_service.generate_heatmap_base64(
            image, target_class_idx=top_1_prediction.class_id, alpha=0.5
        )
    except Exception as e:
        print(f"⚠️ Grad-CAM heatmap generation warning: {e}")

    # 7. Format Response
    return PredictionResponse(
        success=True,
        prediction=top_1_prediction,
        top_k=top_k_predictions,
        inference_time_ms=round(inference_time_ms, 2),
        heatmap_base64=heatmap_base64,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
