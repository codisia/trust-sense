"""News pipeline API endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin, get_current_user
from app.services.news_service import run_news_pipeline, list_latest_articles, list_videos
from app.schemas.news import NewsArticleOut, NewsVideoOut, NewsPipelineRequest, NewsPipelineResponse

router = APIRouter(prefix="/api/news", tags=["News"])


@router.post("/run", response_model=NewsPipelineResponse)
def run_pipeline(
    request: NewsPipelineRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Run the full news pipeline on demand."""
    if not user or user.role not in ["admin", "analyst"]:
        raise HTTPException(status_code=403, detail="Insufficient privileges")

    results = run_news_pipeline(
        db,
        sources=request.sources,
        language=request.language,
        trust_threshold=request.trust_threshold,
        publish_platforms=request.publish_platforms,
        include_sign_language=request.include_sign_language,
    )
    return {"results": results}


@router.get("/latest", response_model=List[NewsArticleOut])
def get_latest_articles(
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Return latest fetched and analyzed articles."""
    return list_latest_articles(db, limit=limit)


@router.get("/videos", response_model=List[NewsVideoOut])
def get_videos(
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Return most recently generated videos."""
    return list_videos(db, limit=limit)
