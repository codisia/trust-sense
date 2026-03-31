"""
RBAC: Role-Based Access Control
Roles: admin | analyst | viewer
- admin: full access, manage users, stats, no rate limit
- analyst: run analyses, view own history & insights
- viewer: read-only dashboards and history (no run analysis)
"""
from typing import List, Optional
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.core.database import get_db
from app.core.security import decode_token
from app.core.config import settings
from app.models.models import User

ALLOWED_ROLES = ("admin", "analyst", "viewer")


def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Return current user from JWT or None if not authenticated. Handles both backend and Supabase JWTs."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split(" ", 1)[1]
        
        # Try backend JWT first
        payload = decode_token(token)
        if payload:
            try:
                user_id = int(payload.get("sub"))
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    return user
            except (ValueError, TypeError):
                pass
        
        # Try Supabase JWT
        if settings.SUPABASE_JWT_SECRET:
            try:
                payload = jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    options={"verify_aud": False},
                )
                email = payload.get("email")
                sub = payload.get("sub")
                user_metadata = payload.get("user_metadata", {})
                
                # Find user by email
                user = None
                if email:
                    user = db.query(User).filter(User.email == email).first()
                
                # Auto-create if not found
                if not user and (email or sub):
                    username = user_metadata.get("username") or (email or sub or "user").split("@")[0]
                    existing = db.query(User).filter(User.username == username).first()
                    if existing:
                        username = f"{username}_{sub[:8] if sub else 'user'}"
                    
                    user = User(
                        email=email or f"{sub}@supabase.local",
                        username=username,
                        password_hash="supabase_oauth",
                        role=user_metadata.get("role", "analyst"),
                        subscription_tier=user_metadata.get("subscription_tier", "free"),
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                
                if user and user.is_active:
                    return user
            except JWTError:
                pass
        
        return None
    except Exception:
        return None


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """Return current user from JWT or raise 401."""
    user = get_current_user_optional(authorization=authorization, db=db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account deactivated",
        )
    return user


def require_roles(allowed_roles: List[str]):
    """Dependency: require current user to have one of the given roles."""

    def _require(current_user: User = Depends(get_current_user)) -> User:
        role = (current_user.role or "viewer").lower()
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {', '.join(allowed_roles)}",
            )
        return current_user

    return _require


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency: require admin role."""
    if (current_user.role or "").lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def require_analyst_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency: require analyst or admin (e.g. for running analysis)."""
    role = (current_user.role or "").lower()
    if role not in ("admin", "analyst"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Analyst or Admin access required",
        )
    return current_user
