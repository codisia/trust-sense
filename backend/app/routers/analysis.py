"""
Advanced Analysis Router
Handles analysis submissions with rate limiting, role-based access, and psychological analysis
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, timedelta
import csv
import io
import os
import traceback

from app.core.database import get_db
from app.core.security import decode_token
from app.core.supabase_auth import get_supabase_user
from app.models.models import User, Analysis, UsageLog
from app.schemas.schemas import (
    TextAnalysisRequest,
    AnalysisResult,
    AnalysisHistoryItem,
    UsageStats,
    SocialMediaImportRequest,
    BatchTextAnalysisRequest,
)
from app.services.nlp_service import analyze_text
from app.services.psychological_service import PsychologicalAnalyzer
from app.services.social_media_service import SocialMediaImporter

router = APIRouter()


def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[User]:
    """
    Legacy JWT-based user resolution (internal/demo).
    Supabase-authenticated requests should use get_supabase_user instead.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split(" ", 1)[1]
        payload = decode_token(token)
        if not payload:
            return None
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except Exception:
        return None


# ─── RATE LIMITING CONFIGURATION ───
DAILY_LIMITS = {
    'free': 50 if os.environ.get('ENVIRONMENT') == 'development' else 3,
    'pro': 100,
    'enterprise': 1000,
}


def get_today_usage(user_id: int, db: Session) -> UsageLog:
    """Get or create today's usage log"""
    today = date.today()
    usage = db.query(UsageLog).filter(
        UsageLog.user_id == user_id,
        UsageLog.analysis_date == today
    ).first()
    
    if not usage:
        usage = UsageLog(user_id=user_id, analysis_date=today, analysis_count=0)
        db.add(usage)
        db.commit()
    
    return usage


def check_rate_limit(user: User, db: Session) -> tuple:
    """Check if user has exceeded daily limit"""
    tier = user.subscription_tier or 'free'
    limit = DAILY_LIMITS.get(tier, 3)
    usage = get_today_usage(user.id, db)
    remaining = max(0, limit - usage.analysis_count)
    return (remaining > 0, remaining, limit)


def increment_usage(user_id: int, db: Session):
    """Increment user's daily analysis count"""
    usage = get_today_usage(user_id, db)
    usage.analysis_count += 1
    db.commit()


@router.post("/analyze-text", response_model=dict)
def analyze_text_endpoint(
    request: TextAnalysisRequest,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """
    Analyze text content with NLP + Psychological analysis
    Optional auth: supports Supabase JWT or legacy JWT
    Subject to daily rate limits (if authenticated)
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        if len(request.text) > 10000:
            raise HTTPException(status_code=400, detail="Text too long (max 10,000 chars)")

        # Try to get user from auth header (optional)
        current_user = None
        if authorization and authorization.startswith("Bearer "):
            try:
                current_user = get_supabase_user(authorization=authorization, db=db)
            except Exception:
                # Fall back to anonymous for development
                if os.environ.get('ENVIRONMENT') != 'production':
                    current_user = None
                else:
                    raise

        # Check rate limit for non-admin users if authenticated
        if current_user and current_user.role != 'admin':
            can_analyze, remaining, limit = check_rate_limit(current_user, db)
            if not can_analyze:
                raise HTTPException(
                    status_code=429,
                    detail=f"Daily analysis limit ({limit}) reached. Resets at midnight UTC."
                )

        # Perform NLP analysis
        nlp_results = analyze_text(request.text)

        # Perform psychological analysis
        psych_results = PsychologicalAnalyzer.analyze(request.text)

        # Get or create anonymous user for development
        if not current_user:
            current_user = db.query(User).filter(User.username == "anonymous").first()
            if not current_user:
                current_user = User(
                    email="anonymous@demo.local",
                    username="anonymous",
                    password_hash="demo",
                    role="analyst",
                    subscription_tier="free",
                )
                db.add(current_user)
                db.commit()
                db.refresh(current_user)
        
        # Get or create default organization
        from app.models.models import Organization
        default_org = db.query(Organization).filter(Organization.slug == "demo").first()
        if not default_org:
            default_org = Organization(
                name="Demo Organization",
                slug="demo",
                owner_id=current_user.id,
                tier="free",
                is_active=True
            )
            db.add(default_org)
            db.commit()
            db.refresh(default_org)

        # Store analysis
        analysis = Analysis(
            user_id=current_user.id,
            organization_id=default_org.id,
            input_type="text",
            raw_input=request.text[:500],
            trust_score=nlp_results["trust_score"],
            sentiment=nlp_results["sentiment"],
            credibility=nlp_results["credibility"],
            emotional_stability=nlp_results["emotional_stability"],
            linguistic_neutrality=nlp_results["linguistic_neutrality"],
            content_reliability=nlp_results["content_reliability"],
            fake_news_probability=nlp_results["fake_news_probability"],
            manipulation_score=nlp_results["manipulation_score"],
            dominant_emotion=nlp_results["dominant_emotion"],
            risk_level=nlp_results["risk_level"],
            emotions_json=nlp_results["emotions_json"],
            signals_json=nlp_results["signals_json"],
            summary=nlp_results["summary"],
            aggression_score=psych_results['aggression_score'],
            deception_score=psych_results['deception_score'],
            cognitive_bias_score=psych_results['cognitive_bias_score'],
            persuasion_score=psych_results['persuasion_score'],
            psychological_json=psych_results,
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        # Increment usage if authenticated and not admin
        if current_user.role != 'admin' and authorization:
            increment_usage(current_user.id, db)
            _, remaining, limit = check_rate_limit(current_user, db)
        else:
            remaining = 'unlimited'
            limit = 'unlimited'

        preview = request.text[:120] + "..." if len(request.text) > 120 else request.text
        return {
            'id': analysis.id,
            'trust_score': nlp_results["trust_score"],
            'sentiment': nlp_results["sentiment"],
            'credibility': nlp_results["credibility"],
            'emotional_stability': nlp_results["emotional_stability"],
            'linguistic_neutrality': nlp_results["linguistic_neutrality"],
            'content_reliability': nlp_results["content_reliability"],
            'fake_news_probability': nlp_results["fake_news_probability"],
            'manipulation_score': nlp_results["manipulation_score"],
            'dominant_emotion': nlp_results["dominant_emotion"],
            'risk_level': nlp_results["risk_level"],
            'emotions': nlp_results.get("emotions_json") or {},
            'signals': nlp_results.get("signals_json") or [],
            'summary': nlp_results.get("summary") or "",
            'psychological': {
                'aggression_score': psych_results['aggression_score'],
                'deception_score': psych_results['deception_score'],
                'cognitive_bias_score': psych_results['cognitive_bias_score'],
                'persuasion_score': psych_results['persuasion_score'],
            },
            'usage': {
                'used': get_today_usage(current_user.id, db).analysis_count,
                'limit': limit,
                'remaining': remaining,
            },
            'created_at': analysis.created_at.isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed")


@router.post("/import-social", response_model=dict)
def import_social_media(
    request: SocialMediaImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_supabase_user),
):
    """
    Import content from social media and analyze
    Supports: Facebook, Instagram, Twitter, Telegram, WhatsApp, TikTok, YouTube, Reddit, LinkedIn
    """
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Login required for social media import")

        # Check rate limit
        if current_user.role != 'admin':
            can_analyze, remaining, limit = check_rate_limit(current_user, db)
            if not can_analyze:
                raise HTTPException(status_code=429, detail=f"Daily limit ({limit}) reached.")

        # Import from social media
        imported = SocialMediaImporter.import_content(
            source=request.source,
            content=request.content,
            url=request.url,
            metadata=request.metadata
        )

        # Analyze
        nlp_results = analyze_text(imported['parsed_content'])
        psych_results = PsychologicalAnalyzer.analyze(imported['parsed_content'])

        # Store
        analysis = Analysis(
            user_id=current_user.id,
            input_type=f"social_{request.source}",
            raw_input=imported['parsed_content'][:500],
            trust_score=nlp_results["trust_score"],
            sentiment=nlp_results["sentiment"],
            credibility=nlp_results["credibility"],
            emotional_stability=nlp_results["emotional_stability"],
            linguistic_neutrality=nlp_results["linguistic_neutrality"],
            content_reliability=nlp_results["content_reliability"],
            fake_news_probability=nlp_results["fake_news_probability"],
            manipulation_score=nlp_results["manipulation_score"],
            dominant_emotion=nlp_results["dominant_emotion"],
            risk_level=nlp_results["risk_level"],
            emotions_json=nlp_results["emotions_json"],
            signals_json=nlp_results["signals_json"],
            summary=nlp_results["summary"],
            aggression_score=psych_results['aggression_score'],
            deception_score=psych_results['deception_score'],
            cognitive_bias_score=psych_results['cognitive_bias_score'],
            persuasion_score=psych_results['persuasion_score'],
            psychological_json=psych_results,
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        # Increment usage
        if current_user.role != 'admin':
            increment_usage(current_user.id, db)

        return {
            'analysis_id': analysis.id,
            'source': imported['platform'],
            'metadata': imported['metadata'],
            'psychological_results': psych_results,
            'usage': {
                'used': get_today_usage(current_user.id, db).analysis_count,
                'limit': DAILY_LIMITS.get(current_user.subscription_tier, 3),
            }
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        print("SOCIAL IMPORT ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.get("/analysis-history", response_model=List[dict])
def get_history(
    skip: int = 0,
    limit: int = 50,
    risk_level: Optional[str] = None,
    min_trust_score: Optional[float] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_supabase_user)
):
    """Get analysis history with optional filters: risk_level, min_trust_score, from_date, to_date (YYYY-MM-DD)."""
    try:

        q = db.query(Analysis).filter(Analysis.user_id == current_user.id)
        if risk_level:
            q = q.filter(Analysis.risk_level == risk_level.upper())
        if min_trust_score is not None:
            q = q.filter(Analysis.trust_score >= min_trust_score)
        if from_date:
            try:
                q = q.filter(Analysis.created_at >= datetime.fromisoformat(from_date + "T00:00:00"))
            except ValueError:
                pass
        if to_date:
            try:
                q = q.filter(Analysis.created_at <= datetime.fromisoformat(to_date + "T23:59:59"))
            except ValueError:
                pass

        analyses = q.order_by(Analysis.created_at.desc()).offset(skip).limit(limit).all()

        return [
            {
                'id': a.id,
                'input_type': a.input_type,
                'raw_input': (a.raw_input or "")[:200],
                'trust_score': a.trust_score,
                'sentiment': a.sentiment,
                'fake_news_probability': a.fake_news_probability or 0,
                'dominant_emotion': a.dominant_emotion,
                'risk_level': a.risk_level,
                'created_at': a.created_at.isoformat(),
            }
            for a in analyses
        ]

    except HTTPException:
        raise
    except Exception as e:
        print("HISTORY ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")


@router.get("/export/history", response_class=StreamingResponse)
def export_history_csv(
    risk_level: Optional[str] = None,
    min_trust_score: Optional[float] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Export filtered analysis history as CSV. Auth required."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    q = db.query(Analysis).filter(Analysis.user_id == current_user.id)
    if risk_level:
        q = q.filter(Analysis.risk_level == risk_level.upper())
    if min_trust_score is not None:
        q = q.filter(Analysis.trust_score >= min_trust_score)
    if from_date:
        try:
            q = q.filter(Analysis.created_at >= datetime.fromisoformat(from_date + "T00:00:00"))
        except ValueError:
            pass
    if to_date:
        try:
            q = q.filter(Analysis.created_at <= datetime.fromisoformat(to_date + "T23:59:59"))
        except ValueError:
            pass
    analyses = q.order_by(Analysis.created_at.desc()).limit(5000).all()

    def gen():
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(["id", "input_type", "raw_input", "trust_score", "sentiment", "fake_news_probability", "dominant_emotion", "risk_level", "created_at"])
        for a in analyses:
            w.writerow([
                a.id, a.input_type, (a.raw_input or "")[:500], a.trust_score, a.sentiment,
                a.fake_news_probability or 0, a.dominant_emotion or "", a.risk_level or "",
                a.created_at.isoformat() if a.created_at else "",
            ])
            yield buf.getvalue()
            buf.seek(0)
            buf.truncate(0)

    return StreamingResponse(
        gen(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=trust-sense-history.csv"},
    )


@router.post("/analyze-text-batch", response_model=dict)
def analyze_text_batch(
    request: BatchTextAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Analyze up to 10 texts in one request. Subject to rate limits."""
    if len(request.texts) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 texts per batch")
    for t in request.texts:
        if len(t) > 10000:
            raise HTTPException(status_code=400, detail="Each text max 10,000 chars")
    if not current_user:
        guest = db.query(User).filter(User.id == 1).first()
        if not guest:
            from app.core.security import get_password_hash
            guest = User(id=1, email="guest@trustsense.local", username="guest",
                        password_hash=get_password_hash("guest"), role="viewer", subscription_tier="free")
            db.add(guest)
            db.commit()
        current_user = guest
    if current_user.role != "admin":
        can_analyze, remaining, limit = check_rate_limit(current_user, db)
        if not can_analyze or remaining < len(request.texts):
            raise HTTPException(status_code=429, detail="Daily limit or insufficient remaining for batch.")
    results = []
    for text in request.texts:
        if not text.strip():
            continue
        nlp_results = analyze_text(text)
        psych_results = PsychologicalAnalyzer.analyze(text)
        analysis = Analysis(
            user_id=current_user.id,
            input_type="text",
            raw_input=text[:500],
            trust_score=nlp_results["trust_score"],
            sentiment=nlp_results["sentiment"],
            credibility=nlp_results["credibility"],
            emotional_stability=nlp_results["emotional_stability"],
            linguistic_neutrality=nlp_results["linguistic_neutrality"],
            content_reliability=nlp_results["content_reliability"],
            fake_news_probability=nlp_results["fake_news_probability"],
            manipulation_score=nlp_results["manipulation_score"],
            dominant_emotion=nlp_results["dominant_emotion"],
            risk_level=nlp_results["risk_level"],
            emotions_json=nlp_results["emotions_json"],
            signals_json=nlp_results["signals_json"],
            summary=nlp_results["summary"],
            aggression_score=psych_results["aggression_score"],
            deception_score=psych_results["deception_score"],
            cognitive_bias_score=psych_results["cognitive_bias_score"],
            persuasion_score=psych_results["persuasion_score"],
            psychological_json=psych_results,
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        results.append({
            "id": analysis.id,
            "trust_score": nlp_results["trust_score"],
            "sentiment": nlp_results["sentiment"],
            "risk_level": nlp_results["risk_level"],
            "dominant_emotion": nlp_results["dominant_emotion"],
        })
    if current_user.role != "admin":
        for _ in request.texts:
            increment_usage(current_user.id, db)
    return {"status": "success", "count": len(results), "results": results}


# ============ POWER BI ENDPOINTS ============

@router.get("/powerbi/data")
def get_powerbi_data(
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db),
):
    """
    Power BI Data Endpoint - Returns all analyses in JSON format
    AUTHENTICATION: None required (for Power BI connectivity)
    
    Usage in Power BI Desktop:
    1. Home → Get Data → Web
    2. URL: http://localhost:8000/analysis/powerbi/data
    3. Load the data
    
    Returns: Array of analysis records ready for Power BI
    """
    try:
        analyses = db.query(Analysis).offset(skip).limit(limit).all()
        
        data = []
        for analysis in analyses:
            data.append({
                "id": str(analysis.id),
                "user_id": str(analysis.user_id) if analysis.user_id else None,
                "content": (analysis.raw_input or "")[:2000],
                "trust_score": float(analysis.trust_score) if analysis.trust_score is not None else None,
                "credibility_score": float(analysis.credibility) if analysis.credibility is not None else None,
                "sentiment_score": float(analysis.sentiment) if analysis.sentiment is not None else None,
                "sentiment_label": "positive" if (analysis.sentiment or 0) >= 0.3 else ("negative" if (analysis.sentiment or 0) <= -0.3 else "neutral"),
                "dominant_emotion": analysis.dominant_emotion,
                "risk_level": analysis.risk_level,
                "source_platform": analysis.source_platform,
                "source_id": analysis.source_id,
                "analysis_type": analysis.analysis_type or "general",
                "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
                "updated_at": analysis.created_at.isoformat() if analysis.created_at else None,
            })
        
        return {
            "status": "success",
            "total_records": len(analyses),
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching Power BI data: {str(e)}")


@router.get("/powerbi/summary")
def get_powerbi_summary(db: Session = Depends(get_db)):
    """
    Power BI Summary Dashboard - Aggregated metrics
    
    Returns: Summary stats for executive dashboards
    """
    try:
        analyses = db.query(Analysis).all()
        
        if not analyses:
            return {
                "total_analyses": 0,
                "avg_trust_score": 0,
                "high_risk_count": 0,
                "emotions": {},
                "platforms": {},
                "risk_distribution": {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
            }
        
        # Calculate aggregates
        avg_trust = sum(a.trust_score for a in analyses if a.trust_score) / len([a for a in analyses if a.trust_score]) if any(a.trust_score for a in analyses) else 0
        
        # Risk level counts
        risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        for a in analyses:
            r = (a.risk_level or "MEDIUM").upper()
            if r in risk_dist:
                risk_dist[r] = risk_dist.get(r, 0) + 1
        
        # Emotion counts
        emotions = {}
        for analysis in analyses:
            if analysis.dominant_emotion:
                emotions[analysis.dominant_emotion] = emotions.get(analysis.dominant_emotion, 0) + 1
        
        # Platform counts
        platforms = {}
        for analysis in analyses:
            if analysis.source_platform:
                platforms[analysis.source_platform] = platforms.get(analysis.source_platform, 0) + 1
        
        return {
            "total_analyses": len(analyses),
            "avg_trust_score": round(float(avg_trust), 2),
            "high_risk_count": risk_dist.get("HIGH", 0) + risk_dist.get("CRITICAL", 0),
            "emotions": emotions,
            "platforms": platforms,
            "risk_distribution": risk_dist
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching Power BI summary: {str(e)}")
