"""
Celery Background Tasks for Image Archival, Outbreak Alerts, and Reporting.
"""

import os
import base64
import math
import logging
from io import BytesIO
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

from PIL import Image

from backend.app.workers.celery_app import celery_app
from backend.app.db.session import SessionLocal
from backend.app.db.models import ScanRecord, CropLocation
from backend.app.services.diagnosis_service import DiagnosisService

logger = logging.getLogger(__name__)

STORAGE_DIR = os.getenv("STORAGE_DIR", "uploads/scans")
THUMBNAIL_DIR = os.getenv("THUMBNAIL_DIR", "uploads/thumbnails")


def _calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in kilometers."""
    r = 6371.0  # Earth's radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


@celery_app.task(bind=True, name="archive_scan_image_task")
def archive_scan_image_task(self, scan_id: int, image_base64: str, filename_prefix: str = "scan") -> Dict[str, Any]:
    """
    Decodes uploaded base64 leaf image, saves to permanent storage,
    generates 128x128 thumbnail, and updates ScanRecord image_path.
    """
    try:
        os.makedirs(STORAGE_DIR, exist_ok=True)
        os.makedirs(THUMBNAIL_DIR, exist_ok=True)

        # Strip Data URL header if present
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]

        image_bytes = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_bytes))

        # Save main image
        file_name = f"{filename_prefix}_{scan_id}_{int(datetime.now(timezone.utc).timestamp())}.jpg"
        file_path = os.path.join(STORAGE_DIR, file_name)
        image.convert("RGB").save(file_path, "JPEG", quality=88, optimize=True)

        # Generate thumbnail
        thumb_name = f"thumb_{scan_id}_{int(datetime.now(timezone.utc).timestamp())}.jpg"
        thumb_path = os.path.join(THUMBNAIL_DIR, thumb_name)
        thumb_image = image.copy()
        thumb_image.thumbnail((128, 128))
        thumb_image.convert("RGB").save(thumb_path, "JPEG", quality=80)

        # Update database record if exists
        db = SessionLocal()
        try:
            scan = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
            if scan:
                scan.image_path = file_path
                db.commit()
        finally:
            db.close()

        logger.info(f"Scan {scan_id} successfully archived to {file_path}")
        return {
            "status": "success",
            "scan_id": scan_id,
            "image_path": file_path,
            "thumbnail_path": thumb_path,
        }
    except Exception as exc:
        logger.error(f"Failed to archive image for scan {scan_id}: {exc}")
        return {
            "status": "error",
            "scan_id": scan_id,
            "error": str(exc),
        }


@celery_app.task(bind=True, name="check_outbreak_cluster_alert_task")
def check_outbreak_cluster_alert_task(
    self,
    latitude: float,
    longitude: float,
    crop: str,
    disease_name: str,
    radius_km: float = 25.0,
    days_window: int = 14,
) -> Dict[str, Any]:
    """
    Analyzes whether nearby high-severity disease cases form an epidemic cluster.
    Triggers an outbreak warning if >= 3 cases detected within radius_km.
    """
    db = SessionLocal()
    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_window)
        candidates = (
            db.query(CropLocation)
            .filter(
                CropLocation.crop == crop,
                CropLocation.disease_name == disease_name,
                CropLocation.created_at >= cutoff_date,
            )
            .all()
        )

        nearby_count = 0
        nearby_locations = []

        for loc in candidates:
            dist = _calculate_haversine_distance(latitude, longitude, loc.latitude, loc.longitude)
            if dist <= radius_km:
                nearby_count += 1
                nearby_locations.append({
                    "id": loc.id,
                    "latitude": loc.latitude,
                    "longitude": loc.longitude,
                    "distance_km": round(dist, 2),
                    "severity": loc.severity,
                })

        alert_triggered = nearby_count >= 3
        threat_level = "CRITICAL" if nearby_count >= 5 else ("ELEVATED" if alert_triggered else "NORMAL")

        logger.info(
            f"Cluster analysis for {crop} - {disease_name}: {nearby_count} nearby cases (Alert: {alert_triggered})"
        )

        return {
            "crop": crop,
            "disease_name": disease_name,
            "radius_km": radius_km,
            "nearby_cases_count": nearby_count,
            "alert_triggered": alert_triggered,
            "threat_level": threat_level,
            "nearby_locations": nearby_locations,
        }
    except Exception as exc:
        logger.error(f"Outbreak cluster task error: {exc}")
        return {
            "status": "error",
            "error": str(exc),
        }
    finally:
        db.close()


@celery_app.task(bind=True, name="generate_diagnostic_pdf_task")
def generate_diagnostic_pdf_task(self, scan_id: int, user_email: Optional[str] = None) -> Dict[str, Any]:
    """
    Prepares complete botanical diagnostic report summary for export or email dispatch.
    """
    db = SessionLocal()
    try:
        scan = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
        if not scan:
            return {"status": "error", "error": f"Scan {scan_id} not found"}

        diagnosis_service = DiagnosisService()
        details = diagnosis_service.get_diagnosis(scan.disease_name)

        report_summary = {
            "scan_id": scan.id,
            "created_at": scan.created_at.isoformat() if scan.created_at else None,
            "crop": scan.crop,
            "disease_name": scan.disease_name,
            "common_name": scan.common_name or (details.common_name if details else scan.disease_name),
            "scientific_name": scan.scientific_name or (details.scientific_name if details else "Unknown"),
            "confidence": scan.confidence,
            "severity": scan.severity,
            "coordinates": {
                "latitude": scan.latitude,
                "longitude": scan.longitude,
                "location_name": scan.location_name,
            },
            "treatment": {
                "organic_remedies": details.organic_remedies if details else [],
                "chemical_treatments": details.chemical_treatments if details else [],
                "preventive_protocols": details.preventive_protocols if details else [],
            },
            "dispatched_to": user_email,
        }

        return {
            "status": "success",
            "scan_id": scan_id,
            "report_summary": report_summary,
        }
    finally:
        db.close()
