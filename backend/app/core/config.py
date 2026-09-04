"""
Application Configuration & Settings for Plant Disease Detection Backend.
"""

import os
from typing import List
from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Plant Disease Detection API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Security & JWT Tokens
    SECRET_KEY: str = os.getenv("SECRET_KEY", "plant-disease-detection-secret-key-change-in-prod-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database Configuration (Defaults to local SQLite for $0 zero-config development)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./plant_disease.db"
    )

    # Redis Cache & Celery Asynchronous Workers
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", os.getenv("REDIS_URL", "redis://localhost:6379/0"))

    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = ["*"]


settings = Settings()
