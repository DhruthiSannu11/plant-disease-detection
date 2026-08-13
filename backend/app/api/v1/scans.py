"""
FastAPI Scan History Management Endpoints (/api/v1/scans).
Provides CRUD endpoints for leaf diagnostics history, pagination, and filtering.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.api.deps import get_db, get_current_user, get_current_user_optional
from backend.app.db.models import User, ScanRecord, CropLocation
from backend.app.schemas.scan import ScanCreate, ScanOut, ScanListResponse, ScanUpdate
from backend.app.services.diagnosis_service import DiagnosisService

router = APIRouter(prefix="/scans", tags=["Scan History & Records"])


@router.post(
    "",
    response_model=ScanOut,
    status_code=status.HTTP_201_CREATED,
    summary="Record New Plant Disease Scan",
    description="Save a new plant diagnostic leaf scan record with confidence, location, and metadata.",
)
def create_scan_record(
    scan_in: ScanCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> ScanOut:
    """Create a new scan record."""
    diagnosis_service = DiagnosisService()
    diag_details = diagnosis_service.get_diagnosis(scan_in.disease_name)

    common_name = scan_in.common_name or (diag_details.common_name if diag_details else None)
    scientific_name = scan_in.scientific_name or (diag_details.scientific_name if diag_details else None)
    severity = scan_in.severity or (diag_details.severity if diag_details else "Moderate")

    scan = ScanRecord(
        user_id=current_user.id if current_user else None,
        crop=scan_in.crop,
        disease_name=scan_in.disease_name,
        common_name=common_name,
        scientific_name=scientific_name,
        confidence=round(scan_in.confidence, 4),
        severity=severity,
        image_path=scan_in.image_path,
        heatmap_data=scan_in.heatmap_data,
        latitude=scan_in.latitude,
        longitude=scan_in.longitude,
        location_name=scan_in.location_name,
        notes=scan_in.notes,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    # If coordinates are present, create CropLocation entry for outbreak mapping
    if scan_in.latitude is not None and scan_in.longitude is not None:
        location_entry = CropLocation(
            scan_id=scan.id,
            latitude=scan_in.latitude,
            longitude=scan_in.longitude,
            crop=scan_in.crop,
            disease_name=scan_in.disease_name,
            severity=severity,
        )
        db.add(location_entry)
        db.commit()

    scan_out = ScanOut.model_validate(scan)
    scan_out.details = diag_details
    return scan_out


@router.get(
    "",
    response_model=ScanListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Paginated Scan History",
    description="Retrieve paginated scan history for the authenticated user with optional crop and severity filters.",
)
def list_user_scans(
    skip: int = Query(0, ge=0, description="Offset number of records"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of records to return"),
    crop: Optional[str] = Query(None, description="Filter by crop name (e.g. Tomato, Potato)"),
    disease_name: Optional[str] = Query(None, description="Filter by disease name"),
    severity: Optional[str] = Query(None, description="Filter by severity level (Low, Moderate, High, Critical)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScanListResponse:
    """List historical scan records for the logged-in user."""
    query = db.query(ScanRecord).filter(ScanRecord.user_id == current_user.id)

    if crop:
        query = query.filter(ScanRecord.crop.ilike(f"%{crop}%"))
    if disease_name:
        query = query.filter(ScanRecord.disease_name.ilike(f"%{disease_name}%"))
    if severity:
        query = query.filter(ScanRecord.severity.ilike(f"%{severity}%"))

    total = query.count()
    items = query.order_by(desc(ScanRecord.created_at)).offset(skip).limit(limit).all()

    diagnosis_service = DiagnosisService()
    scan_items = []
    for item in items:
        out = ScanOut.model_validate(item)
        out.details = diagnosis_service.get_diagnosis(item.disease_name)
        scan_items.append(out)

    return ScanListResponse(
        total=total,
        page=(skip // limit) + 1,
        page_size=limit,
        items=scan_items,
    )


@router.get(
    "/{scan_id}",
    response_model=ScanOut,
    status_code=status.HTTP_200_OK,
    summary="Get Specific Scan Record Details",
    description="Retrieve single leaf diagnostic scan details including full botanical treatment guide.",
)
def get_scan_by_id(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> ScanOut:
    """Retrieve details of a single scan."""
    scan = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan record with ID {scan_id} not found.",
        )

    # If scan is owned by a user, ensure only the owner or superuser can access it
    if scan.user_id is not None:
        if not current_user or (current_user.id != scan.user_id and not current_user.is_superuser):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this scan record.",
            )

    diagnosis_service = DiagnosisService()
    scan_out = ScanOut.model_validate(scan)
    scan_out.details = diagnosis_service.get_diagnosis(scan.disease_name)
    return scan_out


@router.delete(
    "/{scan_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Scan Record",
    description="Delete a plant disease scan entry from the user's history.",
)
def delete_scan_record(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a scan record."""
    scan = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan record with ID {scan_id} not found.",
        )

    if scan.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this scan record.",
        )

    db.delete(scan)
    db.commit()

    return {"success": True, "message": f"Scan record {scan_id} deleted successfully."}
