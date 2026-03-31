"""
Psychological Analyzer
Analyzes psychological influence, cognitive biases, and emotional manipulation metrics
"""

import json
import re
from typing import Dict, Any, List, Tuple
from collections import Counter


class PsychologicalAnalyzer:
    """
    Analyzes psychological aspects of content including:
    - Emotional response triggers (Fear, Anxiety, Anger, Sadness, Happiness, Excitement)
    - Cognitive biases (Confirmation bias, Polarization, Urgency)
    - Manipulative language patterns
    - Psychological Influence Index (weighted composite)
    
    Design Flow:
    Input Text → Pattern Detection → Bias Scoring → Emotion Triggers 
    → Aggression Analysis → Deception Indicators → Influence Index → Output
    """
    
    # Keyword dictionaries for analysis
    FEAR_TRIGGERS = [
        "danger", "threat", "risk", "unsafe", "emergency", "crisis", "crisis",
        "attack", "vulnerable", "exposed", "catastrophe", "disaster", "dread",
        "terror", "terrifying", "horrify", "nightmare", "frightening"
    ]
    
    ANGER_TRIGGERS = [
        "outrage", "fury", "enrage", "furious", "bitter", "hostile", "aggressive",
        "savage", "vicious", "brutal", "cruel", "merciless", "despicable"
    ]
    
    ANXIETY_TRIGGERS = [
        "uncertain", "worried", "concern", "stress", "pressure", "anxious",
        "apprehensive", "uneasy", "tense", "jittery", "nervous"
    ]
    
    CONFIRMATION_BIAS_PATTERNS = [
        r"obviously|clearly|everyone knows|it\'s obviously|no doubt",
        r"as we all know|common sense|unquestionably",
        r"fact is|the truth is|reality is" # Asserting without evidence
    ]
    
    URGENCY_PATTERNS = [
        r"immediately|now|quickly|urgent|limited time|act now|don\'t wait",
        r"before it\'s too late|hurry|rush|deadline|must act"
    ]
    
    MANIPULATIVE_PATTERNS = [
        r"you must|you should|forced to|no choice",
        r"everyone is|all people are|they all",  # Generalization
        r"ban|silence|censoring",  # Victimhood narrative
    ]
    
    POLARIZATION_INDICATORS = [
        r"us vs them|good vs evil|black and white",
        r"one side is right|the other side is wrong"
    ]
    
    def __init__(self):
        self.analysis_cache = {}
    
    async def analyze(self, text: str, domain: str = "general") -> Dict[str, Any]:
        """
        Analyze psychological aspects of text
        
        Args:
            text: Content to analyze
            domain: Domain context (psychology, health, military, education, transport)
        
        Returns:
            Dictionary with psychological metrics
        """
        
        if not text or len(text.strip()) < 10:
            return self._empty_result()
        
        # Lowercase for pattern matching
        text_lower = text.lower()
        word_count = len(text.split())
        
        # Calculate metrics
        emotion_triggers = self._analyze_emotions(text_lower)
        cognitive_biases = self._analyze_cognitive_biases(text_lower)
        manipulation_patterns = self._analyze_manipulation(text_lower)
        aggression = self._analyze_aggression(text_lower)
        deception_indicators = self._analyze_deception(text, text_lower)
        persuasion_techniques = self._analyze_persuasion(text_lower)
        
        # Calculate composite scores
        aggression_score = self._score_aggression(aggression, word_count)
        deception_score = self._score_deception(deception_indicators, word_count)
        cognitive_bias_score = self._score_cognitive_bias(cognitive_biases, word_count)
        persuasion_score = self._score_persuasion(persuasion_techniques, word_count)
        
        # Calculate Psychological Influence Index
        influence_index = self._calculate_influence_index(
            aggression_score=aggression_score,
            deception_score=deception_score,
            cognitive_bias_score=cognitive_bias_score,
            persuasion_score=persuasion_score,
            emotion_triggers=emotion_triggers
        )
        
        return {
            "aggression_score": aggression_score,
            "deception_score": deception_score,
            "cognitive_bias_score": cognitive_bias_score,
            "persuasion_score": persuasion_score,
            "influence_index": influence_index,
            
            # Emotional responses
            "emotional_triggers": emotion_triggers,
            "dominant_emotion": self._identify_dominant_emotion(emotion_triggers),
            
            # Cognitive patterns
            "cognitive_biases": cognitive_biases,
            
            # Manipulation indicators
            "manipulation_patterns": manipulation_patterns,
            "persuasion_techniques": persuasion_techniques,
            
            # Detailed signals
            "signals": {
                "aggression": aggression,
                "deception": deception_indicators,
                "manipulation": manipulation_patterns,
                "persuasion": persuasion_techniques,
                "biases": cognitive_biases
            }
        }
    
    def _analyze_emotions(self, text_lower: str) -> Dict[str, float]:
        """Analyze emotional trigger frequencies"""
        
        emotions = {
            "fear": 0,
            "anger": 0,
            "anxiety": 0,
            "sadness": 0,
            "happiness": 0,
            "excitement": 0
        }
        
        # Count fear triggers
        emotions["fear"] = sum(
            text_lower.count(trigger) for trigger in self.FEAR_TRIGGERS
        )
        
        # Count anger triggers
        emotions["anger"] = sum(
            text_lower.count(trigger) for trigger in self.ANGER_TRIGGERS
        )
        
        # Count anxiety triggers
        emotions["anxiety"] = sum(
            text_lower.count(trigger) for trigger in self.ANXIETY_TRIGGERS
        )
        
        # Sadness indicators
        sadness_words = ["sad", "tragic", "devastating", "loss", "suffering", "pain"]
        emotions["sadness"] = sum(
            text_lower.count(word) for word in sadness_words
        )
        
        # Happiness indicators
        happiness_words = ["happy", "joy", "wonderful", "great", "amazing", "excellent"]
        emotions["happiness"] = sum(
            text_lower.count(word) for word in happiness_words
        )
        
        # Excitement indicators
        excitement_words = ["incredible", "unbelievable", "wow", "amazing", "shocking"]
        emotions["excitement"] = sum(
            text_lower.count(word) for word in excitement_words
        )
        
        return emotions
    
    def _analyze_cognitive_biases(self, text_lower: str) -> Dict[str, int]:
        """Detect cognitive bias patterns"""
        
        biases = {
            "confirmation_bias": 0,
            "urgency_bias": 0,
            "polarization": 0,
            "generalization": 0,
            "absolute_thinking": 0
        }
        
        # Confirmation bias detection
        for pattern in self.CONFIRMATION_BIAS_PATTERNS:
            biases["confirmation_bias"] += len(re.findall(pattern, text_lower))
        
        # Urgency bias
        for pattern in self.URGENCY_PATTERNS:
            biases["urgency_bias"] += len(re.findall(pattern, text_lower))
        
        # Polarization indicators
        for pattern in self.POLARIZATION_INDICATORS:
            biases["polarization"] += len(re.findall(pattern, text_lower))
        
        # Absolute thinking patterns
        absolute_words = ["always", "never", "impossible", "must", "certainly"]
        biases["absolute_thinking"] = sum(
            text_lower.count(word) for word in absolute_words
        )
        
        # Generalization patterns
        general_words = ["everyone", "all", "nobody", "always"]
        biases["generalization"] = sum(
            text_lower.count(word) for word in general_words
        )
        
        return biases
    
    def _analyze_manipulation(self, text_lower: str) -> List[str]:
        """Detect manipulative language patterns"""
        
        detected_patterns = []
        
        for pattern in self.MANIPULATIVE_PATTERNS:
            if re.search(pattern, text_lower):
                detected_patterns.append(pattern[:30])  # Store pattern snippet
        
        # Social proof manipulation
        if re.search(r"most people|studies show|experts agree", text_lower):
            detected_patterns.append("false_authority")
        
        # Fear-based manipulation
        if re.search(r"if you don\'t|you\'ll regret|serious consequences", text_lower):
            detected_patterns.append("fear_appeal")
        
        # Scarcity manipulation
        if re.search(r"limited|exclusive|only.*left|running out", text_lower):
            detected_patterns.append("scarcity_appeal")
        
        return detected_patterns
    
    def _analyze_aggression(self, text_lower: str) -> Dict[str, Any]:
        """Analyze aggressive language and tone"""
        
        aggression_indicators = {
            "insulting_language": 0,
            "all_caps_segments": 0,
            "exclamation_marks": 0,
            "aggressive_words": 0
        }
        
        # Aggressive words
        aggressive_words = [
            "stupid", "idiot", "moron", "dumb", "retard",
            "pathetic", "contempt", "despise", "hate"
        ]
        aggression_indicators["aggressive_words"] = sum(
            text_lower.count(word) for word in aggressive_words
        )
        
        # Excessive punctuation
        aggression_indicators["exclamation_marks"] = text_lower.count("!")
        
        # Check for ALL CAPS text (ignore short words)
        words = text_lower.split()
        caps_words = [w for w in words if len(w) > 2 and w.isupper()]
        aggression_indicators["all_caps_segments"] = len(caps_words)
        
        return aggression_indicators
    
    def _analyze_deception(self, text: str, text_lower: str) -> Dict[str, Any]:
        """Analyze potential deception indicators"""
        
        deception = {
            "vague_language": 0,
            "passive_voice": 0,
            "emotion_over_evidence": 0,
            "absence_of_specifics": 0,
            "unusual_punctuation": 0
        }
        
        # Vague language patterns
        vague_words = ["some", "many", "most", "often", "several", "various"]
        deception["vague_language"] = sum(
            text_lower.count(word) for word in vague_words
        )
        
        # Passive voice (less accountability)
        deception["passive_voice"] = len(re.findall(r"was.*by|is.*by|be.*by", text_lower))
        
        # Check if emotional content outweighs facts
        total_words = len(text.split())
        emotional_words = sum([
            len(re.findall(word, text_lower)) 
            for word in self.FEAR_TRIGGERS + self.ANGER_TRIGGERS
        ])
        if total_words > 0:
            deception["emotion_over_evidence"] = int((emotional_words / total_words) * 100)
        
        # Specific numbers and facts (lack of them is suspicious)
        numbers = re.findall(r"\d+", text)
        deception["absence_of_specifics"] = 100 if len(numbers) == 0 else 0
        
        # Unusual punctuation (...)
        deception["unusual_punctuation"] = text.count("...") + text.count("--")
        
        return deception
    
    def _analyze_persuasion(self, text_lower: str) -> List[str]:
        """Identify persuasion techniques"""
        
        techniques = []
        
        # Rhetorical questions
        if "?" in text_lower:
            techniques.append("rhetorical_questions")
        
        # Repetition (same words/phrases)
        words = text_lower.split()
        word_freq = Counter(words)
        if any(count > 5 for count in word_freq.values()):
            techniques.append("repetition")
        
        # Emotional appeals
        if any(word in text_lower for word in ["feel", "believe", "heart", "soul"]):
            techniques.append("emotional_appeal")
        
        # Bandwagon effect
        if re.search(r"everyone|most people|common knowledge", text_lower):
            techniques.append("bandwagon")
        
        # Expert appeal
        if re.search(r"research|studies|experts|scientists", text_lower):
            techniques.append("expert_appeal")
        
        return techniques
    
    def _score_aggression(self, aggression: Dict, word_count: int) -> float:
        """Calculate aggression score (0-100)"""
        
        if word_count == 0:
            return 0
        
        score = 0
        score += min(50, aggression["aggressive_words"] * 10)  # 50% weight
        score += min(30, aggression["exclamation_marks"] * 3)   # 30% weight
        score += min(20, aggression["all_caps_segments"] * 2)   # 20% weight
        
        return min(100, max(0, score))
    
    def _score_deception(self, deception: Dict, word_count: int) -> float:
        """Calculate deception score (0-100)"""
        
        score = 0
        score += min(30, deception["vague_language"] * 2)
        score += min(20, deception["passive_voice"] * 5)
        score += min(25, deception["emotion_over_evidence"] / 4)
        score += (10 if deception["absence_of_specifics"] > 0 else 0)
        score += min(15, deception["unusual_punctuation"] * 3)
        
        return min(100, max(0, score))
    
    def _score_cognitive_bias(self, biases: Dict, word_count: int) -> float:
        """Calculate cognitive bias score (0-100)"""
        
        score = 0
        score += min(25, biases["confirmation_bias"] * 5)
        score += min(20, biases["urgency_bias"] * 4)
        score += min(25, biases["polarization"] * 5)
        score += min(20, biases["absolute_thinking"] * 2)
        score += min(10, biases["generalization"] * 1)
        
        return min(100, max(0, score))
    
    def _score_persuasion(self, techniques: List[str], word_count: int) -> float:
        """Calculate persuasion technique score (0-100)"""
        
        # More techniques = higher persuasion score
        score = len(techniques) * 15
        return min(100, max(0, score))
    
    def _calculate_influence_index(self, aggression_score: float, 
                                  deception_score: float,
                                  cognitive_bias_score: float,
                                  persuasion_score: float,
                                  emotion_triggers: Dict) -> float:
        """
        Calculate Psychological Influence Index (0-100)
        Composite metric for overall psychological impact
        
        Weighting:
        - Aggression (25%): How likely to provoke negative reactions
        - Deception (25%): How likely to mislead
        - Cognitive Bias (25%): How likely to exploit thinking patterns
        - Persuasion (15%): How many persuasion techniques used
        - Emotional Triggers (10%): Emotional intensity
        """
        
        # Emotional trigger intensity
        total_triggers = sum(emotion_triggers.values())
        emotional_intensity = min(100, (total_triggers / 5)) if total_triggers > 0 else 0
        
        index = (
            (aggression_score * 0.25) +
            (deception_score * 0.25) +
            (cognitive_bias_score * 0.25) +
            (persuasion_score * 0.15) +
            (emotional_intensity * 0.10)
        )
        
        return round(min(100, max(0, index)), 2)
    
    def _identify_dominant_emotion(self, emotions: Dict[str, float]) -> str:
        """Identify the dominant emotion from triggers"""
        if not emotions or sum(emotions.values()) == 0:
            return "neutral"
        return max(emotions, key=emotions.get)
    
    def _empty_result(self) -> Dict[str, Any]:
        """Return empty result structure"""
        return {
            "aggression_score": 0,
            "deception_score": 0,
            "cognitive_bias_score": 0,
            "persuasion_score": 0,
            "influence_index": 0,
            "emotional_triggers": {
                "fear": 0, "anger": 0, "anxiety": 0,
                "sadness": 0, "happiness": 0, "excitement": 0
            },
            "dominant_emotion": "neutral",
            "cognitive_biases": {},
            "manipulation_patterns": [],
            "persuasion_techniques": [],
            "signals": {}
        }
