"""AI News Broadcasting System for Codexia Platform.

Modules:
- collector: fetches news from RSS / APIs
- analyzer: runs trust analysis (fake news / bias / emotion)
- generator: creates presenter scripts and translations
- video: generates videos via HeyGen
- publisher: publishes to social platforms
- scheduler: orchestrates periodic pipeline runs
- utils: helper functions
"""

from .collector import fetch_news, clean_articles, deduplicate_articles
from .analyzer import analyze_article
from .generator import generate_script
from .video import generate_video
from .publisher import publish_video

__all__ = [
    "fetch_news",
    "clean_articles",
    "deduplicate_articles",
    "analyze_article",
    "generate_script",
    "generate_video",
    "publish_video",
]
