"""
FastAPI Authentication & User Account Management Endpoints (/api/v1/auth).
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.api.deps import get_db, get_current_user
from backend.app.core.security import hash_password, verify_password, create_access_token
from backend.app.db.models import User, ScanRecord
from backend.app.schemas.user import UserCreate, UserLogin, UserOut, Token

router = APIRouter(prefix="/auth", tags=["User Authentication & Accounts"])


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register New User Account",
    description="Creates a new farmer, agronomist, or researcher account and returns an access token.",
)
def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
) -> Token:
    """Register a new user."""
    # Check if user with this email already exists
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    # Create new user
    hashed = hash_password(user_in.password)
    user = User(
        email=user_in.email.lower(),
        full_name=user_in.full_name,
        hashed_password=hashed,
        is_active=True,
        is_superuser=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate JWT token
    access_token = create_access_token(subject=user.id)

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="User Login & Token Generation",
    description="Authenticate with email and password to receive a JWT access token.",
)
def login_user(
    user_in: UserLogin,
    db: Session = Depends(get_db),
) -> Token:
    """Authenticate user and issue JWT token."""
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive.",
        )

    access_token = create_access_token(subject=user.id)

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.get(
    "/me",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Get Current User Profile & Scan Statistics",
    description="Returns the profile and scan statistics for the currently logged-in user.",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieve currently authenticated user profile and summary metrics."""
    total_scans = db.query(func.count(ScanRecord.id)).filter(ScanRecord.user_id == current_user.id).scalar() or 0
    
    # Most frequently detected disease
    top_disease = (
        db.query(ScanRecord.disease_name, func.count(ScanRecord.id).label("count"))
        .filter(ScanRecord.user_id == current_user.id)
        .group_by(ScanRecord.disease_name)
        .order_by(func.count(ScanRecord.id).desc())
        .first()
    )

    return {
        "user": UserOut.model_validate(current_user),
        "stats": {
            "total_scans": total_scans,
            "most_frequent_disease": top_disease[0] if top_disease else None,
        },
    }
