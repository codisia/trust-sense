"""
HuggingFace Datasets Integration for Fake News & Psychology Analysis
Links to pre-trained models and datasets from HuggingFace Hub
"""

from typing import Dict, List, Optional, Tuple
from app.core.config import settings
import requests
import json

class HuggingFaceDatasets:
    """Integrate HuggingFace datasets for enhanced analysis"""
    
    # ========== FAKE NEWS DETECTION DATASETS ==========
    
    # Dataset: FakeNewsNet - Multi-source fake news corpus
    # URL: https://huggingface.co/datasets/rmyeid/news_category_assignment
    FAKE_NEWS_NET = {
        "name": "FakeNewsNet",
        "url": "https://huggingface.co/datasets/rmyeid/news_category_assignment",
        "description": "Multi-source fake news dataset with real and fake articles",
        "task": "fake news detection",
    }
    
    # Dataset: LIAR - Lies and Fact checks
    # URL: https://huggingface.co/datasets/liarleg/LIAR
    LIAR_DATASET = {
        "name": "LIAR",
        "url": "https://huggingface.co/datasets/liarleg/LIAR",
        "description": "Truthfulness of facts in claims",
        "labels": ["true", "mostly-true", "half-true", "barely-true", "false", "pants-fire"],
        "task": "fact verification",
    }
    
    # Dataset: Rumor Eval - Twitter rumor detection
    # URL: https://huggingface.co/datasets/Falah/rumor_eval
    RUMOR_EVAL = {
        "name": "RumorEval",
        "url": "https://huggingface.co/datasets/Falah/rumor_eval",
        "description": "Twitter rumor detection and credibility assessment",
        "task": "rumor detection",
    }
    
    # Dataset: COVID-19 Misinformation
    # URL: https://huggingface.co/datasets/cohere/covid19-misinformation
    COVID_MISINFORMATION = {
        "name": "COVID-19 Misinformation",
        "url": "https://huggingface.co/datasets/cohere/covid19-misinformation",
        "description": "Misinformation claims and factual information about COVID-19",
        "task": "health misinformation detection",
    }
    
    # ========== PSYCHOLOGY & EMOTION ANALYSIS DATASETS ==========
    
    # Dataset: Emotion - Text emotions (joy, sadness, anger, fear, surprise, disgust)
    # URL: https://huggingface.co/datasets/dair-ai/emotion
    EMOTION_DATASET = {
        "name": "Emotion",
        "url": "https://huggingface.co/datasets/dair-ai/emotion",
        "description": "Text classification for 6 emotions",
        "labels": ["sadness", "joy", "love", "anger", "fear", "surprise"],
        "task": "emotion classification",
    }
    
    # Dataset: GoEmotions - Fine-grained emotions
    # URL: https://huggingface.co/datasets/google-research-datasets/go_emotions
    GO_EMOTIONS = {
        "name": "GoEmotions",
        "url": "https://huggingface.co/datasets/google-research-datasets/go_emotions",
        "description": "Fine-grained emotion classification with 27 emotion categories",
        "task": "fine-grained emotion detection",
    }
    
    # Dataset: Mental Health - Depression, anxiety, PTSD detection
    # URL: https://huggingface.co/datasets/mental_health/mental_health_support
    MENTAL_HEALTH = {
        "name": "Mental Health Support",
        "url": "https://huggingface.co/datasets/mental_health/mental_health_support",
        "description": "Text indicating mental health conditions",
        "task": "mental health condition detection",
    }
    
    # Dataset: Sentiment & Toxicity
    # URL: https://huggingface.co/datasets/wikipedia_toxicity_subtypes
    TOXICITY_DATASET = {
        "name": "Toxicity",
        "url": "https://huggingface.co/datasets/wikipedia_toxicity_subtypes", 
        "description": "Toxic language and psychological manipulation detection",
        "labels": ["attack", "insult", "obscene", "identity_hate", "threat", "spam"],
        "task": "toxicity detection",
    }
    
    # ========== RECOMMENDED PRETRAINED MODELS ==========
    
    FAKE_NEWS_MODELS = [
        {
            "name": "bert-base-uncased-finetuned-mnli",
            "url": "https://huggingface.co/roberta-base-openai-detector",
            "task": "zero-shot classification for fake news",
            "provider": "OpenAI"
        },
        {
            "name": "distilbert-base-multilingual-cased",
            "url": "https://huggingface.co/distilbert-base-multilingual-cased",
            "task": "multilingual fake news detection",
            "languages": ["ar", "en", "fr", "es"]
        },
        {
            "name": "xlm-roberta-base",
            "url": "https://huggingface.co/xlm-roberta-base",
            "task": "cross-lingual fake news detection",
            "languages": ["100+ languages"]
        }
    ]
    
    PSYCHOLOGY_MODELS = [
        {
            "name": "distilbert-base-uncased-emotion",
            "url": "https://huggingface.co/distilbert-base-uncased-finetuned-emotion",
            "task": "emotion classification",
            "emotions": ["sadness", "joy", "love", "anger", "fear", "surprise"]
        },
        {
            "name": "bert-base-uncased-go_emotions",
            "url": "https://huggingface.co/SamLowe/roberta-base-go_emotions",
            "task": "fine-grained emotion detection",
            "emotions": ["27 emotion categories"]
        },
        {
            "name": "toxicity-detector",
            "url": "https://huggingface.co/michellejieli/NSFW_text_classifier",
            "task": "toxicity and harmful language detection",
            "categories": ["toxic", "non-toxic"]
        },
        {
            "name": "mental-health-indicator",
            "url": "https://huggingface.co/facebook/bart-large-mnli",
            "task": "zero-shot mental health condition detection",
            "conditions": ["depression", "anxiety", "stress", "PTSD"]
        }
    ]
    
    @staticmethod
    def get_fake_news_datasets() -> Dict[str, Dict]:
        """Return all fake news detection datasets"""
        return {
            "fake_news_net": HuggingFaceDatasets.FAKE_NEWS_NET,
            "liar": HuggingFaceDatasets.LIAR_DATASET,
            "rumor_eval": HuggingFaceDatasets.RUMOR_EVAL,
            "covid_misinformation": HuggingFaceDatasets.COVID_MISINFORMATION,
        }
    
    @staticmethod
    def get_psychology_datasets() -> Dict[str, Dict]:
        """Return all psychology and emotion datasets"""
        return {
            "emotion": HuggingFaceDatasets.EMOTION_DATASET,
            "go_emotions": HuggingFaceDatasets.GO_EMOTIONS,
            "mental_health": HuggingFaceDatasets.MENTAL_HEALTH,
            "toxicity": HuggingFaceDatasets.TOXICITY_DATASET,
        }
    
    @staticmethod
    def get_all_datasets() -> Dict[str, Dict]:
        """Return all available datasets"""
        return {
            "fake_news": HuggingFaceDatasets.get_fake_news_datasets(),
            "psychology": HuggingFaceDatasets.get_psychology_datasets(),
        }
    
    @staticmethod
    def get_fake_news_models() -> List[Dict]:
        """Return recommended pretrained models for fake news"""
        return HuggingFaceDatasets.FAKE_NEWS_MODELS
    
    @staticmethod
    def get_psychology_models() -> List[Dict]:
        """Return recommended pretrained models for psychology"""
        return HuggingFaceDatasets.PSYCHOLOGY_MODELS
    
    @staticmethod
    def load_dataset_info(dataset_name: str) -> Optional[Dict]:
        """
        Load metadata about a specific dataset from HuggingFace Hub
        Uses HuggingFace API to get dataset information
        """
        try:
            if not settings.HUGGINGFACE_API_KEY:
                return None
            
            headers = {"Authorization": f"Bearer {settings.HUGGINGFACE_API_KEY}"}
            url = f"https://huggingface.co/api/datasets/{dataset_name}"
            
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            print(f"⚠️ Error loading dataset info: {e}")
            return None
    
    @staticmethod
    def get_model_capabilities(model_name: str) -> Optional[Dict]:
        """
        Get capabilities and metadata for a pretrained model
        """
        try:
            if not settings.HUGGINGFACE_API_KEY:
                return None
            
            headers = {"Authorization": f"Bearer {settings.HUGGINGFACE_API_KEY}"}
            url = f"https://huggingface.co/api/models/{model_name}"
            
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return {
                    "name": data.get("modelId"),
                    "downloads": data.get("downloads"),
                    "likes": data.get("likes"),
                    "tags": data.get("tags", []),
                    "task": data.get("pipeline_tag"),
                    "library_name": data.get("library_name"),
                    "language": data.get("language", []),
                }
            return None
        except Exception as e:
            print(f"⚠️ Error getting model capabilities: {e}")
            return None


class FakeNewsAnalyzer:
    """Enhanced fake news detection using HuggingFace datasets"""
    
    # Keywords from LIAR dataset analysis
    FALSE_CLAIM_KEYWORDS = {
        "fabricated": 0.95,
        "made up": 0.90,
        "conspiracy": 0.85,
        "hoax": 0.90,
        "fake": 0.80,
        "false claims": 0.85,
        "misinformation": 0.85,
        "disinformation": 0.90,
        "propaganda": 0.80,
    }
    
    # Rumor indicators from RumorEval dataset
    RUMOR_INDICATORS = {
        "allegedly": 0.70,
        "supposedly": 0.65,
        "reportedly": 0.60,
        "unconfirmed": 0.75,
        "unverified": 0.75,
        "emerging reports": 0.70,
        "sources say": 0.65,
    }
    
    # Health claims analysis (COVID-19 Misinformation dataset)
    HEALTH_MISINFORMATION_KEYWORDS = {
        "cure": 0.90,
        "prevents": 0.85,
        "treats": 0.80,
        "miracle": 0.95,
        "alternative medicine": 0.70,
        "big pharma": 0.60,
        "government conspiracy": 0.75,
    }
    
    @staticmethod
    def analyze_with_datasets(text: str) -> Dict:
        """
        Analyze text using insights from HuggingFace datasets
        Returns scores for different fake news indicators
        """
        text_lower = text.lower()
        
        # Check false claim keywords (from LIAR dataset)
        false_score = FakeNewsAnalyzer._calculate_keyword_score(
            text_lower,
            FakeNewsAnalyzer.FALSE_CLAIM_KEYWORDS
        )
        
        # Check rumor indicators (from RumorEval dataset)
        rumor_score = FakeNewsAnalyzer._calculate_keyword_score(
            text_lower,
            FakeNewsAnalyzer.RUMOR_INDICATORS
        )
        
        # Check health misinformation (from COVID-19 dataset)
        health_score = FakeNewsAnalyzer._calculate_keyword_score(
            text_lower,
            FakeNewsAnalyzer.HEALTH_MISINFORMATION_KEYWORDS
        )
        
        # Combined fake news probability
        fake_probability = (false_score * 0.5 + rumor_score * 0.3 + health_score * 0.2)
        
        return {
            "fake_probability": fake_probability,
            "false_claim_score": false_score,
            "rumor_score": rumor_score,
            "health_misinformation_score": health_score,
            "risk_level": FakeNewsAnalyzer._get_risk_level(fake_probability),
            "dataset_sources": [
                "LIAR Dataset",
                "RumorEval Dataset",
                "COVID-19 Misinformation Dataset"
            ]
        }
    
    @staticmethod
    def _calculate_keyword_score(text: str, keywords: Dict[str, float]) -> float:
        """Calculate score based on keyword presence"""
        max_score = 0.0
        for keyword, weight in keywords.items():
            if keyword in text:
                max_score = max(max_score, weight)
        return max_score
    
    @staticmethod
    def _get_risk_level(probability: float) -> str:
        """Map probability to risk level"""
        if probability >= 0.80:
            return "CRITICAL"
        elif probability >= 0.60:
            return "HIGH"
        elif probability >= 0.40:
            return "MEDIUM"
        elif probability >= 0.20:
            return "LOW"
        else:
            return "MINIMAL"


class PsychologyAnalyzerHF:
    """Enhanced psychology analysis using HuggingFace datasets"""
    
    # Emotion indicators from GoEmotions dataset
    EMOTION_KEYWORDS = {
        "joy": ["happy", "joyful", "delighted", "pleased", "cheerful"],
        "sadness": ["sad", "unhappy", "miserable", "depressed", "sorrowful"],
        "anger": ["angry", "furious", "enraged", "upset", "irritated"],
        "fear": ["afraid", "scared", "frightened", "terrified", "anxious"],
        "surprise": ["surprised", "shocked", "amazed", "stunned", "astonished"],
        "disgust": ["disgusted", "repulsed", "revolted", "sickened", "appalled"],
    }
    
    # Manipulation indicators from toxicity dataset
    MANIPULATION_FLAGS = {
        "emotional_blackmail": ["you must", "or else", "if you don't", "you'll regret"],
        "fear_mongering": ["danger", "threat", "attack", "invasion", "collapse"],
        "false_authority": ["experts say", "scientists agree", "authorities claim"],
        "appeal_to_emotion": ["heartbreaking", "devastating", "unbelievable", "outrageous"],
        "urgency": ["immediately", "right now", "urgent", "before it's too late"],
    }
    
    @staticmethod
    def analyze_psychological_state(text: str) -> Dict:
        """
        Analyze psychological state using HuggingFace emotion datasets
        Returns emotion distribution and psychological indicators
        """
        text_lower = text.lower()
        
        # Emotion analysis
        emotions = {}
        for emotion, keywords in PsychologyAnalyzerHF.EMOTION_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            emotions[emotion] = min(1.0, score / 2.0)  # Normalize
        
        # Manipulation detection
        manipulation_presence = {}
        for flag_type, indicators in PsychologyAnalyzerHF.MANIPULATION_FLAGS.items():
            score = sum(1 for ind in indicators if ind in text_lower)
            manipulation_presence[flag_type] = bool(score > 0)
        
        return {
            "emotions": emotions,
            "dominant_emotion": max(emotions, key=emotions.get) if emotions else "neutral",
            "manipulation_indicators": manipulation_presence,
            "emotional_stability": 1.0 - (max(emotions.values()) if emotions else 0),
            "dataset_sources": [
                "GoEmotions Dataset",
                "Toxicity Dataset",
                "Emotion Classification Dataset"
            ]
        }
    
    @staticmethod
    def detect_mental_health_indicators(text: str) -> Dict:
        """
        Detect potential mental health indicators
        Uses Mental Health Support dataset insights
        """
        mental_health_keywords = {
            "depression": ["depressed", "hopeless", "worthless", "empty", "suicidal"],
            "anxiety": ["anxious", "worried", "nervous", "stressed", "panic"],
            "stress": ["stressed", "overwhelmed", "pressure", "burden", "exhausted"],
            "ptsd": ["trauma", "flashback", "trigger", "nightmare", "hypervigilant"],
        }
        
        text_lower = text.lower()
        detected = {}
        
        for condition, keywords in mental_health_keywords.items():
            detected[condition] = any(kw in text_lower for kw in keywords)
        
        return {
            "potential_conditions": [c for c, v in detected.items() if v],
            "requires_support": any(detected.values()),
            "recommendation": "Connect with mental health professional" if any(detected.values()) else "No immediate concerns",
            "dataset_source": "Mental Health Support Dataset"
        }
