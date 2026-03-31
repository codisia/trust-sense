"""Power BI integration routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.models import User, Analysis
from app.services.powerbi_service import (
    PowerBIClient,
    sync_analysis_to_powerbi,
    sync_all_analyses_to_powerbi,
    create_powerbi_dataset_template,
)

router = APIRouter()


@router.get("/power-bi/status", tags=["Power BI"])
def get_powerbi_status(admin: User = Depends(require_admin)):
    """Get Power BI integration status (admin only)."""
    client = PowerBIClient()
    is_configured = client.is_configured()
    
    return {
        "configured": is_configured,
        "dataset_id": "***" if is_configured else None,
        "status": "ready" if is_configured else "not_configured",
        "message": "Power BI is configured and ready" if is_configured else "Power BI credentials not set in .env"
    }


@router.get("/power-bi/schema", tags=["Power BI"])
def get_powerbi_schema(_: User = Depends(require_admin)):
    """Get Power BI dataset schema template (admin only)."""
    return create_powerbi_dataset_template()


@router.post("/power-bi/sync/{analysis_id}", tags=["Power BI"])
def sync_single_to_powerbi(
    analysis_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Sync a single analysis to Power BI (admin only)."""
    result = sync_analysis_to_powerbi(analysis_id, db)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/power-bi/sync-all", tags=["Power BI"])
def sync_all_to_powerbi(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Sync all unsynced analyses to Power BI (admin only)."""
    result = sync_all_analyses_to_powerbi(db)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/power-bi/sync/recent", tags=["Power BI"])
def sync_recent_to_powerbi(
    hours: int = 24,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Sync analyses from the last N hours to Power BI (admin only)."""
    from datetime import datetime, timedelta
    
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    recent_analyses = db.query(Analysis).filter(
        Analysis.created_at >= cutoff_time,
        Analysis.powerbi_synced == 0
    ).all()
    
    if not recent_analyses:
        return {"message": f"No unsynced analyses from last {hours} hours", "synced_count": 0}
    
    client = PowerBIClient()
    
    analyses_data = []
    for analysis in recent_analyses:
        data = {
            "id": analysis.id,
            "user_id": analysis.user_id,
            "input_type": analysis.input_type,
            "trust_score": analysis.trust_score,
            "sentiment": analysis.sentiment,
            "credibility": analysis.credibility,
            "fake_news_probability": analysis.fake_news_probability,
            "manipulation_score": analysis.manipulation_score,
            "risk_level": analysis.risk_level,
            "dominant_emotion": analysis.dominant_emotion,
            "voice_emotion": analysis.voice_emotion,
            "deepfake_probability": analysis.deepfake_probability,
            "summary": analysis.summary,
        }
        analyses_data.append(data)
    
    result = client.push_batch_analysis(analyses_data)
    
    if result.get("success"):
        for analysis in recent_analyses:
            analysis.powerbi_synced = 1
        db.commit()
        return {"success": True, "synced_count": len(recent_analyses)}
    
    return result


@router.get("/power-bi/dataset-info", tags=["Power BI"])
def get_dataset_info(admin: User = Depends(require_admin)):
    """Get Power BI dataset information (admin only)."""
    client = PowerBIClient()
    return client.get_dataset_info()


@router.post("/power-bi/sync-on-analysis/{analysis_id}", tags=["Power BI"])
def auto_sync_on_new_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
):
    """Auto-sync analysis to Power BI after creation."""
    client = PowerBIClient()
    
    if not client.is_configured():
        # Silently fail if Power BI not configured
        return {"success": False, "reason": "power_bi_not_configured"}
    
    result = sync_analysis_to_powerbi(analysis_id, db)
    return result


@router.get("/power-bi/sync-stats", tags=["Power BI"])
def get_sync_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get Power BI sync statistics (admin only)."""
    total = db.query(Analysis).count()
    synced = db.query(Analysis).filter(Analysis.powerbi_synced == 1).count()
    unsynced = total - synced
    
    return {
        "total_analyses": total,
        "synced": synced,
        "unsynced": unsynced,
        "sync_percentage": round((synced / total * 100) if total > 0 else 0, 2)
    }
