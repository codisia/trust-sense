"""Content cleaning utilities for news articles."""

import re
from typing import List, Dict


def clean_text(text: str) -> str:
    """Basic cleaning of news text."""
    if not text:
        return ""

    # Remove HTML tags
    text = re.sub(r"<[^>]+>", "", text)

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()

    # Remove common junk (from RSS) like [1], (image)
    text = re.sub(r"\[\d+\]", "", text)
    text = re.sub(r"\(image\)", "", text, flags=re.IGNORECASE)

    return text


def clean_articles(articles: List[Dict]) -> List[Dict]:
    """Apply cleaning to a list of articles."""
    cleaned = []
    for a in articles:
        cleaned.append({
            **a,
            "title": clean_text(a.get("title", "")),
            "content": clean_text(a.get("content", "")),
        })
    return cleaned
