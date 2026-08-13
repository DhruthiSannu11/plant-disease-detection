"""
Database Session Management & Engine Initialization.
Supports zero-config local SQLite and PostgreSQL in Docker/Production.
"""

import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from backend.app.core.config import settings
from backend.app.db.base import Base

# Database engine configuration
database_url = settings.DATABASE_URL
connect_args = {}

# If running outside Docker or without asyncpg driver, use SQLite fallback
if "asyncpg" in database_url or ("@db:" in database_url and not os.getenv("IS_DOCKER")):
    database_url = "sqlite:///./plant_disease.db"

if database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

try:
    engine = create_engine(
        database_url,
        connect_args=connect_args,
        pool_pre_ping=True,
    )
except Exception:
    database_url = "sqlite:///./plant_disease.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        database_url,
        connect_args=connect_args,
        pool_pre_ping=True,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Creates all database tables defined in models."""
    # Import all models to ensure they are registered with Base.metadata
    from backend.app.db import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    print("✅ Database tables initialized successfully.")


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining database session per HTTP request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
