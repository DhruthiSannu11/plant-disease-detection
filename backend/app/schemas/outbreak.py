"""
Pydantic Schemas for GeoJSON Outbreak Location Mapping & Agricultural Intelligence.
Conforms strictly to RFC 7946 GeoJSON specifications.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict


class GeoJSONGeometry(BaseModel):
    """GeoJSON Point Geometry [longitude, latitude]."""
    type: Literal["Point"] = "Point"
    coordinates: List[float] = Field(
        ...,
        min_length=2,
        max_length=2,
        description="GeoJSON coordinate array formatted as [longitude, latitude]",
        examples=[[-121.89, 37.33]],
    )


class OutbreakProperties(BaseModel):
    """Diagnostic properties associated with each GeoJSON outbreak point."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    scan_id: Optional[int] = None
    crop: str
    disease_name: str
    severity: str
    latitude: float
    longitude: float
    created_at: datetime


class GeoJSONFeature(BaseModel):
    """GeoJSON Feature Object."""
    type: Literal["Feature"] = "Feature"
    geometry: GeoJSONGeometry
    properties: OutbreakProperties


class GeoJSONFeatureCollection(BaseModel):
    """GeoJSON FeatureCollection representing all active crop disease outbreaks."""
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: List[GeoJSONFeature]
    total_features: int


class OutbreakReportCreate(BaseModel):
    """Payload to record an outbreak field report directly."""
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    crop: str = Field(..., min_length=1, max_length=100)
    disease_name: str = Field(..., min_length=1, max_length=150)
    severity: Optional[str] = Field("Moderate", pattern="^(Low|Moderate|High|Severe|Critical)$")


class OutbreakStatsResponse(BaseModel):
    """Macroscopic epidemiological statistics across all outbreaks."""
    total_outbreaks: int
    total_crops_affected: int
    total_diseases_detected: int
    severity_breakdown: Dict[str, int]
    top_affected_crops: List[Dict[str, Any]]
    top_detected_diseases: List[Dict[str, Any]]


class OutbreakClusterItem(BaseModel):
    """Aggregated spatial cluster of disease detections."""
    grid_lat: float
    grid_lon: float
    crop: str
    disease_name: str
    severity: str
    case_count: int
    sample_coordinates: List[float]
    last_detected_at: datetime


class OutbreakClustersResponse(BaseModel):
    total_clusters: int
    clusters: List[OutbreakClusterItem]
