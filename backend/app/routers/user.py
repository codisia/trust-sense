from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models.models import User
from app.routers.audio_video import get_current_user

router = APIRouter()

class PrefsUpdate(BaseModel):
    language: Optional[str] = None

@router.get("/api/user/preferences")
def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Handle unauthenticated requests gracefully
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated. Please login first."
        )
    try:
        # return only the fields we care about
        return {"language": current_user.language or "en"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching preferences: {str(e)}"
        )

@router.put("/api/user/preferences")
def update_preferences(
    prefs: PrefsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Handle unauthenticated requests gracefully
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated. Please login first."
        )
    try:
        if prefs.language:
            current_user.language = prefs.language
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        return {"language": current_user.language or "en", "success": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error updating preferences: {str(e)}"
        )
