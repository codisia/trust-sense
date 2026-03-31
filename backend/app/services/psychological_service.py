"""
Psychological Analysis Service
Performs deep psychological analysis on content including aggression, deception, cognitive bias, persuasion.
"""
import re
from typing import Dict, Tuple


class PsychologicalAnalyzer:
    """Analyzes psychological aspects of content"""

    # Aggressive language indicators
    AGGRESSION_PATTERNS = {
        'extreme_words': ['destroy', 'crush', 'kill', 'slaughter', 'annihilate', 'obliterate', 'massacre'],
        'threat_words': ['threat', 'dangerous', 'attack', 'assault', 'violence', 'war', 'battle'],
        'insults': ['idiot', 'stupid', 'moron', 'pathetic', 'disgusting', 'hate'],
        'exclamations': ['!!!', '!!!', '!!!'],  # Excessive exclamation marks
    }

    # Deceptive language indicators
    DECEPTION_PATTERNS = {
        'evasion': ['allegedly', 'reportedly', 'sources say', 'they claim', 'supposedly', 'apparently'],
        'false_precision': ['exactly', '100%', 'definitive', 'absolutely', 'certainly', 'guarantee'],
        'emotional_appeals': ['emotional', 'feel', 'believed', 'convinced', 'trust me'],
        'authority_fallacy': ['everyone knows', 'scientists agree', 'experts say', 'research shows'],
    }

    # Cognitive bias indicators
    COGNITIVE_BIAS_PATTERNS = {
        'confirmation_bias': ['obviously', 'clearly', 'anyone can see', 'it\'s obvious', 'undeniably'],
        'bandwagon': ['everyone', 'most people', 'trending', 'everyone knows', 'popular opinion'],
        'black_white': ['always', 'never', 'completely', 'totally', 'all or nothing'],
        'straw_man': ['they claim', 'some people say', 'supposedly believe'],
    }

    # Persuasion techniques
    PERSUASION_PATTERNS = {
        'scarcity': ['limited', 'exclusive', 'only', 'before it\'s too late', 'act now', 'urgent'],
        'authority': ['expert', 'professional', 'certified', 'approved', 'official'],
        'social_proof': ['everyone', 'bestseller', 'trending', 'millions', 'trusted by'],
        'emotional_appeal': ['love', 'hate', 'fear', 'pride', 'shame', 'joy', 'anger'],
    }

    @classmethod
    def analyze(cls, text: str) -> Dict[str, float]:
        """
        Perform comprehensive psychological analysis
        Returns scores 0-100 for: aggression, deception, cognitive_bias, persuasion
        """
        text_lower = text.lower()
        text_words = text_lower.split()

        aggression_score = cls._calculate_aggression(text_lower, text_words)
        deception_score = cls._calculate_deception(text_lower, text_words)
        cognitive_bias_score = cls._calculate_cognitive_bias(text_lower, text_words)
        persuasion_score = cls._calculate_persuasion(text_lower, text_words)

        return {
            'aggression_score': min(100, max(0, aggression_score)),
            'deception_score': min(100, max(0, deception_score)),
            'cognitive_bias_score': min(100, max(0, cognitive_bias_score)),
            'persuasion_score': min(100, max(0, persuasion_score)),
        }

    @classmethod
    def _calculate_aggression(cls, text_lower: str, words: list) -> float:
        """Calculate aggression score (0-100)"""
        score = 0.0
        
        # Extreme words
        found = sum(1 for word in cls.AGGRESSION_PATTERNS['extreme_words'] if word in text_lower)
        score += found * 15
        
        # Threat words
        found = sum(1 for word in cls.AGGRESSION_PATTERNS['threat_words'] if word in text_lower)
        score += found * 12
        
        # Insults
        found = sum(1 for word in cls.AGGRESSION_PATTERNS['insults'] if word in text_lower)
        score += found * 10
        
        # Excessive punctuation
        exclamations = text_lower.count('!!!') + text_lower.count('!!') + text_lower.count('!!!')
        score += exclamations * 5
        
        # ALL CAPS words (3+ consecutive)
        caps_count = len(re.findall(r'\b[A-Z]{3,}\b', text_lower))
        score += caps_count * 3
        
        return score

    @classmethod
    def _calculate_deception(cls, text_lower: str, words: list) -> float:
        """Calculate deception score (0-100)"""
        score = 0.0
        
        # Evasion patterns
        found = sum(1 for word in cls.DECEPTION_PATTERNS['evasion'] if word in text_lower)
        score += found * 12
        
        # False precision (contradictory)
        has_absolutes = any(word in text_lower for word in ['100%', 'definitely', 'absolutely', 'certainly'])
        if has_absolutes and any(word in text_lower for word in cls.DECEPTION_PATTERNS['evasion']):
            score += 20  # Contradictory claims
        
        # Authority fallacy
        found = sum(1 for word in cls.DECEPTION_PATTERNS['authority_fallacy'] if word in text_lower)
        score += found * 15
        
        # Sensationalism indicators
        if '!!!' in text_lower or '???' in text_lower:
            score += 8
        
        # Claims without sources
        vague_claims = sum(1 for word in ['claim', 'believe', 'think', 'seems'] if word in text_lower)
        if vague_claims > 3:
            score += 15
        
        return score

    @classmethod
    def _calculate_cognitive_bias(cls, text_lower: str, words: list) -> float:
        """Calculate cognitive bias score (0-100)"""
        score = 0.0
        
        # Confirmation bias
        found = sum(1 for word in cls.COGNITIVE_BIAS_PATTERNS['confirmation_bias'] if word in text_lower)
        score += found * 12
        
        # Bandwagon fallacy
        found = sum(1 for word in cls.COGNITIVE_BIAS_PATTERNS['bandwagon'] if word in text_lower)
        score += found * 13
        
        # Black and white thinking
        found = sum(1 for word in cls.COGNITIVE_BIAS_PATTERNS['black_white'] if word in text_lower)
        score += found * 10
        
        # Generalization indicators
        generalizations = sum(1 for word in ['all', 'none', 'everyone', 'nobody'] if word in text_lower)
        score += generalizations * 8
        
        return score

    @classmethod
    def _calculate_persuasion(cls, text_lower: str, words: list) -> float:
        """Calculate persuasion/manipulation score (0-100)"""
        score = 0.0
        
        # Scarcity tactics
        found = sum(1 for word in cls.PERSUASION_PATTERNS['scarcity'] if word in text_lower)
        score += found * 13
        
        # Authority tactics
        found = sum(1 for word in cls.PERSUASION_PATTERNS['authority'] if word in text_lower)
        score += found * 11
        
        # Social proof
        found = sum(1 for word in cls.PERSUASION_PATTERNS['social_proof'] if word in text_lower)
        score += found * 12
        
        # Emotional appeals
        found = sum(1 for word in cls.PERSUASION_PATTERNS['emotional_appeal'] if word in text_lower)
        score += found * 8
        
        # Call to action urgency
        if any(phrase in text_lower for phrase in ['click here', 'buy now', 'subscribe now', 'act now', 'limited time']):
            score += 15
        
        return score
