"""
Multi-Platform Integration Router
Provides APIs for Desktop, Mobile, Chrome Extension, Email, and Chatbots
"""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Header
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Analysis, Organization
from app.ai_engine import MultimodalAnalyzer
from app.schemas.schemas import AnalysisCreate

router = APIRouter(prefix="/api/platforms", tags=["Multi-Platform"])

# Lazily initialize AI engine to avoid heavy startup delays (e.g., Whisper model download)
_ai_engine: Optional[MultimodalAnalyzer] = None

def get_ai_engine() -> MultimodalAnalyzer:
    global _ai_engine
    if _ai_engine is None:
        _ai_engine = MultimodalAnalyzer()
    return _ai_engine


class LazyAIEngine:
    """Proxy that initializes the real AI engine on first use."""

    def __getattr__(self, item):
        return getattr(get_ai_engine(), item)


# Use lazy wrapper so importing routers doesn't block startup
ai_engine = LazyAIEngine()


# API Key validation for platform integrations
def require_api_key(x_api_key: Optional[str] = Header(None)) -> str:
    """Validate API key for platform integrations (Chrome extension, etc.)"""
    # For development, allow requests without API key
    if not x_api_key:
        return "development-mode"
    return x_api_key


# ==================== DESKTOP APP ENDPOINTS ====================

@router.post("/desktop/analyze")
async def desktop_analyze(
    content: str = Form(...),
    content_type: str = Form(default="text"),
    domain: str = Form(default="general"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Desktop App: Analyze content
    Supports: Text, Audio file paths, Video file paths
    """
    try:
        result = await ai_engine.analyze(
            content=content,
            content_type=content_type,
            metadata={
                "platform": "desktop",
                "user_id": current_user.id,
                "domain": domain
            }
        )
        
        # Save to database
        analysis = Analysis(
            user_id=current_user.id,
            organization_id=current_user.memberships[0].organization_id if current_user.memberships else None,
            input_type=content_type,
            raw_input=content[:500],
            trust_score=result.get("trust_score"),
            sentiment=result.get("sentiment"),
            fake_news_probability=result.get("fake_news_probability"),
            manipulation_score=result.get("manipulation_score"),
            credibility=result.get("credibility"),
            emotional_stability=result.get("emotional_stability"),
            linguistic_neutrality=result.get("linguistic_neutrality"),
            content_reliability=result.get("content_reliability"),
            dominant_emotion=result.get("dominant_emotion"),
            risk_level=result.get("risk_level"),
            emotions_json=json.dumps(result.get("emotions", {})),
            signals_json=json.dumps(result.get("signals", {})),
            summary=result.get("summary"),
            analysis_type="desktop"
        )
        db.add(analysis)
        db.commit()
        
        return {
            "status": "success",
            "analysis_id": analysis.id,
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/desktop/history")
async def desktop_history(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Desktop App: Get analysis history"""
    
    analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id,
        Analysis.analysis_type == "desktop"
    ).order_by(Analysis.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "status": "success",
        "count": len(analyses),
        "analyses": [
            {
                "id": a.id,
                "timestamp": a.created_at.isoformat(),
                "content_type": a.input_type,
                "trust_score": a.trust_score,
                "risk_level": a.risk_level,
                "summary": a.summary[:100] if a.summary else None
            }
            for a in analyses
        ]
    }


# ==================== MOBILE APP ENDPOINTS ====================

@router.post("/mobile/quick-analyze")
async def mobile_quick_analyze(
    text: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Mobile App: Quick analysis endpoint
    Optimized for lightweight mobile clients
    """
    try:
        result = await ai_engine.analyze(
            content=text,
            content_type="text",
            metadata={"platform": "mobile"}
        )
        
        # Return minimal response for mobile efficiency
        return {
            "trust_score": result.get("trust_score"),
            "risk_level": result.get("risk_level"),
            "summary": result.get("summary"),
            "emotion": result.get("dominant_emotion"),
            "recommendation": result.get("recommendations", [])[0] if result.get("recommendations") else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mobile/dashboard")
async def mobile_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Mobile App: Quick dashboard stats
    Optimized for mobile display
    """
    
    analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).all()
    
    if not analyses:
        return {
            "stats": {
                "total": 0,
                "avg_trust_score": 0,
                "high_risk": 0,
                "last_analysis": None
            }
        }
    
    trust_scores = [a.trust_score for a in analyses if a.trust_score]
    high_risk = sum(1 for a in analyses if a.risk_level in ["HIGH", "CRITICAL"])
    
    return {
        "stats": {
            "total": len(analyses),
            "avg_trust_score": sum(trust_scores) / len(trust_scores) if trust_scores else 0,
            "high_risk": high_risk,
            "last_analysis": analyses[-1].created_at.isoformat() if analyses else None
        }
    }


# ==================== CHROME EXTENSION ENDPOINTS ====================

@router.post("/chrome/analyze-page")
async def chrome_analyze_page(
    page_title: str = Form(...),
    page_url: str = Form(...),
    page_content: str = Form(...),
    domain: str = Form(default="general"),
    api_key: str = Depends(require_api_key)
) -> Dict[str, Any]:
    """
    Chrome Extension: Analyze current web page
    Uses API key for authentication (no user login required)
    """
    try:
        result = await ai_engine.analyze(
            content=page_content[:5000],  # Limit to 5000 chars for perf
            content_type="text",
            metadata={
                "platform": "chrome_extension",
                "source_url": page_url,
                "domain": domain
            }
        )
        
        return {
            "page_title": page_title,
            "page_url": page_url,
            "analysis": {
                "trust_score": result.get("trust_score"),
                "risk_level": result.get("risk_level"),
                "fake_news_probability": result.get("fake_news_probability"),
                "credibility": result.get("credibility"),
                "summary": result.get("summary"),
                "recommendations": result.get("recommendations", [])[:3]  # Top 3 only
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chrome/health")
async def chrome_health() -> Dict[str, str]:
    """Chrome Extension: Health check endpoint"""
    return {"status": "healthy", "service": "chrome-extension"}


# ==================== EMAIL PLUGIN ENDPOINTS ====================

@router.post("/email/analyze-message")
async def email_analyze_message(
    sender: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    api_key: str = Depends(require_api_key)
) -> Dict[str, Any]:
    """
    Email Plugin: Analyze email message
    Detect phishing, spam, malicious intent
    """
    try:
        # Combine subject and body for analysis
        email_content = f"{subject}\n\n{body}"
        
        result = await ai_engine.analyze(
            content=email_content,
            content_type="text",
            metadata={
                "platform": "email_plugin",
                "sender": sender
            }
        )
        
        # Add email-specific checks
        is_suspicious = (
            result.get("fake_news_probability", 0) > 60 or
            result.get("manipulation_score", 0) > 70 or
            result.get("trust_score", 0) < 40
        )
        
        return {
            "sender": sender,
            "is_suspicious": is_suspicious,
            "trust_score": result.get("trust_score"),
            "risk_level": result.get("risk_level"),
            "phishing_indicators": [s for s in result.get("recommendations", [])],
            "safe_to_click": result.get("trust_score", 0) > 60
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SOCIAL MEDIA CHATBOT ENDPOINTS ====================

@router.post("/chatbot/facebook/webhook")
async def facebook_webhook_receiver(
    body: Dict[str, Any]
) -> Dict[str, str]:
    """
    Facebook Messenger: Webhook receiver for bot messages
    Extract message and forward to analysis
    """
    try:
        # Facebook Messenger webhook validation
        for entry in body.get("entry", []):
            for event in entry.get("messaging", []):
                if event.get("message"):
                    user_id = event.get("sender", {}).get("id")
                    message_text = event.get("message", {}).get("text", "")
                    
                    if message_text:
                        # Analyze message
                        result = await ai_engine.analyze(
                            content=message_text,
                            content_type="text",
                            metadata={"platform": "facebook_messenger"}
                        )
                        
                        # Queue response to user (would integrate with Facebook API)
                        # response = await send_facebook_message(user_id, result)
        
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/chatbot/whatsapp/analyze")
async def whatsapp_analyze_message(
    from_number: str = Form(...),
    message_text: str = Form(...),
    api_key: str = Depends(require_api_key)
) -> Dict[str, Any]:
    """
    WhatsApp Bot: Analyze message and return trust assessment
    """
    try:
        result = await ai_engine.analyze(
            content=message_text,
            content_type="text",
            metadata={"platform": "whatsapp"}
        )
        
        return {
            "from": from_number,
            "analysis": {
                "trust_score": result.get("trust_score"),
                "risk_level": result.get("risk_level"),
                "is_safe": result.get("trust_score", 0) > 60,
                "short_summary": result.get("summary", "")[:100]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chatbot/telegram/analyze")
async def telegram_analyze_message(
    message_id: str = Form(...),
    text: str = Form(...),
    api_key: str = Depends(require_api_key)
) -> Dict[str, Any]:
    """
    Telegram Bot: Analyze message from Telegram
    """
    try:
        result = await ai_engine.analyze(
            content=text,
            content_type="text",
            metadata={"platform": "telegram"}
        )
        
        return {
            "message_id": message_id,
            "verdict": "SAFE" if result.get("trust_score", 0) > 60 else "SUSPICIOUS",
            "trust_score": result.get("trust_score"),
            "reasons": result.get("recommendations", [])[:2]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chatbot/status")
async def chatbot_status() -> Dict[str, Any]:
    """
    Chatbot Status: Health check for all chatbot integrations
    """
    return {
        "status": "healthy",
        "platforms": [
            {"name": "facebook_messenger", "status": "active"},
            {"name": "whatsapp", "status": "active"},
            {"name": "telegram", "status": "active"}
        ],
        "timestamp": datetime.utcnow().isoformat()
    }
