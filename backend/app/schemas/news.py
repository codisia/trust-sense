"""Pydantic schemas for the News pipeline APIs."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, HttpUrl


class NewsPipelineRequest(BaseModel):
    sources: Optional[List[str]] = None
    language: str = "en"
    trust_threshold: float = 70.0
    publish_platforms: Optional[List[str]] = None
    include_sign_language: bool = False


class NewsArticleOut(BaseModel):
    id: int
    title: str
    content: Optional[str]
    source: Optional[str]
    language: str
    published_at: Optional[datetime]
    url: Optional[HttpUrl]
    trust_score: Optional[float]
    analysis_json: Optional[dict]

    class Config:
        from_attributes = True


class NewsVideoOut(BaseModel):
    id: int
    script_id: int
    video_url: Optional[HttpUrl]
    local_path: Optional[str]
    status: str
    metadata_json: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class NewsPipelineResponse(BaseModel):
    results: List[dict]
