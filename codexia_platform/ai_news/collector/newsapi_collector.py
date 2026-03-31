"""NewsAPI.org based collection helpers."""

import os
from typing import List, Dict, Optional
import requests

NEWSAPI_URL = "https://newsapi.org/v2/top-headlines"


def fetch_newsapi_articles(
    api_key: Optional[str] = None,
    query: Optional[str] = None,
    language: str = "en",
    page_size: int = 20,
    country: Optional[str] = None,
) -> List[Dict]:
    """Fetch news articles from NewsAPI.org."""
    api_key = api_key or os.getenv("NEWSAPI_KEY")
    if not api_key:
        raise ValueError("NEWSAPI_KEY environment variable not set")

    params = {
        "apiKey": api_key,
        "language": language,
        "pageSize": page_size,
    }
    if query:
        params["q"] = query
    if country:
        params["country"] = country

    resp = requests.get(NEWSAPI_URL, params=params, timeout=20)
    resp.raise_for_status()
    data = resp.json()

    if data.get("status") != "ok":
        raise RuntimeError(f"NewsAPI error: {data.get('message')}")

    articles = []
    for item in data.get("articles", []):
        articles.append({
            "title": item.get("title", ""),
            "content": item.get("content") or item.get("description") or "",
            "source": item.get("source", {}).get("name", "NewsAPI"),
            "language": language,
            "published_at": item.get("publishedAt"),
            "url": item.get("url"),
        })
    return articles
