"""
FastAPI Route Dependencies for Database Sessions and User Authentication.
"""

from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.app.core.security import decode_access_token
from backend.app.db.session import SessionLocal
from backend.app.db.models import User

# HTTP Bearer security scheme
security_scheme = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    """Dependency yielding a database session for the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Dependency requiring a valid JWT Bearer token and returning the authenticated User."""
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload["sub"]
    try:
        user_id = int(user_id_str)
        user = db.query(User).filter(User.id == user_id).first()
    except (ValueError, TypeError):
        # Fallback query by email if subject was stored as email
        user = db.query(User).filter(User.email == user_id_str).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User associated with this token no longer exists.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account.",
        )

    return user


def get_current_user_optional(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Dependency extracting the user if a valid token is provided, otherwise returning None."""
    if not auth_header:
        return None

    try:
        token = auth_header.credentials
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            return None

        user_id_str = payload["sub"]
        try:
            user_id = int(user_id_str)
            user = db.query(User).filter(User.id == user_id).first()
        except (ValueError, TypeError):
            user = db.query(User).filter(User.email == user_id_str).first()

        if user and user.is_active:
            return user
        return None
    except Exception:
        return None
