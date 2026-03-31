"""
Google Trends Integration Service
Fetches trending topics and provides insights for dashboard analysis
"""
import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import json
import logging

logger = logging.getLogger(__name__)

class GoogleTrendsService:
    """
    Google Trends data provider for Trust Sense Dashboard
    Supports both PyTrends integration and mock data fallback
    """
    
    def __init__(self):
        """Initialize Google Trends service"""
        self.trends_cache = {}
        self.cache_ttl = 3600  # 1 hour
        try:
            from pytrends.request import TrendReq
            self.pytrends = TrendReq(hl='en-US', tz=360)
            self.pytrends_available = True
            logger.info("✓ PyTrends available")
        except ImportError:
            self.pytrends = None
            self.pytrends_available = False
            logger.warning("⚠ PyTrends not installed (pip install pytrends). Using mock data.")
    
    def get_daily_trends(self, country: str = "US") -> Dict:
        """
        Get Google Trending Searches for today
        
        Args:
            country: Country code (US, GB, IN, etc.)
        
        Returns:
            Dictionary with trending topics and data
        """
        try:
            if self.pytrends_available:
                return self._get_real_trends(country)
            else:
                return self._get_mock_trends()
        except Exception as e:
            logger.error(f"Error fetching trends: {str(e)}")
            return self._get_mock_trends()
    
    def _get_real_trends(self, country: str) -> Dict:
        """Fetch real data from Google Trends using PyTrends"""
        try:
            # Get trending searches
            trending_searches = self.pytrends.trending_searches(pn=country)
            
            trends_list = []
            if trending_searches is not None:
                for idx, search in enumerate(trending_searches[0][:10], 1):
                    trends_list.append({
                        "rank": idx,
                        "query": search,
                        "volume": 1000 - (idx * 50),  # Mock volume
                        "growth": min(100, 50 + (idx * 5)),
                        "category": self._categorize_trend(search),
                        "trust_score": self._evaluate_trust(search)
                    })
            
            # Get trending topics
            year_month = datetime.now().strftime("%Y-%m")
            try:
                top_topics = self.pytrends.top_charts(pn=country, date=year_month)
                topics_list = top_topics.head(10)[['title', 'exploreLink']].to_dict('records') if top_topics is not None else []
            except:
                topics_list = []
            
            return {
                "status": "success",
                "source": "google_trends_api",
                "timestamp": datetime.now().isoformat(),
                "country": country,
                "trends": trends_list,
                "topics": topics_list,
                "total_trends": len(trends_list)
            }
        except Exception as e:
            logger.error(f"PyTrends error: {str(e)}")
            return self._get_mock_trends()
    
    def _get_mock_trends(self) -> Dict:
        """Return mock trending data for development"""
        return {
            "status": "success",
            "source": "mock_data",
            "timestamp": datetime.now().isoformat(),
            "country": "US",
            "trends": [
                {
                    "rank": 1,
                    "query": "AI ethics concerns",
                    "volume": 950000,
                    "growth": 125,
                    "category": "technology",
                    "trust_score": 72
                },
                {
                    "rank": 2,
                    "query": "misinformation detection",
                    "volume": 850000,
                    "growth": 110,
                    "category": "news",
                    "trust_score": 68
                },
                {
                    "rank": 3,
                    "query": "deepfake technology",
                    "volume": 750000,
                    "growth": 95,
                    "category": "security",
                    "trust_score": 55
                },
                {
                    "rank": 4,
                    "query": "social media authentication",
                    "volume": 650000,
                    "growth": 85,
                    "category": "technology",
                    "trust_score": 78
                },
                {
                    "rank": 5,
                    "query": "fake news awareness",
                    "volume": 550000,
                    "growth": 75,
                    "category": "news",
                    "trust_score": 82
                },
                {
                    "rank": 6,
                    "query": "credential verification",
                    "volume": 450000,
                    "growth": 65,
                    "category": "security",
                    "trust_score": 88
                },
                {
                    "rank": 7,
                    "query": "sentiment analysis AI",
                    "volume": 350000,
                    "growth": 55,
                    "category": "ai",
                    "trust_score": 75
                },
                {
                    "rank": 8,
                    "query": "cyber security threats",
                    "volume": 300000,
                    "growth": 45,
                    "category": "security",
                    "trust_score": 70
                },
                {
                    "rank": 9,
                    "query": "online trust metrics",
                    "volume": 250000,
                    "growth": 35,
                    "category": "technology",
                    "trust_score": 81
                },
                {
                    "rank": 10,
                    "query": "digital literacy",
                    "volume": 200000,
                    "growth": 25,
                    "category": "education",
                    "trust_score": 79
                }
            ],
            "topics": [
                {"title": "AI Ethics", "exploreLink": "/explore/TRENDING_STORIES"},
                {"title": "Misinformation", "exploreLink": "/explore/TRENDING_STORIES"},
                {"title": "Cybersecurity", "exploreLink": "/explore/TRENDING_STORIES"}
            ],
            "total_trends": 10
        }
    
    def get_search_interest(self, query: str, days: int = 7) -> Dict:
        """
        Get search interest over time for a specific query
        
        Args:
            query: Search query
            days: Number of days to look back
        
        Returns:
            Time series data for the query
        """
        try:
            if not self.pytrends_available:
                return self._get_mock_search_interest(query, days)
            
            # Build payload
            self.pytrends.build_payload([query], timeframe=f'today {days}d')
            
            # Get interest over time
            interest_data = self.pytrends.interest_over_time()
            
            if interest_data.empty:
                return self._get_mock_search_interest(query, days)
            
            data_points = []
            for date, row in interest_data.iterrows():
                data_points.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "interest": int(row[query]),
                    "timestamp": date.isoformat()
                })
            
            return {
                "status": "success",
                "query": query,
                "data": data_points,
                "max_interest": interest_data[query].max(),
                "avg_interest": int(interest_data[query].mean())
            }
        except Exception as e:
            logger.error(f"Search interest error: {str(e)}")
            return self._get_mock_search_interest(query, days)
    
    def _get_mock_search_interest(self, query: str, days: int) -> Dict:
        """Mock search interest data"""
        data_points = []
        base_interest = 50
        
        for i in range(days):
            date = datetime.now() - timedelta(days=days-i)
            # Add some variation
            interest = max(10, int(base_interest + (i % 3) * 20 - 20))
            data_points.append({
                "date": date.strftime("%Y-%m-%d"),
                "interest": interest,
                "timestamp": date.isoformat()
            })
        
        return {
            "status": "success",
            "query": query,
            "data": data_points,
            "max_interest": max(d["interest"] for d in data_points),
            "avg_interest": int(sum(d["interest"] for d in data_points) / len(data_points))
        }
    
    def get_related_queries(self, query: str) -> Dict:
        """
        Get related search queries
        
        Args:
            query: Base search query
        
        Returns:
            Related queries and their metrics
        """
        try:
            if not self.pytrends_available:
                return self._get_mock_related_queries(query)
            
            self.pytrends.build_payload([query])
            related = self.pytrends.related_queries()
            
            return {
                "status": "success",
                "query": query,
                "related_queries": related.get(query, {}).get("queries", [])
                if related and isinstance(related, dict) else [],
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Related queries error: {str(e)}")
            return self._get_mock_related_queries(query)
    
    def _get_mock_related_queries(self, query: str) -> Dict:
        """Mock related queries"""
        return {
            "status": "success",
            "query": query,
            "related_queries": [
                {"query": f"{query} detection", "value": 95},
                {"query": f"{query} prevention", "value": 87},
                {"query": f"{query} tools", "value": 72},
                {"query": f"how to identify {query}", "value": 68},
                {"query": f"{query} examples", "value": 55}
            ],
            "timestamp": datetime.now().isoformat()
        }
    
    def _categorize_trend(self, query: str) -> str:
        """Categorize a trend based on keywords"""
        query_lower = query.lower()
        
        categories = {
            "ai": ["ai", "artificial intelligence", "machine learning", "neural"],
            "security": ["security", "hack", "scam", "phishing", "threat", "deepfake"],
            "news": ["news", "breaking", "alert", "announcement"],
            "technology": ["tech", "software", "app", "digital", "online"],
            "misinformation": ["fake", "hoax", "misinformation", "disinformation", "false"],
            "social": ["social", "twitter", "facebook", "instagram", "tiktok"],
            "education": ["learn", "course", "tutorial", "guide"]
        }
        
        for category, keywords in categories.items():
            if any(keyword in query_lower for keyword in keywords):
                return category
        
        return "general"
    
    def _evaluate_trust(self, query: str) -> float:
        """Evaluate trust score for a trend (0-100)"""
        query_lower = query.lower()
        
        # Higher trust for educational/security/verification topics
        high_trust_keywords = ["verification", "authentication", "security", "awareness", "education", "detection"]
        low_trust_keywords = ["fake", "hoax", "scam", "misinformation", "deepfake"]
        
        score = 50  # Baseline
        
        for keyword in high_trust_keywords:
            if keyword in query_lower:
                score += 15
        
        for keyword in low_trust_keywords:
            if keyword in query_lower:
                score -= 10
        
        return min(100, max(0, score))
    
    def get_dashboard_data(self) -> Dict:
        """
        Get comprehensive trending data for dashboard
        Combines multiple data sources
        """
        daily_trends = self.get_daily_trends()
        
        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "daily_trends": daily_trends,
            "summary": {
                "total_tracked_trends": daily_trends.get("total_trends", 0),
                "top_trend": daily_trends["trends"][0] if daily_trends.get("trends") else None,
                "avg_trust_score": sum(t["trust_score"] for t in daily_trends.get("trends", [])) / len(daily_trends.get("trends", [1])),
                "categories": self._get_category_summary(daily_trends.get("trends", []))
            }
        }
    
    def _get_category_summary(self, trends: List[Dict]) -> Dict:
        """Summarize trends by category"""
        categories = {}
        for trend in trends:
            category = trend.get("category", "general")
            if category not in categories:
                categories[category] = 0
            categories[category] += 1
        return categories


# Global instance
google_trends_service = GoogleTrendsService()
