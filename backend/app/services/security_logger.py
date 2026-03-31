"""Security logging utilities for the AI News Broadcasting System."""

import logging
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Ensure logs directory exists
os.makedirs('logs', exist_ok=True)

# Configure security logger
security_logger = logging.getLogger('security')
security_logger.setLevel(logging.INFO)

# Create file handler for security logs
handler = logging.FileHandler('logs/security.log')
handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s'
))
security_logger.addHandler(handler)

# Also log to console for development
console_handler = logging.StreamHandler()
console_handler.setFormatter(logging.Formatter(
    '%(asctime)s - SECURITY - %(levelname)s - %(message)s'
))
security_logger.addHandler(console_handler)


def log_security_event(
    event_type: str,
    user_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    severity: str = "INFO"
):
    """Log a security-related event."""
    log_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "severity": severity,
        "details": details or {}
    }

    message = json.dumps(log_data, default=str)

    if severity == "CRITICAL":
        security_logger.critical(message)
    elif severity == "ERROR":
        security_logger.error(message)
    elif severity == "WARNING":
        security_logger.warning(message)
    else:
        security_logger.info(message)


def log_news_pipeline_run(
    user_id: Optional[int],
    articles_processed: int,
    videos_generated: int,
    publications_attempted: int,
    ip_address: Optional[str] = None
):
    """Log news pipeline execution."""
    log_security_event(
        event_type="NEWS_PIPELINE_RUN",
        user_id=user_id,
        details={
            "articles_processed": articles_processed,
            "videos_generated": videos_generated,
            "publications_attempted": publications_attempted
        },
        ip_address=ip_address,
        severity="INFO"
    )


def log_video_generation(
    user_id: Optional[int],
    script_id: int,
    video_url: Optional[str],
    success: bool,
    error_message: Optional[str] = None
):
    """Log video generation attempts."""
    log_security_event(
        event_type="VIDEO_GENERATION",
        user_id=user_id,
        details={
            "script_id": script_id,
            "video_url": video_url,
            "success": success,
            "error_message": error_message
        },
        severity="WARNING" if not success else "INFO"
    )


def log_publication_attempt(
    user_id: Optional[int],
    video_id: int,
    platform: str,
    success: bool,
    publish_url: Optional[str] = None,
    error_message: Optional[str] = None
):
    """Log social media publication attempts."""
    log_security_event(
        event_type="PUBLICATION_ATTEMPT",
        user_id=user_id,
        details={
            "video_id": video_id,
            "platform": platform,
            "success": success,
            "publish_url": publish_url,
            "error_message": error_message
        },
        severity="ERROR" if not success else "INFO"
    )


def log_suspicious_content(
    user_id: Optional[int],
    content_type: str,
    content_id: Optional[int],
    reason: str,
    risk_score: float
):
    """Log detection of suspicious content."""
    log_security_event(
        event_type="SUSPICIOUS_CONTENT",
        user_id=user_id,
        details={
            "content_type": content_type,
            "content_id": content_id,
            "reason": reason,
            "risk_score": risk_score
        },
        severity="WARNING" if risk_score > 0.7 else "INFO"
    )


def log_api_access(
    endpoint: str,
    method: str,
    user_id: Optional[int],
    status_code: int,
    response_time: float,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Log API access for monitoring."""
    log_security_event(
        event_type="API_ACCESS",
        user_id=user_id,
        details={
            "endpoint": endpoint,
            "method": method,
            "status_code": status_code,
            "response_time": response_time
        },
        ip_address=ip_address,
        user_agent=user_agent,
        severity="ERROR" if status_code >= 400 else "INFO"
    )
