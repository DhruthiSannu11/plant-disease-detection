"""
Pydantic Schemas for Leaf Scan Records and History.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

from backend.app.schemas.predict import DiagnosticDetails


class ScanBase(BaseModel):
    crop: str
    disease_name: str
    common_name: Optional[str] = None
    scientific_name: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    severity: Optional[str] = "Moderate"
    image_path: Optional[str] = None
    heatmap_data: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    notes: Optional[str] = None


class ScanCreate(ScanBase):
    pass


class ScanUpdate(BaseModel):
    notes: Optional[str] = None
    location_name: Optional[str] = None
    severity: Optional[str] = None


class ScanOut(ScanBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int] = None
    created_at: datetime
    details: Optional[DiagnosticDetails] = None


class ScanListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ScanOut]
