"""Deduplication utilities for news articles."""

from typing import List, Dict


def deduplicate_articles(articles: List[Dict], key_fields=None) -> List[Dict]:
    """Remove duplicate articles based on key fields.

    Defaults to using title + source as the dedup key.
    """
    key_fields = key_fields or ["title", "source"]
    seen = set()
    output = []

    for article in articles:
        key = tuple(article.get(k, "") for k in key_fields)
        if key in seen:
            continue
        seen.add(key)
        output.append(article)

    return output
