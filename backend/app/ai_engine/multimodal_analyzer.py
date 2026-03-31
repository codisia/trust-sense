"""
Multimodal Analyzer: Unified interface for text, audio, and video analysis
Coordinates between different analyzers and aggregates results
"""

import json
from typing import Dict, Any, Optional, List
from datetime import datetime
from .text_analyzer import TextAnalyzer
from .audio_video_analyzers import AudioAnalyzer, VideoAnalyzer
from .psychological_analyzer import PsychologicalAnalyzer


class MultimodalAnalyzer:
    """
    Main AI engine for analyzing multimodal content
    Integrates text, audio, and video analysis with psychological metrics
    
    Data Flow:
    Input Content → Router → Analyzer (text/audio/video) → Psychological Analysis 
    → Trust Scoring → Result Aggregation → Output
    """
    
    def __init__(self):
        self.text_analyzer = TextAnalyzer()
        self.audio_analyzer = AudioAnalyzer()
        self.video_analyzer = VideoAnalyzer()
        self.psychological_analyzer = PsychologicalAnalyzer()
    
    async def analyze(self, content: str, content_type: str = "text", 
                     metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Analyze content based on type and return comprehensive results
        
        Args:
            content: The content to analyze (text, audio file path, or video file path)
            content_type: 'text', 'audio', or 'video'
            metadata: Optional metadata (source_platform, author, timestamp, etc.)
        
        Returns:
            Comprehensive analysis result with trust score and metrics
        """
        
        # Route to appropriate analyzer
        if content_type == "text":
            basic_analysis = await self.text_analyzer.analyze(content)
        elif content_type == "audio":
            basic_analysis = await self.audio_analyzer.analyze(content)
        elif content_type == "video":
            basic_analysis = await self.video_analyzer.analyze(content)
        else:
            raise ValueError(f"Unsupported content type: {content_type}")
        
        # Extract text for psychological analysis
        analysis_text = self._extract_text(content, content_type, basic_analysis)
        
        # Run psychological analysis
        psych_metrics = await self.psychological_analyzer.analyze(analysis_text)
        
        # Aggregate results
        final_result = self._aggregate_results(
            basic_analysis=basic_analysis,
            psych_metrics=psych_metrics,
            content_type=content_type,
            metadata=metadata
        )
        
        return final_result
    
    def _extract_text(self, content: str, content_type: str, 
                     basic_analysis: Dict) -> str:
        """Extract text from content based on type"""
        if content_type == "text":
            return content
        elif content_type == "audio":
            return basic_analysis.get("transcript", "")
        elif content_type == "video":
            return basic_analysis.get("transcript", "")
        return ""
    
    def _aggregate_results(self, basic_analysis: Dict, psych_metrics: Dict,
                          content_type: str, 
                          metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Aggregate all analysis results into final output"""
        
        # Calculate weighted trust score
        trust_score = self._calculate_trust_score(basic_analysis, psych_metrics)
        
        # Determine risk level
        risk_level = self._determine_risk_level(trust_score, psych_metrics)
        
        # Compile result
        result = {
            "timestamp": datetime.utcnow().isoformat(),
            "content_type": content_type,
            
            # Core metrics
            "trust_score": trust_score,
            "risk_level": risk_level,
            
            # Text analysis metrics
            "sentiment": basic_analysis.get("sentiment"),
            "fake_news_probability": basic_analysis.get("fake_news_probability", 0),
            "manipulation_score": basic_analysis.get("manipulation_score", 0),
            "credibility": basic_analysis.get("credibility", 0),
            
            # Emotional analysis
            "dominant_emotion": basic_analysis.get("dominant_emotion"),
            "emotions": basic_analysis.get("emotions", {}),
            "emotional_stability": basic_analysis.get("emotional_stability", 0),
            
            # Psychological metrics
            "aggression_score": psych_metrics.get("aggression_score", 0),
            "deception_score": psych_metrics.get("deception_score", 0),
            "cognitive_bias_score": psych_metrics.get("cognitive_bias_score", 0),
            "persuasion_score": psych_metrics.get("persuasion_score", 0),
            "psychological_influence_index": psych_metrics.get("influence_index", 0),
            
            # Content-specific analysis
            "linguistic_neutrality": basic_analysis.get("linguistic_neutrality", 0),
            "content_reliability": basic_analysis.get("content_reliability", 0),
            
            # Audio/Video specific
            "voice_emotion": basic_analysis.get("voice_emotion"),
            "voice_emotion_score": basic_analysis.get("voice_emotion_score"),
            "deepfake_probability": basic_analysis.get("deepfake_probability", 0),
            
            # Social media
            "source_platform": metadata.get("source_platform") if metadata else None,
            "engagement_metrics": metadata.get("engagement_metrics") if metadata else {},
            
            # Detailed signals
            "signals": basic_analysis.get("signals", {}),
            "psychological_signals": psych_metrics.get("signals", {}),
            
            # Summary
            "summary": self._generate_summary(trust_score, psych_metrics, basic_analysis),
            "recommendations": self._generate_recommendations(trust_score, risk_level, psych_metrics)
        }
        
        return result
    
    def _calculate_trust_score(self, basic_analysis: Dict, 
                              psych_metrics: Dict) -> float:
        """
        Calculate weighted trust score from multiple factors
        
        Weighting:
        - Credibility (25%): From content analysis
        - Emotional (20%): Emotional stability indicator
        - Cognitive (20%): Cognitive bias resistance
        - Deception (20%): Low deception score = high trust
        - Influence (15%): Psychological influence resistance
        """
        
        credibility = basic_analysis.get("credibility", 50) * 0.25
        emotional = (100 - psych_metrics.get("aggression_score", 0)) * 0.20
        cognitive = (100 - psych_metrics.get("cognitive_bias_score", 0)) * 0.20
        deception = (100 - psych_metrics.get("deception_score", 0)) * 0.20
        influence = (100 - psych_metrics.get("influence_index", 0)) * 0.15
        
        trust_score = credibility + emotional + cognitive + deception + influence
        return round(min(100, max(0, trust_score)), 2)
    
    def _determine_risk_level(self, trust_score: float, 
                            psych_metrics: Dict) -> str:
        """Determine risk level based on trust score and psychological metrics"""
        
        if trust_score >= 75 and psych_metrics.get("aggression_score", 0) < 30:
            return "LOW"
        elif trust_score >= 50 and psych_metrics.get("aggression_score", 0) < 50:
            return "MEDIUM"
        elif trust_score >= 30:
            return "HIGH"
        else:
            return "CRITICAL"
    
    def _generate_summary(self, trust_score: float, psych_metrics: Dict,
                         basic_analysis: Dict) -> str:
        """Generate human-readable summary of analysis"""
        
        summary_parts = []
        
        # Trust summary
        if trust_score >= 75:
            summary_parts.append(f"Content shows high trustworthiness ({trust_score}%).")
        elif trust_score >= 50:
            summary_parts.append(f"Content has moderate credibility ({trust_score}%).")
        else:
            summary_parts.append(f"Content shows low trustworthiness ({trust_score}%).")
        
        # Psychological summary
        agg_score = psych_metrics.get("aggression_score", 0)
        if agg_score > 70:
            summary_parts.append("Contains aggressive language and potentially inflammatory content.")
        
        # Deception summary
        dec_score = psych_metrics.get("deception_score", 0)
        if dec_score > 60:
            summary_parts.append("Detected patterns suggesting potential deception or manipulation.")
        
        # Manipulation summary
        manip_score = basic_analysis.get("manipulation_score", 0)
        if manip_score > 60:
            summary_parts.append("Content employs manipulative techniques.")
        
        return " ".join(summary_parts)
    
    def _generate_recommendations(self, trust_score: float, risk_level: str,
                                 psych_metrics: Dict) -> List[str]:
        """Generate recommendations based on analysis"""
        
        recommendations = []
        
        if trust_score < 50:
            recommendations.append("Consider verifying claims with authoritative sources")
        
        if psych_metrics.get("cognitive_bias_score", 0) > 70:
            recommendations.append("Be aware of potential cognitive biases in content")
        
        if psych_metrics.get("persuasion_score", 0) > 70:
            recommendations.append("Exercise critical thinking - content uses persuasive techniques")
        
        if risk_level in ["HIGH", "CRITICAL"]:
            recommendations.append("Flag for manual review by content moderation team")
        
        if not recommendations:
            recommendations.append("Content appears trustworthy with standard caution")
        
        return recommendations


# Placeholder for dataset management
class DatasetManager:
    """
    Manages training and evaluation datasets for the AI engine
    Supports multiple domains: Psychology, Health, Military, Education, Transport
    """
    
    DOMAINS = {
        "psychology": {
            "traits": ["emotional_stability", "cognitive_bias", "aggression"],
            "datasets": ["Big Five", "Psychometric assessments"]
        },
        "health": {
            "traits": ["health_misinformation", "credibility", "evidence_quality"],
            "datasets": ["WHO guidelines", "Medical literature"]
        },
        "military": {
            "traits": ["disinformation", "propaganda", "strategic_messaging"],
            "datasets": ["Defense department advisories"]
        },
        "education": {
            "traits": ["educational_quality", "source_credibility", "bias"],
            "datasets": ["Academic standards", "Peer-reviewed research"]
        },
        "transport": {
            "traits": ["safety_accuracy", "regulatory_compliance"],
            "datasets": ["DOT regulations", "Safety standards"]
        }
    }
    
    def __init__(self):
        self.loaded_datasets = {}
    
    async def load_domain_dataset(self, domain: str) -> Dict[str, Any]:
        """Load dataset for specific domain"""
        if domain not in self.DOMAINS:
            raise ValueError(f"Unknown domain: {domain}")
        
        # Placeholder: In production, load from database or cloud storage
        return {
            "domain": domain,
            "config": self.DOMAINS[domain],
            "samples": []  # Load actual samples from storage
        }
