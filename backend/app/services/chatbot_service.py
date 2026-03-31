"""Chatbot service for conversational AI assistance"""
import json
import os
import random
import re
from typing import Optional, List
from app.core.config import settings


class ChatbotService:
    """Handle multi-turn conversations with AI assistance about trust analysis"""
    
    def __init__(self):
        self.model = "mixtral-8x7b-32768"  # Groq default
        self.conversation_history = []
        self.system_prompt = """You are TRUST SENSE AI Assistant - a helpful guide for analyzing text credibility and detecting fake news.

You help users understand:
- Credibility indicators
- Red flags in misinformation
- How to verify sources
- Trust scores and risk levels

If the user writes in Arabic, respond in Arabic. Otherwise, respond in the same language as the user.

Be concise, practical, and friendly. Provide actionable insights."""

    def chat_with_groq(self, user_message: str) -> str:
        """Chat using Groq API"""
        # Prefer deterministic rule-based Arabic responses to avoid inconsistent LLM behavior.
        if self._contains_arabic(user_message):
            return self._rule_based_response(user_message)

        if not settings.GROQ_API_KEY:
            return self._rule_based_response(user_message)
        
        try:
            from groq import Groq
            # Clear proxy environment to avoid Docker issues
            import os
            proxy_env = os.environ.pop('http_proxy', None)
            proxy_env_upper = os.environ.pop('HTTP_PROXY', None)
            
            client = Groq(api_key=settings.GROQ_API_KEY)
            
            # Restore proxy if it was set
            if proxy_env:
                os.environ['http_proxy'] = proxy_env
            if proxy_env_upper:
                os.environ['HTTP_PROXY'] = proxy_env_upper
            
            # Build conversation history (include system prompt as first message)
            messages = [{"role": "system", "content": self.system_prompt}]
            messages += [{"role": "user", "content": msg} for msg in self.conversation_history[-10:]]
            messages.append({"role": "user", "content": user_message})
            
            response = client.chat.completions.create(
                model="mixtral-8x7b-instruct-v0.1",
                messages=messages,
                max_tokens=512,
                temperature=0.7,
            )
            
            assistant_message = response.choices[0].message.content
            self.conversation_history.append(user_message)
            self.conversation_history.append(assistant_message)
            
            return assistant_message
        except Exception as e:
            return self._rule_based_response(user_message)
    
    def _contains_arabic(self, text: str) -> bool:
        """Simple check for Arabic characters in text."""
        return bool(re.search(r"[\u0600-\u06FF]", text))

    def _rule_based_response(self, user_message: str) -> str:
        """Intelligent rule-based response with varied outputs"""
        message = user_message.lower()
        is_arabic = self._contains_arabic(user_message)

        if any(word in message for word in ["fake", "misinformation", "disinformation"]):
            responses = [
                "Red flags: extreme claims without sources, emotional language, poor formatting, pressure to share immediately, lack of citations. Use our analysis tool.",
                "Spotting fake: Check source reputation, verify independently, look for author credentials, examine date, see if sensational.",
                "Misinformation tactics: CAPS LOCK, multiple !!!, emotional words, conspiracy themes, no sources. Our AI detects these automatically."
            ]
            arabic_responses = [
                "علامات تحذيرية: ادعاءات متطرفة بدون مصادر، لغة عاطفية، تنسيق ضعيف، ضغط للمشاركة فوراً، غياب المراجع. استخدم أداة التحليل.",
                "لكشف المعلومات المضللة: تحقق من سمعة المصدر، تحقق بشكل مستقل، ابحث عن مصداقية المؤلف، انظر للتاريخ، إذا كان مثيرًا.",
                "أساليب التضليل: استخدام CAPS LOCK، عدة !!!، كلمات عاطفية، نظريات مؤامرة، غياب المصادر. نظامنا يكشف ذلك تلقائيًا."
            ]
            return random.choice(arabic_responses) if is_arabic else random.choice(responses)
        elif any(word in message for word in ["verify", "check", "authentic", "legitimate"]):
            responses = [
                "Steps: 1) Identify source, 2) Check author credentials, 3) Compare with other sources, 4) Check date, 5) Look for citations.",
                "To verify: Who wrote this? When? Where? What's their expertise? Find corroborating evidence. Check for bias.",
                "Quick check: Does it have author info? Citations? Multiple sources confirming it? Was it recently published? Sounds reasonable?"
            ]
            arabic_responses = [
                "خطوات التحقق: 1) حدد المصدر، 2) تحقق من مؤهلات الكاتب، 3) قارن مع مصادر أخرى، 4) راجع التاريخ، 5) ابحث عن المراجع.",
                "للتحقق: من هو الكاتب؟ متى؟ أين؟ ما خبرته؟ ابحث عن أدلة مؤيدة. تحقق من الانحياز.",
                "فحص سريع: هل يحتوي على معلومات المؤلف؟ مراجع؟ مصادر متعددة تؤكد المعلومات؟ هل تم نشره حديثًا؟ هل يبدو معقولًا؟"
            ]
            return random.choice(arabic_responses) if is_arabic else random.choice(responses)
        elif any(word in message for word in ["score", "trust", "credibility", "rating"]):
            responses = [
                "70-100 = LOW risk (safe), 50-70 = MEDIUM (verify), 30-50 = HIGH risk, 0-30 = CRITICAL (avoid). Based on 12+ credibility factors.",
                "Score reflects: source reputation, factual accuracy, emotional tone, citation quality, manipulation signs. Higher = trustworthy.",
                "What lowers it: unverified claims, sensationalism, extreme emotions, no sources, suspicious author. AI analyzes all this."
            ]
            arabic_responses = [
                "70-100 = مخاطر منخفضة (آمن)، 50-70 = متوسط (تحقق)، 30-50 = عالٍ، 0-30 = حرج (تجنب). يعتمد على أكثر من 12 عاملًا للمصداقية.",
                "الدرجة تعكس: سمعة المصدر، دقة الحقائق، النبرة العاطفية، جودة الاقتباسات، علامات التلاعب. كلما ارتفعت كلما كانت أكثر موثوقية.",
                "ما يخفضها: ادعاءات غير موثقة، الإثارة المبالغ فيها، العواطف المتطرفة، غياب المصادر، مؤلف مريب. الذكاء الاصطناعي يحلل كل ذلك."
            ]
            return random.choice(arabic_responses) if is_arabic else random.choice(responses)
        elif any(word in message for word in ["emotion", "sentiment", "feeling", "manipulat"]):
            responses = [
                "6 emotions tracked: Joy, Trust, Fear, Anger, Surprise, Sadness. Fake news pushes FEAR or ANGER to bypass logic.",
                "Manipulation sign: content has ONE extreme emotion, pressures reaction, uses sensationalism. Balanced emotions = trustworthy.",
                "Notice: Do you feel calm or anxious? Logical or emotional? That's manipulation at work. Our system detects emotional intensity."
            ]
            arabic_responses = [
                "نراقب 6 عواطف: الفرح، الثقة، الخوف، الغضب، المفاجأة، الحزن. الأخبار الكاذبة ترفع الخوف أو الغضب لتجاوز التفكير.",
                "علامة التلاعب: المحتوى يحوي عاطفة متطرفة واحدة، يضغط على رد الفعل، يستخدم الإثارة. التوازن العاطفي = موثوق.",
                "لاحظ: هل تشعر بالهدوء أم القلق؟ منطقي أم عاطفي؟ هذا التلاعب يعمل. نظامنا يكشف شدة العاطفة."
            ]
            return random.choice(arabic_responses) if is_arabic else random.choice(responses)
        else:
            responses = [
                "Ask about: misinformation detection, source verification, trust scoring, emotion analysis, or your analysis results.",
                "I can help with credibility questions, red flag spotting, or explaining why content got its trust score.",
                "Curious about fake news, sources, trust scores, or manipulation tactics? I'm here to explain credibility!"
            ]
            arabic_responses = [
                "اسأل عن: كشف المعلومات المضللة، التحقق من المصدر، درجات الثقة، تحليل العواطف، أو نتائج التحليل الخاصة بك.",
                "يمكنني المساعدة في أسئلة الموثوقية، اكتشاف العلامات الحمراء، أو شرح سبب حصول المحتوى على درجة الثقة.",
                "مهتم بالأخبار الكاذبة، المصادر، درجات الثقة، أو أساليب التلاعب؟ أنا هنا لشرح المصداقية!"
            ]
            return random.choice(arabic_responses) if is_arabic else random.choice(responses)
    
    def get_analysis_insights(self, analysis_result: dict) -> str:
        """Generate conversational insights from analysis result"""
        trust_score = analysis_result.get("trust_score", 50)
        risk_level = analysis_result.get("risk_level", "UNKNOWN")
        fake_prob = analysis_result.get("fake_news_probability", 0)
        
        insights = f"This content has a trust score of {trust_score}/100 ({risk_level} risk, {fake_prob*100:.0f}% misinformation probability). "
        
        if trust_score < 35:
            insights += "🚩 This content shows significant warning signs. Be very cautious before sharing."
        elif trust_score < 50:
            insights += "⚠️ Several red flags detected. Verify with other sources before trusting."
        elif trust_score < 70:
            insights += "✓ Moderately credible but has some concerning elements. Cross-check important claims."
        else:
            insights += "✅ Appears credible with low manipulation indicators."
        
        return insights


# Global chatbot instance
chatbot = ChatbotService()


def get_chatbot_response(user_message: str) -> dict:
    """Get response from chatbot"""
    try:
        response = chatbot.chat_with_groq(user_message)
        return {
            "response": response,
            "success": True,
            "model": "groq"
        }
    except Exception as e:
        print(f"❌ Chatbot error: {e}")
        return {
            "response": "Sorry, I encountered an error. Please try again.",
            "success": False,
            "error": str(e)
        }


def analyze_with_multiple_models(text: str) -> dict:
    """Run analysis with multiple LLM models for comparison"""
    results = {}
    
    # Try Claude first
    if settings.ANTHROPIC_API_KEY:
        try:
            from nlp_service import _analyze_with_claude
            results["claude"] = _analyze_with_claude(text)
        except:
            pass
    
    # Try Groq
    if settings.GROQ_API_KEY:
        try:
            from nlp_service import _analyze_with_groq
            results["groq"] = _analyze_with_groq(text)
        except:
            pass
    
    # Try HuggingFace
    if settings.HUGGINGFACE_API_KEY:
        try:
            from nlp_service import _analyze_with_huggingface
            results["huggingface"] = _analyze_with_huggingface(text)
        except:
            pass
    
    return results
