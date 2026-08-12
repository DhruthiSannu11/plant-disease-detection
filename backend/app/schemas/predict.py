"""
Pydantic Schemas for Plant Disease Prediction API Requests & Responses.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ClassPrediction(BaseModel):
    """Prediction for a single plant disease class."""

    class_id: int = Field(..., description="Numeric index of the predicted disease class (0-37)")
    disease_name: str = Field(..., description="Botanical & pathological disease class label name")
    confidence: float = Field(..., description="Prediction probability confidence score (0.0 to 1.0)")


class PredictionResponse(BaseModel):
    """Complete diagnostic prediction response model."""

    success: bool = Field(True, description="API execution status")
    prediction: ClassPrediction = Field(..., description="Top-1 highest confidence disease prediction")
    top_k: List[ClassPrediction] = Field(..., description="Top-K disease predictions ordered by confidence")
    inference_time_ms: float = Field(..., description="ONNX model inference latency in milliseconds")
    heatmap_base64: Optional[str] = Field(None, description="Base64 Data URL string of Grad-CAM visual heatmap overlay")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp of diagnostic request")
