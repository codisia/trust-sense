"""Script generation using transformers summarization and translation."""

from typing import Dict, Any

try:
    from transformers import pipeline
except ImportError:  # pragma: no cover
    pipeline = None


_SUMMARY_MODEL = "sshleifer/distilbart-cnn-12-6"
_TRANSLATE_EN_FR = "Helsinki-NLP/opus-mt-en-fr"
_TRANSLATE_EN_AR = "Helsinki-NLP/opus-mt-en-ar"


def _get_pipeline(task: str, model: str):
    if pipeline is None:
        raise ImportError("transformers is required for script generation. Install with `pip install transformers`.")
    return pipeline(task, model=model)


def _summarize(text: str, language: str = "en") -> str:
    """Summarize text into a short news script style."""
    if not text:
        return ""

    summarizer = _get_pipeline("summarization", _SUMMARY_MODEL)
    result = summarizer(text, max_length=150, min_length=40, do_sample=False)
    return result[0]["summary_text"].strip()


def _translate(text: str, target_language: str) -> str:
    if not text:
        return ""

    if target_language.lower().startswith("fr"):
        translator = _get_pipeline("translation", _TRANSLATE_EN_FR)
    elif target_language.lower().startswith("ar"):
        translator = _get_pipeline("translation", _TRANSLATE_EN_AR)
    else:
        # default to English
        return text

    result = translator(text, max_length=512)
    return result[0]["translation_text"].strip()


def generate_script(article: Dict[str, Any], language: str = "en") -> Dict[str, str]:
    """Generate news presenter scripts in English, French, and Arabic.

    Returns a dict with keys: english, french, arabic
    """
    # Ensure we have text to summarize
    text = article.get("content") or article.get("title") or ""

    # Generate base English script
    english_script = _summarize(text, language="en")

    # Provide translations
    french_script = _translate(english_script, "fr")
    arabic_script = _translate(english_script, "ar")

    return {
        "english": english_script,
        "french": french_script,
        "arabic": arabic_script,
    }
