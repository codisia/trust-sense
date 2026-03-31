from typing import Optional
import json
from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.models import User


def get_supabase_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """
    Resolve current user from a Supabase JWT (access token).

    Expected:
    - Authorization: Bearer <supabase_access_token>
    - JWT signed with SUPABASE_JWT_SECRET (Project Settings → API → JWT Secret)
    
    Supports:
    - Email/password login
    - OAuth providers (Google, GitHub, etc.)
    - Magic links
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token",
        )

    token = authorization.split(" ", 1)[1]

    if not settings.SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET not configured on backend",
        )

    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Supabase token",
        )

    sub = payload.get("sub")
    email = payload.get("email")
    role = payload.get("role") or "analyst"
    user_metadata = payload.get("user_metadata", {})

    if not sub and not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Supabase token payload",
        )

    # Basic user resolution: by email (unique in our User model)
    user: Optional[User] = None
    if email:
        user = db.query(User).filter(User.email == email).first()

    # Auto-provision user row if not found
    if not user:
        # Extract username from metadata or email
        username = user_metadata.get("username") or (email or sub or "user").split("@")[0]
        
        # Ensure unique username
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            # Append user ID to make unique
            username = f"{username}_{sub[:8]}"
        
        user = User(
            email=email or f"{sub}@supabase.local",
            username=username,
            password_hash="supabase_oauth",  # OAuth users don't have passwords
            role=user_metadata.get("role", role),
            subscription_tier=user_metadata.get("subscription_tier", "free"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    return user


def validate_supabase_token(token: str) -> Optional[dict]:
    """
    Validate and decode a Supabase JWT token.
    
    Returns:
        dict with token payload if valid, None otherwise
    """
    if not settings.SUPABASE_JWT_SECRET:
        return None
    
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError:
        return None


def get_supabase_user_from_token(token: str, db: Session) -> Optional[User]:
    """
    Get or create user from a Supabase token.
    Used for programmatic OAuth flows.
    """
    payload = validate_supabase_token(token)
    if not payload:
        return None
    
    email = payload.get("email")
    sub = payload.get("sub")
    user_metadata = payload.get("user_metadata", {})
    
    if not email and not sub:
        return None
    
    # Try to find existing user
    user = None
    if email:
        user = db.query(User).filter(User.email == email).first()
    
    if not user and sub:
        user = db.query(User).filter(User.email == f"{sub}@supabase.local").first()
    
    # Auto-create if not found
    if not user:
        username = user_metadata.get("username") or (email or sub or "user").split("@")[0]
        
        # Ensure unique username
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            username = f"{username}_{sub[:8]}"
        
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
    
    if user and not user.is_active:
        return None
    
    return user


def get_supabase_config() -> dict:
    """Get Supabase configuration for frontend."""
    return {
        "configured": bool(settings.SUPABASE_URL),
        "url": settings.SUPABASE_URL,
        "anon_key": settings.SUPABASE_KEY,
        "oauth_providers": [
            "google",
            "github",
            "azure",
            "discord",
        ] if settings.SUPABASE_URL else [],
        "message": "Supabase is configured" if settings.SUPABASE_URL else "Supabase not configured"
    }

