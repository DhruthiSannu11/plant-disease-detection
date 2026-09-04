import os
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.app.api.v1.predict import router as predict_router
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.scans import router as scans_router
from backend.app.api.v1.outbreaks import router as outbreaks_router
from backend.app.db.session import init_db

from contextlib import asynccontextmanager

# Application Lifespan Handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
    except Exception as e:
        print(f"⚠️ Database initialization warning: {e}")
    yield

# Initialize FastAPI Application
app = FastAPI(
    title="Plant Disease Detection API",
    description="Production-Grade Botanical Diagnostic & Explainable AI (Grad-CAM) Microservice",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(predict_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(scans_router, prefix="/api/v1")
app.include_router(outbreaks_router, prefix="/api/v1")


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    environment: str


@app.get("/", response_model=HealthResponse)
@app.get("/health", response_model=HealthResponse)
@app.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    """System Health Check Endpoint for Load Balancers & Monitoring"""
    return HealthResponse(
        status="healthy",
        service="Plant Disease Detection API Engine",
        version="1.0.0",
        timestamp=datetime.now(timezone.utc).isoformat(),
        environment=os.getenv("ENVIRONMENT", "development"),
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
