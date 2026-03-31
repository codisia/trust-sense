"""Article analysis using the Trust Sense AI engine."""

from typing import Dict, Any


def _get_analyze_text_callable():
    """Prefer backend analysis if available, otherwise use trust_sense engine."""
    try:
        # backend.analysis uses `app.services.nlp_service.analyze_text`
        from app.services.nlp_service import analyze_text

        return analyze_text
    except Exception:
        # Fallback to trust_sense TrustEngine
        try:
            from trust_sense.engine import TrustEngine

            engine = TrustEngine()
            return lambda text: engine.analyze_content({"text": text}, modalities=["text"])
        except Exception as e:
            raise RuntimeError("No analysis backend available") from e


def analyze_article(article: Dict[str, Any]) -> Dict[str, Any]:
    """Run trust scoring and bias/psychological analysis on an article."""
    text = article.get("content") or article.get("title") or ""
    result = _get_analyze_text_callable()(text)

    # Normalize keys for compatibility with API responses
    normalized = {
        "trust_score": float(result.get("trust_score") or result.get("trustScore") or 0.0),
        "sentiment": float(result.get("sentiment") or 0.0),
        "fake_news_probability": float(result.get("fake_news_probability") or result.get("fakeNewsProbability") or 0.0),
        "manipulation_score": float(result.get("manipulation_score") or result.get("manipulationScore") or 0.0),
        "credibility": float(result.get("credibility") or 0.0),
        "emotional_stability": float(result.get("emotional_stability") or 0.0),
        "linguistic_neutrality": float(result.get("linguistic_neutrality") or 0.0),
        "content_reliability": float(result.get("content_reliability") or 0.0),
        "dominant_emotion": result.get("dominant_emotion") or result.get("dominantEmotion") or "",
        "risk_level": result.get("risk_level") or result.get("riskLevel") or "",
        "signals": result.get("signals") or result.get("signals_json") or [],
        "summary": result.get("summary") or "",
    }

    # Basic bias / manipulation heuristics (placeholder for more advanced models)
    bias_score = normalized["fake_news_probability"] * 100
    normalized["bias_score"] = min(100, bias_score)

    # Add pass/fail filtering
    normalized["passes_trust_threshold"] = normalized["trust_score"] >= 70

    return normalized
