"""RSS feed collection utilities."""

from typing import List, Dict, Optional
import datetime

try:
    import feedparser
except ImportError:  # pragma: no cover
    feedparser = None


DEFAULT_RSS_SOURCES = [
    "http://feeds.bbci.co.uk/news/rss.xml",
    "http://feeds.bbci.co.uk/news/world/rss.xml",
    "https://www.aljazeera.com/xml/rss/all.xml",
    "http://rss.cnn.com/rss/edition.rss",
]


def fetch_rss_feed(url: str, max_items: int = 20) -> List[Dict]:
    """Fetch articles from a single RSS feed."""
    if feedparser is None:
        raise ImportError("feedparser is required for RSS collection. Install with `pip install feedparser`.")

    feed = feedparser.parse(url)
    articles = []

    for entry in feed.entries[:max_items]:
        published = None
        if hasattr(entry, "published"):
            published = entry.published
        elif hasattr(entry, "updated"):
            published = entry.updated

        articles.append({
            "title": entry.get("title", "") or "",
            "content": entry.get("summary", "") or entry.get("description", ""),
            "source": feed.feed.get("title", url),
            "language": entry.get("language") or feed.feed.get("language") or "en",
            "published_at": published,
            "link": entry.get("link", ""),
        })

    return articles


def fetch_rss_feeds(sources: Optional[List[str]] = None, max_items: int = 20) -> List[Dict]:
    """Fetch articles from multiple RSS feeds."""
    sources = sources or DEFAULT_RSS_SOURCES
    all_articles = []
    for site in sources:
        try:
            all_articles.extend(fetch_rss_feed(site, max_items=max_items))
        except Exception:
            # Be resilient to one feed failing
            continue
    return all_articles
