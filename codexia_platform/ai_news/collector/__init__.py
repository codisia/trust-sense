"""News collection helpers."""

from .rss_collector import fetch_rss_feeds
from .newsapi_collector import fetch_newsapi_articles
from ..utils.cleaner import clean_articles
from ..utils.deduplicate import deduplicate_articles
from typing import List, Dict, Optional


def fetch_news(sources: List[str] = None, rss_sources: List[str] = None, 
               newsapi_categories: List[str] = None, max_items: int = 20) -> List[Dict]:
    """Fetch news from multiple sources (RSS and NewsAPI).
    
    Args:
        sources: List of source types ('rss', 'newsapi')
        rss_sources: List of RSS feed URLs
        newsapi_categories: List of NewsAPI categories
        max_items: Maximum items per source
        
    Returns:
        List of news articles
    """
    articles = []
    
    if not sources:
        sources = ['rss', 'newsapi']
    
    if 'rss' in sources:
        rss_articles = fetch_rss_feeds(rss_sources, max_items)
        articles.extend(rss_articles)
    
    if 'newsapi' in sources:
        if newsapi_categories:
            for category in newsapi_categories:
                newsapi_articles = fetch_newsapi_articles(category, max_items)
                articles.extend(newsapi_articles)
    
    # Clean and deduplicate
    articles = clean_articles(articles)
    articles = deduplicate_articles(articles)
    
    return articles


__all__ = [
    "fetch_news",
    "fetch_rss_feeds",
    "fetch_newsapi_articles",
    "clean_articles",
    "deduplicate_articles"
]
