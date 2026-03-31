"""
LLM Reasoning Module for Trust Analysis
Uses language models for advanced reasoning and explanation
"""

from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import torch
from typing import Dict, Any, List, Optional
import logging
import json

logger = logging.getLogger(__name__)

class Reasoner:
    def __init__(self, model_name: str = "microsoft/DialoGPT-medium"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Use a smaller model for MVP
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForCausalLM.from_pretrained(model_name)
            self.model.to(self.device)
        except:
            # Fallback to pipeline
            self.generator = pipeline("text-generation", model=model_name, device=self.device)
            self.tokenizer = None
            self.model = None
        
        # Sentiment and classification pipelines
        self.sentiment_analyzer = pipeline("sentiment-analysis", device=self.device)
        self.classifier = pipeline("zero-shot-classification", 
                                model="facebook/bart-large-mnli", device=self.device)
    
    def analyze_trust_factors(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze trust factors using LLM reasoning"""
        text_content = self._extract_text_content(content)
        
        if not text_content:
            return {'trust_score': 0.5, 'factors': ['No analyzable content']}
        
        # Zero-shot classification for trust indicators
        trust_labels = [
            "trustworthy", "misleading", "propaganda", "factual", 
            "biased", "neutral", "manipulative", "authentic"
        ]
        
        classification = self.classifier(text_content, trust_labels)
        
        # Generate reasoning explanation
        reasoning = self._generate_reasoning(text_content, classification)
        
        # Calculate trust score
        trust_score = self._calculate_trust_score(classification)
        
        return {
            'trust_score': trust_score,
            'classification': classification,
            'reasoning': reasoning,
            'factors': self._extract_trust_factors(text_content, classification)
        }
    
    def generate_explanation(self, analysis_result: Dict[str, Any]) -> str:
        """Generate human-readable explanation of trust analysis"""
        trust_score = analysis_result.get('trust_score', 0.5)
        factors = analysis_result.get('factors', [])
        
        explanation = f"Trust Analysis Score: {trust_score:.2f}/1.0\n\n"
        
        if trust_score > 0.7:
            explanation += "This content appears trustworthy. "
        elif trust_score > 0.4:
            explanation += "This content has mixed trust indicators. "
        else:
            explanation += "This content shows signs of potential mistrust. "
        
        explanation += f"Key factors identified:\n"
        for factor in factors[:5]:  # Top 5 factors
            explanation += f"- {factor}\n"
        
        return explanation
    
    def detect_propaganda(self, text: str) -> Dict[str, Any]:
        """Detect propaganda techniques in text"""
        propaganda_techniques = [
            "appeal to emotion", "black and white fallacy", "name calling",
            "glittering generalities", "bandwagon", "plain folks",
            "card stacking", "testimonial"
        ]
        
        classification = self.classifier(text, propaganda_techniques)
        
        detected_techniques = []
        for label, score in zip(classification['labels'], classification['scores']):
            if score > 0.3:  # Threshold
                detected_techniques.append({'technique': label, 'confidence': score})
        
        return {
            'propaganda_detected': len(detected_techniques) > 0,
            'techniques': detected_techniques,
            'text': text
        }
    
    def _extract_text_content(self, content: Dict[str, Any]) -> str:
        """Extract text content from multimodal input"""
        if 'text' in content:
            return content['text']
        elif 'transcript' in content:
            return content['transcript']
        elif 'ocr_text' in content:
            return content['ocr_text']
        else:
            return ""
    
    def _generate_reasoning(self, text: str, classification: Dict[str, Any]) -> str:
        """Generate reasoning explanation using LLM"""
        prompt = f"""
Analyze the trustworthiness of this content: "{text[:500]}..."

Classification results: {classification['labels'][:3]} with scores {classification['scores'][:3]}

Provide a brief reasoning for the trust assessment:
"""
        
        try:
            if self.model and self.tokenizer:
                inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
                outputs = self.model.generate(**inputs, max_length=200, num_return_sequences=1)
                reasoning = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                # Remove the prompt from response
                reasoning = reasoning.replace(prompt, "").strip()
            else:
                # Use pipeline
                generated = self.generator(prompt, max_length=200, num_return_sequences=1)
                reasoning = generated[0]['generated_text'].replace(prompt, "").strip()
            
            return reasoning
        except Exception as e:
            logger.error(f"Reasoning generation error: {e}")
            return "Unable to generate detailed reasoning due to model limitations."
    
    def _calculate_trust_score(self, classification: Dict[str, Any]) -> float:
        """Calculate trust score from classification results"""
        trustworthy_labels = ["trustworthy", "factual", "authentic", "neutral"]
        untrustworthy_labels = ["misleading", "propaganda", "biased", "manipulative"]
        
        score = 0.5  # Neutral starting point
        
        for label, conf in zip(classification['labels'], classification['scores']):
            if label in trustworthy_labels:
                score += conf * 0.3
            elif label in untrustworthy_labels:
                score -= conf * 0.3
        
        return max(0.0, min(1.0, score))
    
    def _extract_trust_factors(self, text: str, classification: Dict[str, Any]) -> List[str]:
        """Extract specific trust factors from analysis"""
        factors = []
        
        # Length factor
        if len(text) < 50:
            factors.append("Very short content may lack context")
        elif len(text) > 1000:
            factors.append("Long content may contain mixed information")
        
        # Sentiment factor
        sentiment = self.sentiment_analyzer(text)[0]
        if sentiment['label'] == 'NEGATIVE' and sentiment['score'] > 0.8:
            factors.append("Strong negative sentiment may indicate bias")
        
        # Classification-based factors
        for label, score in zip(classification['labels'][:3], classification['scores'][:3]):
            if score > 0.5:
                factors.append(f"Content classified as '{label}' ({score:.2f})")
        
        return factors