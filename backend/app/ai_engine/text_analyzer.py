"""
Text Analyzer - NLP-based analysis for text content
"""

import re
from typing import Dict, Any, List
from collections import Counter


class TextAnalyzer:
    """
    Analyzes text content for:
    - Sentiment analysis
    - Fake news indicators
    - Manipulation and credibility
    - Linguistic patterns
    """
    
    CREDIBLE_INDICATORS = {
        "specific_dates": 5,
        "specific_numbers": 3,
        "citations": 10,
        "evidence_language": 2,
    }
    
    FAKE_NEWS_INDICATORS = {
        "all_caps_headlines": 5,
        "excessive_punctuation": 3,
        "vague_sources": 5,
        "emotional_language": 2,
        "absence_of_nuance": 4,
    }
    
    def __init__(self):
        self.cache = {}
    
    async def analyze(self, text: str) -> Dict[str, Any]:
        """
        Analyze text content
        
        Returns comprehensive text analysis with sentiment, credibility, and signals
        """
        
        if not text or len(text.strip()) == 0:
            return self._empty_result()
        
        # Text preprocessing (handle short texts gracefully)
        sentences = self._split_sentences(text)
        if not sentences:  # If no sentence splitting worked, treat as one sentence
            sentences = [text]
        words = text.split()
        
        # Run analyses
        sentiment = self._analyze_sentiment(text)
        credibility = self._analyze_credibility(text, sentences, words)
        fake_news_prob = self._detect_fake_news_indicators(text, sentences)
        manipulation_score = self._detect_manipulation(text)
        neutrality = self._analyze_linguistic_neutrality(text, words)
        reliability = self._analyze_content_reliability(text, sentences)
        
        # Extract signals
        signals = self._extract_signals(text, sentences, words)
        emotions = self._extract_emotions(text)
        
        # Normalize scores for short texts: shorter texts should have more moderate scores
        length_factor = min(1.0, len(text) / 500.0)  # Reaches 1.0 at 500 chars
        
        # Move extreme scores toward neutral for very short texts
        if length_factor < 0.3:
            sentiment = 50 + (sentiment - 50) * 0.5  # Pull toward neutral
            credibility = 50 + (credibility - 50) * 0.6
            fake_news_prob = fake_news_prob * 0.7  # Reduce false positives
            manipulation_score = manipulation_score * 0.6
        
        return {
            "sentiment": sentiment,
            "credibility": credibility,
            "fake_news_probability": fake_news_prob,
            "manipulation_score": manipulation_score,
            "linguistic_neutrality": neutrality,
            "content_reliability": reliability,
            "emotional_stability": 100 - (sum(emotions.values()) / 2),
            "dominant_emotion": max(emotions, key=emotions.get) if emotions else "neutral",
            "emotions": emotions,
            "signals": signals,
            "word_count": len(words),
            "sentence_count": len(sentences),
            "average_sentence_length": len(words) / len(sentences) if sentences else 0,
            "text_length_confidence": length_factor,  # Confidence score based on text length
        }
    
    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        return [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    
    def _analyze_sentiment(self, text: str) -> float:
        """
        Analyze sentiment (0-100, where 50 is neutral)
        0-30: Very negative, 30-45: Negative, 45-55: Neutral
        55-70: Positive, 70-100: Very positive
        """
        
        positive_words = [
            "good", "great", "excellent", "amazing", "wonderful", "fantastic",
            "positive", "happy", "love", "best", "brilliant", "perfect"
        ]
        
        negative_words = [
            "bad", "terrible", "awful", "horrible", "worst", "hate", "negative",
            "sad", "disgusting", "poor", "dangerous", "wrong", "evil"
        ]
        
        text_lower = text.lower()
        pos_count = sum(text_lower.count(word) for word in positive_words)
        neg_count = sum(text_lower.count(word) for word in negative_words)
        
        total = pos_count + neg_count
        if total == 0:
            return 50  # Neutral
        
        # Calculate sentiment (0-100)
        sentiment = (pos_count - neg_count) / (pos_count + neg_count)
        return 50 + (sentiment * 50)
    
    def _analyze_credibility(self, text: str, sentences: List[str], 
                            words: List[str]) -> float:
        """
        Analyze credibility of content (0-100)
        Considers: citations, specific numbers/dates, evidence, sources
        """
        
        score = 50  # Start at neutral
        
        # Check for specific dates
        dates = re.findall(r'\d{1,2}/\d{1,2}/\d{4}|\d{4}', text)
        score += len(dates) * 2
        
        # Check for specific numbers and percentages
        numbers = re.findall(r'\d+', text)
        score += min(20, len(numbers) * 0.5)
        
        # Check for citations and references
        if re.search(r'\[.*?\]|\(.*?@.*?\)|https?://', text):
            score += 15
        
        # Check for evidence language
        evidence_phrases = ["research shows", "study found", "data indicates", 
                           "evidence suggests", "according to"]
        evidence_count = sum(1 for phrase in evidence_phrases 
                            if phrase.lower() in text.lower())
        score += evidence_count * 5
        
        # Check for named entities (specific people, places)
        named_entities = re.findall(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', text)
        score += min(10, len(named_entities) * 2)
        
        # Penalize for vague language
        vague_words = ["some", "many", "maybe", "might", "could", "probably"]
        vague_count = sum(text.lower().count(word) for word in vague_words)
        score -= vague_count * 1
        
        return min(100, max(0, score))
    
    def _detect_fake_news_indicators(self, text: str, sentences: List[str]) -> float:
        """
        Detect probability of fake news (0-100)
        Higher scores = more likely to be fake
        """
        
        score = 0
        
        # All caps headlines/sentences (clickbait)
        for sentence in sentences[:1]:  # Check first sentence
            if sentence.isupper() and len(sentence) > 10:
                score += 15
        
        # Excessive punctuation
        exclamation_count = text.count("!")
        score += min(20, exclamation_count * 2)
        
        # Check if sources are mentioned
        if not re.search(r'according to|sources|said|statement', text.lower()):
            score += 10
        
        # Sensationalism indicators
        sensational_words = ["shocking", "unbelievable", "you won't believe",
                            "they don't want you to know", "exposed"]
        sensational_count = sum(1 for word in sensational_words 
                               if word.lower() in text.lower())
        score += sensational_count * 5
        
        # Lack of nuance (too black and white)
        absolute_words = ["always", "never", "everyone", "nobody"]
        absolute_count = sum(text.lower().count(word) for word in absolute_words)
        if absolute_count >= 2:
            score += 10
        
        # Missing context or sources
        if len(sentences) < 3:
            score += 10
        
        return min(100, max(0, score))
    
    def _detect_manipulation(self, text: str) -> float:
        """
        Detect manipulation techniques (0-100)
        """
        
        score = 0
        
        # Fear-based language
        fear_words = ["danger", "threat", "risk", "afraid", "threat", "crisis"]
        fear_count = sum(text.lower().count(word) for word in fear_words)
        score += min(30, fear_count * 3)
        
        # Urgency language
        urgency_words = ["immediately", "now", "urgent", "limited time", "act now"]
        urgency_count = sum(text.lower().count(word) for word in urgency_words)
        score += min(20, urgency_count * 4)
        
        # Us vs them language
        if re.search(r'us vs them|good vs evil|black and white', text.lower()):
            score += 15
        
        # Appeals to authority without evidence
        if re.search(r'experts say|research shows', text.lower()):
            # Check if actual sources are provided
            if not re.search(r'\[.*?\]|https?://', text):
                score += 10
        
        return min(100, max(0, score))
    
    def _analyze_linguistic_neutrality(self, text: str, words: List[str]) -> float:
        """
        Analyze linguistic neutrality (0-100)
        Higher = more neutral and objective
        """
        
        if not words:
            return 50
        
        score = 50  # Start neutral
        
        # Subjective language
        subjective_words = ["believe", "feel", "think", "opinion", "should"]
        subj_count = sum(text.lower().count(word) for word in subjective_words)
        score -= subj_count * 2
        
        # Objective language
        objective_words = ["data", "research", "shows", "indicates", "found"]
        obj_count = sum(text.lower().count(word) for word in objective_words)
        score += obj_count * 3
        
        # Use of "I" statements (less neutral)
        if text.lower().count(" i ") > len(words) * 0.05:
            score -= 20
        
        return min(100, max(10, score))
    
    def _analyze_content_reliability(self, text: str, sentences: List[str]) -> float:
        """
        Analyze content reliability based on structure and evidence
        """
        
        score = 50
        
        # Well-structured content is more reliable
        if len(sentences) >= 5:
            score += 10
        
        # Presence of transitions indicates good structure
        transitions = ["moreover", "furthermore", "however", "therefore", "thus"]
        trans_count = sum(text.lower().count(t) for t in transitions)
        score += min(15, trans_count * 3)
        
        # Long, well-developed sentences indicate reliability
        avg_length = sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
        if 15 <= avg_length <= 25:
            score += 15
        
        return min(100, max(0, score))
    
    def _extract_signals(self, text: str, sentences: List[str], 
                        words: List[str]) -> Dict[str, Any]:
        """Extract key indicators and signals"""
        
        return {
            "url_count": len(re.findall(r'https?://', text)),
            "hashtag_count": len(re.findall(r'#\w+', text)),
            "@mention_count": len(re.findall(r'@\w+', text)),
            "quoted_text": "@" in text or '"' in text,
            "has_sources": bool(re.search(r'source|via|according', text.lower())),
            "language_complexity": len([w for w in words if len(w) > 8]) / len(words) if words else 0,
        }
    
    def _extract_emotions(self, text: str) -> Dict[str, float]:
        """Extract emotional content"""
        
        emotions = {
            "joy": 0, "sadness": 0, "anger": 0,
            "fear": 0, "surprise": 0, "disgust": 0
        }
        
        joy_words = ["happy", "joy", "excellent", "wonderful", "amazing"]
        emotions["joy"] = sum(text.lower().count(w) for w in joy_words)
        
        sadness_words = ["sad", "tragic", "devastating", "loss", "suffering"]
        emotions["sadness"] = sum(text.lower().count(w) for w in sadness_words)
        
        anger_words = ["angry", "furious", "outraged", "enraged", "bitter"]
        emotions["anger"] = sum(text.lower().count(w) for w in anger_words)
        
        fear_words = ["afraid", "scared", "dangerous", "threat", "risk"]
        emotions["fear"] = sum(text.lower().count(w) for w in fear_words)
        
        return emotions
    
    def _empty_result(self) -> Dict[str, Any]:
        """Return empty result structure"""
        return {
            "sentiment": 50,
            "credibility": 50,
            "fake_news_probability": 0,
            "manipulation_score": 0,
            "linguistic_neutrality": 50,
            "content_reliability": 50,
            "emotional_stability": 100,
            "dominant_emotion": "neutral",
            "emotions": {},
            "signals": {},
            "word_count": 0,
            "sentence_count": 0,
            "average_sentence_length": 0,
        }
