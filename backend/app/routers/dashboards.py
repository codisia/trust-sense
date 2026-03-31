"""
Dashboard Router - Analytics and Reporting APIs
Provides aggregated data for dashboards, reports, and exports
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
import csv
from io import StringIO

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Analysis, Organization

router = APIRouter(prefix="/api/dashboards", tags=["Dashboards & Reports"])


@router.get("/personal")
async def personal_dashboard(
    period: str = Query("month", enum=["week", "month", "quarter", "year"]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get personal dashboard with key metrics
    
    Returns:
    - Analysis count (current period)
    - Average trust score
    - Risk distribution
    - Trend data
    """
    
    # Calculate date range
    now = datetime.utcnow()
    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "quarter":
        start_date = now - timedelta(days=90)
    else:  # year
        start_date = now - timedelta(days=365)
    
    # Get analyses for period
    analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id,
        Analysis.created_at >= start_date
    ).all()
    
    # Calculate metrics
    total_analyses = len(analyses)
    trust_scores = [a.trust_score for a in analyses if a.trust_score]
    avg_trust_score = sum(trust_scores) / len(trust_scores) if trust_scores else 0
    
    # Risk distribution
    risk_dist = {
        "LOW": sum(1 for a in analyses if a.risk_level == "LOW"),
        "MEDIUM": sum(1 for a in analyses if a.risk_level == "MEDIUM"),
        "HIGH": sum(1 for a in analyses if a.risk_level == "HIGH"),
        "CRITICAL": sum(1 for a in analyses if a.risk_level == "CRITICAL"),
    }
    
    # Trend data (daily)
    daily_data = {}
    for i in range(10):
        day = start_date + timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        day_count = sum(1 for a in analyses 
                       if a.created_at.date() == day.date())
        daily_data[day_str] = day_count
    
    return {
        "period": period,
        "metrics": {
            "total_analyses": total_analyses,
            "avg_trust_score": round(avg_trust_score, 2),
            "avg_manipulation_score": round(
                sum(a.manipulation_score or 0 for a in analyses) / total_analyses if total_analyses else 0,
                2
            ),
            "analyses_with_high_risk": risk_dist["HIGH"] + risk_dist["CRITICAL"]
        },
        "risk_distribution": risk_dist,
        "daily_trend": daily_data,
        "top_emotions": _get_top_emotions(analyses, 5)
    }


@router.get("/organization")
async def organization_dashboard(
    org_id: int = Query(...),
    period: str = Query("month"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get organization-wide dashboard (admin only)
    Aggregates data from all organization members
    """
    
    # Verify user is org admin
    org = db.query(Organization).filter(
        Organization.id == org_id,
        Organization.owner_id == current_user.id
    ).first()
    
    if not org:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Calculate date range
    now = datetime.utcnow()
    period_days = 30 if period == "month" else 7
    start_date = now - timedelta(days=period_days)
    
    # Get all org member analyses
    analyses = db.query(Analysis).filter(
        Analysis.organization_id == org_id,
        Analysis.created_at >= start_date
    ).all()
    
    # Member statistics
    member_stats = {}
    for member in org.members:
        member_analyses = [a for a in analyses if a.user_id == member.user_id]
        member_stats[member.user.username] = {
            "analyses_count": len(member_analyses),
            "avg_trust_score": sum(a.trust_score or 0 for a in member_analyses) / len(member_analyses) if member_analyses else 0
        }
    
    return {
        "organization": org.name,
        "period": period,
        "metrics": {
            "total_team_analyses": len(analyses),
            "avg_team_trust_score": sum(a.trust_score or 0 for a in analyses) / len(analyses) if analyses else 0,
            "team_members": len(org.members),
            "active_members": len([m for m in member_stats.values() if m["analyses_count"] > 0])
        },
        "member_statistics": member_stats,
        "domain_breakdown": _get_domain_breakdown(analyses)
    }


@router.get("/reports/pdf")
async def export_report_pdf(
    period: str = Query("month"),
    include_recommendations: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export analysis report as PDF
    Includes charts, summaries, and recommendations
    
    Note: In production, use ReportLab, WeasyPrint, or similar
    """
    
    # Placeholder: would generate actual PDF
    return {
        "status": "report_generation_queued",
        "format": "pdf",
        "email_delivery": current_user.email,
        "estimated_time": "2-3 minutes"
    }


@router.get("/reports/csv")
async def export_report_csv(
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export analyses as CSV
    Can filter by date range
    """
    
    # Parse dates if provided
    start = datetime.fromisoformat(start_date) if start_date else None
    end = datetime.fromisoformat(end_date) if end_date else datetime.utcnow()
    
    # Get analyses
    query = db.query(Analysis).filter(Analysis.user_id == current_user.id)
    if start:
        query = query.filter(Analysis.created_at >= start)
    analyses = query.filter(Analysis.created_at <= end).all()
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "ID", "Date", "Type", "Trust Score", "Risk Level",
        "Sentiment", "Manipulation Score", "Credibility",
        "Dominant Emotion", "Summary"
    ])
    
    # Rows
    for a in analyses:
        writer.writerow([
            a.id,
            a.created_at.isoformat(),
            a.input_type,
            a.trust_score,
            a.risk_level,
            a.sentiment,
            a.manipulation_score,
            a.credibility,
            a.dominant_emotion,
            a.summary[:50] if a.summary else ""
        ])
    
    # Return CSV as streaming response
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=analyses.csv"}
    )


@router.get("/analytics/trends")
async def analytics_trends(
    metric: str = Query("trust_score", enum=["trust_score", "manipulation_score", "credibility"]),
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get trend analytics for a specific metric over time
    """
    
    start_date = datetime.utcnow() - timedelta(days=days)
    analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id,
        Analysis.created_at >= start_date
    ).all()
    
    # Build daily trend
    trend_data = {}
    for i in range(days):
        day = start_date + timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        day_analyses = [a for a in analyses if a.created_at.date() == day.date()]
        
        if metric == "trust_score":
            scores = [a.trust_score for a in day_analyses if a.trust_score]
        elif metric == "manipulation_score":
            scores = [a.manipulation_score for a in day_analyses if a.manipulation_score]
        else:  # credibility
            scores = [a.credibility for a in day_analyses if a.credibility]
        
        trend_data[day_str] = {
            "avg": sum(scores) / len(scores) if scores else 0,
            "count": len(day_analyses),
            "min": min(scores) if scores else 0,
            "max": max(scores) if scores else 0
        }
    
    return {
        "metric": metric,
        "period_days": days,
        "trend": trend_data,
        "overall_avg": sum(d["avg"] for d in trend_data.values()) / len(trend_data) if trend_data else 0
    }


@router.get("/analytics/domains")
async def analytics_by_domain(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get analytics broken down by content domain
    Helps understand which types of content are analyzed most
    """
    
    analyses = db.query(Analysis).filter(Analysis.user_id == current_user.id).all()
    
    domains = {}
    for analysis in analyses:
        domain = analysis.analysis_type or "general"
        if domain not in domains:
            domains[domain] = {
                "count": 0,
                "avg_trust_score": [],
                "risk_distribution": {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
            }
        
        domains[domain]["count"] += 1
        if analysis.trust_score:
            domains[domain]["avg_trust_score"].append(analysis.trust_score)
        if analysis.risk_level:
            domains[domain]["risk_distribution"][analysis.risk_level] += 1
    
    # Calculate averages
    for domain_data in domains.values():
        if domain_data["avg_trust_score"]:
            domain_data["avg_trust_score"] = sum(domain_data["avg_trust_score"]) / len(domain_data["avg_trust_score"])
        else:
            domain_data["avg_trust_score"] = 0
    
    return {
        "domains": domains,
        "total_analyses": len(analyses)
    }


# Helper functions

def _get_top_emotions(analyses: List[Analysis], limit: int = 5) -> List[Dict[str, Any]]:
    """Extract top emotions from analyses"""
    emotions = {}
    for a in analyses:
        if a.dominant_emotion:
            emotions[a.dominant_emotion] = emotions.get(a.dominant_emotion, 0) + 1
    
    # Sort and return top
    sorted_emotions = sorted(emotions.items(), key=lambda x: x[1], reverse=True)
    return [{"emotion": e[0], "count": e[1]} for e in sorted_emotions[:limit]]


def _get_domain_breakdown(analyses: List[Analysis]) -> Dict[str, int]:
    """Get analysis count by domain"""
    domains = {}
    for a in analyses:
        domain = a.analysis_type or "general"
        domains[domain] = domains.get(domain, 0) + 1
    return domains
