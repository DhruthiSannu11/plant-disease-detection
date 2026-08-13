"""
SQLAlchemy Relational Database Models for Users, Scan History, and Outbreak Geolocation.
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship

from backend.app.db.base import Base


class User(Base):
    """User account model for farmers, agronomists, and researchers."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    scans = relationship(
        "ScanRecord",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(ScanRecord.created_at)",
    )


class ScanRecord(Base):
    """Diagnostic leaf scan record storing disease classification results, treatment info, and location."""

    __tablename__ = "scan_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)

    # Disease classification details
    crop = Column(String(100), index=True, nullable=False)
    disease_name = Column(String(150), index=True, nullable=False)
    common_name = Column(String(150), nullable=True)
    scientific_name = Column(String(150), nullable=True)
    confidence = Column(Float, nullable=False)
    severity = Column(String(50), nullable=True)  # Low, Moderate, High, Critical

    # Image & Heatmap storage references
    image_path = Column(String(500), nullable=True)
    heatmap_data = Column(Text, nullable=True)  # Base64 string or storage key

    # Geolocation for crop outbreak tracking
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="scans")
    locations = relationship(
        "CropLocation",
        back_populates="scan",
        cascade="all, delete-orphan",
    )


class CropLocation(Base):
    """Crop disease outbreak coordinate point for spatial aggregation and heatmaps."""

    __tablename__ = "crop_locations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scan_id = Column(Integer, ForeignKey("scan_records.id", ondelete="CASCADE"), nullable=True)

    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    crop = Column(String(100), index=True, nullable=False)
    disease_name = Column(String(150), index=True, nullable=False)
    severity = Column(String(50), default="Moderate", nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )

    # Relationships
    scan = relationship("ScanRecord", back_populates="locations")
