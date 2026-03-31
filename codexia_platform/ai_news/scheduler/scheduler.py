"""Background scheduler for the AI News pipeline."""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.interval import IntervalTrigger
except ImportError:
    BackgroundScheduler = None
    IntervalTrigger = None


scheduler = None


def _default_pipeline():
    """Default pipeline to run in scheduled intervals."""
    try:
        from ..collector import fetch_rss_feeds, fetch_newsapi_articles
        from ..utils.cleaner import clean_articles
        from ..utils.deduplicate import deduplicate_articles
        from ..analyzer import analyze_article
        from ..generator import generate_script
        from ..video import generate_video

        # Collect
        rss_articles = fetch_rss_feeds()
        api_articles = fetch_newsapi_articles()
        articles = rss_articles + api_articles

        # Deduplicate and clean
        articles = clean_articles(deduplicate_articles(articles))

        # Analyze and generate scripts for trusted content
        for art in articles:
            analysis = analyze_article(art)
            if not analysis.get("passes_trust_threshold"):
                continue

            scripts = generate_script(art, language=art.get("language", "en"))
            video_result = generate_video(scripts.get("english", ""), language="en")
            logger.info("Generated video %s", video_result.get("video_url"))

    except Exception as e:
        logger.exception("Scheduled pipeline failed: %s", e)


def start_scheduler(interval_minutes: int = 60, pipeline_callable: Optional[callable] = None):
    """Start the background scheduler."""
    global scheduler
    if scheduler is not None:
        return scheduler

    if BackgroundScheduler is None:
        logger.warning("APScheduler not installed; scheduler disabled")
        return None

    scheduler = BackgroundScheduler()
    trigger = IntervalTrigger(minutes=interval_minutes)
    scheduler.add_job(pipeline_callable or _default_pipeline, trigger)
    scheduler.start()
    logger.info("AI News scheduler started (every %s minutes)", interval_minutes)
    return scheduler


def stop_scheduler():
    global scheduler
    if scheduler:
        scheduler.shutdown(wait=False)
        scheduler = None
