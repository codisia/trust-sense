"""
Google Trends Router
Provides trending topics and insights for dashboard analysis
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime

from app.services.google_trends_service import google_trends_service

router = APIRouter()


@router.get("/trends")
def get_trending_topics(
    country: str = Query("US", description="Country code (US, GB, IN, etc.)"),
    limit: int = Query(10, description="Number of trends to return", le=50)
):
    """
    Get Google Trending Searches
    
    Returns top trending topics with trust scores and analysis
    
    Query Parameters:
    - country: Country code (default: US)
    - limit: Number of results to return (default: 10, max: 50)
    """
    try:
        data = google_trends_service.get_daily_trends(country)
        
        # Limit results
        if data.get("trends"):
            data["trends"] = data["trends"][:limit]
            data["total_trends"] = len(data["trends"])
        
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trends: {str(e)}")


@router.get("/trends/search")
def get_search_interest(
    query: str = Query(..., description="Search query"),
    days: int = Query(7, description="Days to look back", ge=1, le=365)
):
    """
    Get search interest over time for a specific query
    
    Shows how interest in a topic fluctuates over the specified period
    
    Query Parameters:
    - query: Search term (required)
    - days: Number of days to analyze (1-365, default: 7)
    """
    try:
        if not query or len(query.strip()) == 0:
            raise HTTPException(status_code=400, detail="Query parameter is required")
        
        return google_trends_service.get_search_interest(query, days)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching search interest: {str(e)}")


@router.get("/trends/related")
def get_related_trends(
    query: str = Query(..., description="Base search query")
):
    """
    Get related search queries
    
    Returns queries related to the search term that users also search for
    
    Query Parameters:
    - query: Base search term (required)
    """
    try:
        if not query or len(query.strip()) == 0:
            raise HTTPException(status_code=400, detail="Query parameter is required")
        
        return google_trends_service.get_related_queries(query)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching related queries: {str(e)}")


@router.get("/trends/dashboard")
def get_trends_dashboard():
    """
    Get comprehensive trending data for dashboard visualization
    
    Combines multiple data sources for Power BI and frontend display
    
    Returns:
    - Daily trending topics
    - Trend metadata (categories, trust scores)
    - Summary statistics
    """
    try:
        return google_trends_service.get_dashboard_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building dashboard: {str(e)}")


@router.get("/trends/analyze/{trend_query}")
def analyze_trend(
    trend_query: str = ...,
    include_related: bool = Query(True, description="Include related searches"),
    include_interest: bool = Query(True, description="Include interest over time"),
    days: int = Query(7, description="Days for interest analysis")
):
    """
    Comprehensive trend analysis
    
    Combines daily trends, interest over time, and related queries
    Useful for in-depth analysis of a specific topic
    
    Path Parameters:
    - trend_query: The trend to analyze
    
    Query Parameters:
    - include_related: Include related searches (default: true)
    - include_interest: Include interest over time (default: true)
    - days: Days to analyze for interest (default: 7)
    """
    try:
        if not trend_query or len(trend_query.strip()) == 0:
            raise HTTPException(status_code=400, detail="Trend query is required")
        
        result = {
            "status": "success",
            "query": trend_query,
            "timestamp": datetime.now().isoformat(),
            "analysis": {}
        }
        
        # Get basic trend information
        all_trends = google_trends_service.get_daily_trends()
        trend_data = next(
            (t for t in all_trends.get("trends", []) 
             if t["query"].lower() == trend_query.lower()),
            None
        )
        
        if trend_data:
            result["analysis"]["trend_info"] = trend_data
        
        # Get interest over time if requested
        if include_interest:
            result["analysis"]["interest_over_time"] = google_trends_service.get_search_interest(
                trend_query, 
                days
            )
        
        # Get related queries if requested
        if include_related:
            result["analysis"]["related_queries"] = google_trends_service.get_related_queries(trend_query)
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing trend: {str(e)}")


@router.get("/trends/health")
def trends_service_health():
    """
    Health check for Google Trends service
    
    Returns service status and data source
    """
    return {
        "status": "healthy",
        "service": "google_trends",
        "timestamp": datetime.now().isoformat(),
        "pytrends_available": google_trends_service.pytrends_available,
        "data_source": "google_trends_api" if google_trends_service.pytrends_available else "mock_data",
        "endpoints": [
            "/trends - Get trending topics",
            "/trends/search?query=... - Get interest over time",
            "/trends/related?query=... - Get related searches",
            "/trends/dashboard - Get dashboard data",
            "/trends/analyze/{query} - Comprehensive analysis"
        ]
    }
