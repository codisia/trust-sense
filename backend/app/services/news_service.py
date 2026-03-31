"""Services for the AI News Broadcasting pipeline."""

from datetime import datetime
from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session

from app.models.models import NewsArticle, NewsScript, NewsVideo, PublicationRecord

from codexia_platform.ai_news.collector import fetch_rss_feeds, fetch_newsapi_articles
from codexia_platform.ai_news.utils import clean_articles, deduplicate_articles
from codexia_platform.ai_news.analyzer import analyze_article
from codexia_platform.ai_news.generator import generate_script
from codexia_platform.ai_news.video import generate_video, generate_sign_language_video
from codexia_platform.ai_news.publisher import publish_video

from app.services.security_logger import (
    log_news_pipeline_run,
    log_video_generation,
    log_publication_attempt,
    log_suspicious_content
)


def run_news_pipeline(
    db: Session,
    sources: Optional[List[str]] = None,
    language: str = "en",
    trust_threshold: float = 70.0,
    publish_platforms: Optional[List[str]] = None,
    include_sign_language: bool = False,
) -> List[Dict[str, Any]]:
    """Fetch, analyze, generate scripts/videos, and optionally publish."""
    publish_platforms = publish_platforms or ["youtube"]

    rss_articles = fetch_rss_feeds(sources)
    api_articles = fetch_newsapi_articles()
    articles = rss_articles + api_articles

    articles = deduplicate_articles(articles)
    articles = clean_articles(articles)

    results: List[Dict[str, Any]] = []
    for art in articles:
        analysis = analyze_article(art)
        if analysis.get("trust_score", 0.0) < trust_threshold:
            # Log suspicious content
            if analysis.get("trust_score", 0.0) < 50:
                log_suspicious_content(
                    user_id=None,  # System-generated
                    content_type="news_article",
                    content_id=None,
                    reason=f"Low trust score: {analysis.get('trust_score')}",
                    risk_score=analysis.get("fake_news_probability", 0.0)
                )
            continue

        # Persist article
        article_obj = NewsArticle(
            title=art.get("title"),
            content=art.get("content"),
            source=art.get("source"),
            language=art.get("language", language),
            published_at=art.get("published_at"),
            url=art.get("url"),
            trust_score=analysis.get("trust_score"),
            analysis_json=analysis,
        )
        db.add(article_obj)
        db.commit()
        db.refresh(article_obj)

        # Generate script(s)
        scripts = generate_script(art, language=language)
        script_objs: Dict[str, NewsScript] = {}
        for lang, script_text in scripts.items():
            script_obj = NewsScript(
                article_id=article_obj.id,
                language=lang,
                script=script_text,
            )
            db.add(script_obj)
            db.commit()
            db.refresh(script_obj)
            script_objs[lang] = script_obj

        # Generate video for english script (baseline)
        video_result = generate_video(scripts.get("english", ""), language="en")
        video_obj = NewsVideo(
            script_id=script_objs["english"].id,
            video_url=video_result.get("video_url"),
            local_path=video_result.get("local_path"),
            status="generated",
            metadata_json=video_result.get("metadata"),
        )
        db.add(video_obj)
        db.commit()
        db.refresh(video_obj)

        # Log video generation
        log_video_generation(
            user_id=None,  # System-generated
            script_id=script_objs["english"].id,
            video_url=video_result.get("video_url"),
            success=bool(video_result.get("video_url"))
        )

        # Optionally generate sign language version
        if include_sign_language and video_result.get("local_path"):
            try:
                sign_result = generate_sign_language_video(video_result["local_path"])
                # Update video with sign language path
                video_obj.local_path = sign_result["output_path"]
                db.commit()
            except Exception:
                # Log but don't fail the pipeline
                pass

        publications = []
        for platform in publish_platforms:
            try:
                pub_result = publish_video(video_result, platform=platform)
                pub_record = PublicationRecord(
                    video_id=video_obj.id,
                    platform=platform,
                    status="published",
                    publish_url=pub_result.get("url"),
                    response_json=pub_result,
                )
                # Log successful publication
                log_publication_attempt(
                    user_id=None,
                    video_id=video_obj.id,
                    platform=platform,
                    success=True,
                    publish_url=pub_result.get("url")
                )
            except Exception as e:
                pub_record = PublicationRecord(
                    video_id=video_obj.id,
                    platform=platform,
                    status="failed",
                    response_json={"error": str(e)},
                )
                # Log failed publication
                log_publication_attempt(
                    user_id=None,
                    video_id=video_obj.id,
                    platform=platform,
                    success=False,
                    error_message=str(e)
                )
            db.add(pub_record)
            db.commit()
            db.refresh(pub_record)
            publications.append(pub_record)

        results.append({
            "article_id": article_obj.id,
            "video_id": video_obj.id,
            "published": [p.platform for p in publications if p.status == "published"],
        })

    # Log overall pipeline run
    log_news_pipeline_run(
        user_id=None,  # System-generated
        articles_processed=len(articles),
        videos_generated=len([r for r in results if r.get("video_id")]),
        publications_attempted=sum(len(r.get("published", [])) for r in results)
    )

    return results


def list_latest_articles(db: Session, limit: int = 20) -> List[NewsArticle]:
    return db.query(NewsArticle).order_by(NewsArticle.published_at.desc()).limit(limit).all()


def list_videos(db: Session, limit: int = 20) -> List[NewsVideo]:
    return db.query(NewsVideo).order_by(NewsVideo.created_at.desc()).limit(limit).all()
