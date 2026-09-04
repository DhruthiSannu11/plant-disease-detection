"""
FastAPI Crop Disease Outbreak Geolocation & Heatmapping API (/api/v1/outbreaks).
Conforms strictly to RFC 7946 GeoJSON specifications for map visualization.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from collections import Counter, defaultdict

from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from backend.app.api.deps import get_db
from backend.app.db.models import CropLocation
from backend.app.schemas.outbreak import (
    GeoJSONFeatureCollection,
    GeoJSONFeature,
    GeoJSONGeometry,
    OutbreakProperties,
    OutbreakStatsResponse,
    OutbreakClustersResponse,
    OutbreakClusterItem,
    OutbreakReportCreate,
)

router = APIRouter(prefix="/outbreaks", tags=["Outbreak Location Mapping & Surveillance"])


@router.get(
    "/geojson",
    response_model=GeoJSONFeatureCollection,
    status_code=status.HTTP_200_OK,
    summary="Get Crop Disease Outbreak Locations as GeoJSON",
    description="Returns standard RFC 7946 GeoJSON FeatureCollection compatible with Leaflet, Mapbox, and MapLibre.",
)
def get_outbreak_geojson(
    crop: Optional[str] = Query(None, description="Filter by crop name (e.g., Tomato, Potato, Apple)"),
    disease_name: Optional[str] = Query(None, description="Filter by specific disease name"),
    severity: Optional[str] = Query(None, description="Filter by severity level (Low, Moderate, High, Severe, Critical)"),
    days: int = Query(30, ge=1, le=365, description="Lookback window in days (default: 30 days)"),
    limit: int = Query(200, ge=1, le=1000, description="Max number of locations to return"),
    db: Session = Depends(get_db),
) -> GeoJSONFeatureCollection:
    """Retrieve disease outbreaks as standard GeoJSON points with properties."""
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

    query = db.query(CropLocation).filter(CropLocation.created_at >= cutoff_date)

    if crop:
        query = query.filter(CropLocation.crop.ilike(f"%{crop}%"))
    if disease_name:
        query = query.filter(CropLocation.disease_name.ilike(f"%{disease_name}%"))
    if severity:
        query = query.filter(CropLocation.severity.ilike(severity))

    locations = query.order_by(desc(CropLocation.created_at)).limit(limit).all()

    features: List[GeoJSONFeature] = []
    for loc in locations:
        feature = GeoJSONFeature(
            geometry=GeoJSONGeometry(
                coordinates=[loc.longitude, loc.latitude]  # GeoJSON is [longitude, latitude]
            ),
            properties=OutbreakProperties(
                id=loc.id,
                scan_id=loc.scan_id,
                crop=loc.crop,
                disease_name=loc.disease_name,
                severity=loc.severity,
                latitude=loc.latitude,
                longitude=loc.longitude,
                created_at=loc.created_at,
            ),
        )
        features.append(feature)

    return GeoJSONFeatureCollection(
        features=features,
        total_features=len(features),
    )


@router.get(
    "/stats",
    response_model=OutbreakStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Outbreak Surveillance Statistics",
    description="Returns aggregate metrics on reported plant disease cases, severity distributions, and top affected crops.",
)
def get_outbreak_stats(
    days: int = Query(60, ge=1, le=365, description="Lookback window in days"),
    db: Session = Depends(get_db),
) -> OutbreakStatsResponse:
    """Computes epidemiological summaries across all outbreak records."""
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    records = db.query(CropLocation).filter(CropLocation.created_at >= cutoff_date).all()

    if not records:
        return OutbreakStatsResponse(
            total_outbreaks=0,
            total_crops_affected=0,
            total_diseases_detected=0,
            severity_breakdown={},
            top_affected_crops=[],
            top_detected_diseases=[],
        )

    crop_counts = Counter(r.crop for r in records)
    disease_counts = Counter(r.disease_name for r in records)
    severity_counts = Counter(r.severity for r in records)

    top_crops = [{"crop": c, "count": cnt} for c, cnt in crop_counts.most_common(5)]
    top_diseases = [{"disease_name": d, "count": cnt} for d, cnt in disease_counts.most_common(5)]

    return OutbreakStatsResponse(
        total_outbreaks=len(records),
        total_crops_affected=len(crop_counts),
        total_diseases_detected=len(disease_counts),
        severity_breakdown=dict(severity_counts),
        top_affected_crops=top_crops,
        top_detected_diseases=top_diseases,
    )


@router.get(
    "/clusters",
    response_model=OutbreakClustersResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Spatial Disease Clusters",
    description="Groups nearby crop disease locations into spatial grid clusters for heatmap density analysis.",
)
def get_outbreak_clusters(
    grid_size: float = Query(0.2, ge=0.01, le=2.0, description="Spatial grid cell size in degrees (~22km)"),
    crop: Optional[str] = Query(None, description="Optional crop filter"),
    days: int = Query(30, ge=1, le=365, description="Lookback window in days"),
    db: Session = Depends(get_db),
) -> OutbreakClustersResponse:
    """Aggregates geographic points into density clusters."""
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    query = db.query(CropLocation).filter(CropLocation.created_at >= cutoff_date)

    if crop:
        query = query.filter(CropLocation.crop.ilike(f"%{crop}%"))

    locations = query.all()

    # Spatial grouping by rounded grid coordinates
    grid_buckets: Dict[tuple, List[CropLocation]] = defaultdict(list)
    for loc in locations:
        grid_lat = round(loc.latitude / grid_size) * grid_size
        grid_lon = round(loc.longitude / grid_size) * grid_size
        grid_buckets[(grid_lat, grid_lon, loc.crop, loc.disease_name)].append(loc)

    clusters: List[OutbreakClusterItem] = []
    for (grid_lat, grid_lon, loc_crop, disease_name), group in grid_buckets.items():
        sorted_group = sorted(group, key=lambda x: x.created_at, reverse=True)
        most_common_severity = Counter(x.severity for x in group).most_common(1)[0][0]

        clusters.append(
            OutbreakClusterItem(
                grid_lat=round(grid_lat, 4),
                grid_lon=round(grid_lon, 4),
                crop=loc_crop,
                disease_name=disease_name,
                severity=most_common_severity,
                case_count=len(group),
                sample_coordinates=[sorted_group[0].longitude, sorted_group[0].latitude],
                last_detected_at=sorted_group[0].created_at,
            )
        )

    clusters.sort(key=lambda x: x.case_count, reverse=True)
    return OutbreakClustersResponse(
        total_clusters=len(clusters),
        clusters=clusters,
    )


@router.post(
    "",
    response_model=GeoJSONFeature,
    status_code=status.HTTP_201_CREATED,
    summary="Record New Outbreak Report",
    description="Save a field disease observation coordinate point for spatial tracking.",
)
def create_outbreak_report(
    report_in: OutbreakReportCreate,
    db: Session = Depends(get_db),
) -> GeoJSONFeature:
    """Manually report or ingest disease detection coordinates."""
    location = CropLocation(
        latitude=report_in.latitude,
        longitude=report_in.longitude,
        crop=report_in.crop,
        disease_name=report_in.disease_name,
        severity=report_in.severity or "Moderate",
    )
    db.add(location)
    db.commit()
    db.refresh(location)

    # Optional: trigger Celery async cluster check task in background if worker is enabled
    try:
        from backend.app.workers.tasks import check_outbreak_cluster_alert_task
        check_outbreak_cluster_alert_task.delay(
            latitude=location.latitude,
            longitude=location.longitude,
            crop=location.crop,
            disease_name=location.disease_name,
        )
    except Exception:
        # Graceful fallback if Celery/Redis is not running in local test environment
        pass

    return GeoJSONFeature(
        geometry=GeoJSONGeometry(coordinates=[location.longitude, location.latitude]),
        properties=OutbreakProperties(
            id=location.id,
            scan_id=location.scan_id,
            crop=location.crop,
            disease_name=location.disease_name,
            severity=location.severity,
            latitude=location.latitude,
            longitude=location.longitude,
            created_at=location.created_at,
        ),
    )
