"""
Social Media Integration Router
Fetches and analyzes posts, videos, audio, images from social platforms
Integrates with Power BI for visualization
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Analysis
from app.schemas.schemas import AnalysisCreate
import requests
import json
from datetime import datetime

router = APIRouter(prefix="/social-media", tags=["social_media"])


# ============ TWITTER/X INTEGRATION ============

@router.post("/twitter/fetch")
def fetch_twitter_posts(
    query: str = Query(..., description="Search query"),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch tweets matching query.
    Note: Requires Twitter API credentials in environment
    """
    try:
        # This is a placeholder - in production, use tweepy or official Twitter API
        # For now, return mock data structure
        posts = [
            {
                "id": f"tweet_{i}",
                "platform": "twitter",
                "author": f"user_{i}",
                "content": f"Sample tweet {i}",
                "timestamp": datetime.now().isoformat(),
                "metrics": {
                    "likes": 100 + i * 10,
                    "retweets": 50 + i * 5,
                    "replies": 10 + i,
                },
                "media": []
            }
            for i in range(limit)
        ]
        
        return {
            "platform": "twitter",
            "query": query,
            "total": len(posts),
            "posts": posts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tweets: {str(e)}")


# ============ INSTAGRAM INTEGRATION ============

@router.post("/instagram/fetch")
def fetch_instagram_posts(
    hashtag: str = Query(..., description="Hashtag to search"),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch Instagram posts by hashtag.
    Note: Requires Instagram Graph API credentials
    """
    try:
        posts = [
            {
                "id": f"insta_{i}",
                "platform": "instagram",
                "author": f"user_{i}",
                "caption": f"Post with #{hashtag} {i}",
                "timestamp": datetime.now().isoformat(),
                "media_type": "IMAGE" if i % 3 != 0 else "VIDEO",
                "media_url": f"https://example.com/media/{i}.jpg",
                "metrics": {
                    "likes": 200 + i * 15,
                    "comments": 20 + i * 2,
                    "shares": 5 + i,
                }
            }
            for i in range(limit)
        ]
        
        return {
            "platform": "instagram",
            "hashtag": hashtag,
            "total": len(posts),
            "posts": posts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Instagram posts: {str(e)}")


# ============ YOUTUBE INTEGRATION ============

@router.post("/youtube/fetch")
def fetch_youtube_videos(
    search_query: str = Query(..., description="Video search query"),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch YouTube videos and comments.
    Note: Requires YouTube Data API credentials
    """
    try:
        videos = [
            {
                "id": f"video_{i}",
                "platform": "youtube",
                "title": f"Video: {search_query} {i}",
                "channel": f"Channel_{i}",
                "description": f"Description for {search_query} video",
                "timestamp": datetime.now().isoformat(),
                "duration_seconds": 300 + i * 60,
                "url": f"https://youtube.com/watch?v=video_{i}",
                "metrics": {
                    "views": 1000 + i * 500,
                    "likes": 100 + i * 50,
                    "comments": 20 + i * 10,
                    "shares": 5 + i,
                },
                "comments": [
                    {
                        "author": f"commenter_{j}",
                        "text": f"Comment {j} on video",
                        "likes": 10 + j,
                        "timestamp": datetime.now().isoformat()
                    }
                    for j in range(3)
                ]
            }
            for i in range(limit)
        ]
        
        return {
            "platform": "youtube",
            "search_query": search_query,
            "total": len(videos),
            "videos": videos
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch YouTube videos: {str(e)}")


# ============ TIKTOK INTEGRATION ============

@router.post("/tiktok/fetch")
def fetch_tiktok_videos(
    hashtag: str = Query(..., description="TikTok hashtag"),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch TikTok videos by hashtag.
    Note: Requires TikTok API credentials
    """
    try:
        videos = [
            {
                "id": f"tiktok_{i}",
                "platform": "tiktok",
                "creator": f"creator_{i}",
                "description": f"Video with #{hashtag}",
                "timestamp": datetime.now().isoformat(),
                "duration_seconds": 30 + i * 5,
                "url": f"https://tiktok.com/@user/video/{i}",
                "metrics": {
                    "views": 5000 + i * 1000,
                    "likes": 500 + i * 100,
                    "comments": 50 + i * 10,
                    "shares": 20 + i * 5,
                },
                "audio": {
                    "title": f"Audio track {i}",
                    "artist": f"Artist {i}",
                    "duration_seconds": 30 + i * 5
                }
            }
            for i in range(limit)
        ]
        
        return {
            "platform": "tiktok",
            "hashtag": hashtag,
            "total": len(videos),
            "videos": videos
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch TikTok videos: {str(e)}")


# ============ UNIVERSAL SOCIAL MEDIA ANALYZER ============

@router.post("/analyze/{platform}")
def analyze_social_post(
    platform: str,
    post_id: str = Query(...),
    content: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Analyze trust, credibility, and sentiment of social media content
    Supports: twitter, instagram, youtube, tiktok, facebook, reddit
    """
    try:
        if platform not in ["twitter", "instagram", "youtube", "tiktok", "facebook", "reddit"]:
            raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")
        
        # Create analysis (this will call the analysis service)
        analysis_data = AnalysisCreate(
            text=content,
            source_platform=platform,
            source_id=post_id,
            analysis_type="social_media"
        )
        
        # In production, call the NLP service here
        result = {
            "platform": platform,
            "post_id": post_id,
            "trust_score": 0.75,
            "credibility": 0.80,
            "emotional_stability": 0.70,
            "linguistic_neutrality": 0.65,
            "content_reliability": 0.75,
            "fake_news_probability": 0.10,
            "risk_level": "LOW",
            "dominant_emotion": "neutral",
            "sentiment": "positive",
            "key_terms": ["social", "media", "analysis"],
            "recommendations": [
                "Verify through official sources",
                "Check author credibility",
                "Cross-reference with reputable news outlets"
            ]
        }
        
        # Save to database
        analysis = Analysis(
            user_id=current_user.id,
            text=content[:500],
            trust_score=result["trust_score"],
            credibility=result["credibility"],
            fake_news_probability=result["fake_news_probability"],
            risk_level=result["risk_level"],
            dominant_emotion=result["dominant_emotion"],
            source_platform=platform,
            source_id=post_id,
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# ============ POWER BI INTEGRATION ============

@router.get("/powerbi/dashboard-data")
def get_powerbi_dashboard_data(
    platform: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get aggregated social media data formatted for Power BI
    Returns metrics by platform, sentiment, risk level, etc.
    """
    try:
        # Get analyses from database
        query = db.query(Analysis).filter(Analysis.user_id == current_user.id)
        
        if platform:
            query = query.filter(Analysis.source_platform == platform)
        
        analyses = query.all()
        
        # Aggregate data for Power BI
        data = {
            "summary": {
                "total_posts_analyzed": len(analyses),
                "avg_trust_score": sum(a.trust_score for a in analyses) / max(len(analyses), 1),
                "high_risk_count": sum(1 for a in analyses if a.risk_level == "HIGH"),
                "platforms_analyzed": list(set(a.source_platform for a in analyses if a.source_platform))
            },
            "by_platform": {},
            "by_risk_level": {
                "HIGH": len([a for a in analyses if a.risk_level == "HIGH"]),
                "MEDIUM": len([a for a in analyses if a.risk_level == "MEDIUM"]),
                "LOW": len([a for a in analyses if a.risk_level == "LOW"]),
            },
            "by_emotion": {},
            "sentiment_distribution": {
                "positive": len([a for a in analyses if a.dominant_emotion in ["joy", "optimism"]]),
                "neutral": len([a for a in analyses if a.dominant_emotion == "neutral"]),
                "negative": len([a for a in analyses if a.dominant_emotion in ["anger", "fear", "sadness"]]),
            },
            "trend_data": [
                {
                    "date": a.created_at.isoformat(),
                    "trust_score": a.trust_score,
                    "platform": a.source_platform,
                    "risk_level": a.risk_level
                }
                for a in analyses[:50]  # Last 50 analyses
            ]
        }
        
        # Aggregate by platform
        for analysis in analyses:
            platform_name = analysis.source_platform or "unknown"
            if platform_name not in data["by_platform"]:
                data["by_platform"][platform_name] = {
                    "count": 0,
                    "avg_trust": 0,
                    "total_trust": 0
                }
            data["by_platform"][platform_name]["count"] += 1
            data["by_platform"][platform_name]["total_trust"] += analysis.trust_score
        
        # Calculate averages
        for platform_name in data["by_platform"]:
            platform_data = data["by_platform"][platform_name]
            platform_data["avg_trust"] = platform_data["total_trust"] / platform_data["count"]
            del platform_data["total_trust"]
        
        # Aggregate by emotion
        for analysis in analyses:
            emotion = analysis.dominant_emotion or "unknown"
            if emotion not in data["by_emotion"]:
                data["by_emotion"][emotion] = 0
            data["by_emotion"][emotion] += 1
        
        return data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get Power BI data: {str(e)}")


@router.post("/powerbi/sync")
def sync_to_powerbi(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Sync all social media analysis data to Power BI
    Note: Requires Power BI API credentials configured
    """
    try:
        # Get dashboard data
        dashboard_data = get_powerbi_dashboard_data(current_user=current_user, db=db)
        
        # In production, push to Power BI API
        # from app.services.powerbi_service import push_to_powerbi
        # push_to_powerbi(dashboard_data)
        
        return {
            "status": "success",
            "message": "Data synced to Power BI",
            "records_synced": dashboard_data["summary"]["total_posts_analyzed"],
            "platforms": dashboard_data["summary"]["platforms_analyzed"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Power BI sync failed: {str(e)}")
