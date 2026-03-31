from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime

# ===== ORGANIZATION SCHEMAS =====

class OrganizationCreate(BaseModel):
    name: str
    slug: str

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    tier: Optional[str] = None

class OrganizationMemberOut(BaseModel):
    id: int
    user_id: int
    role: str
    joined_at: datetime
    model_config = {"from_attributes": True}

class OrganizationOut(BaseModel):
    id: int
    name: str
    slug: str
    owner_id: int
    tier: str
    is_active: bool
    created_at: datetime
    members: List[OrganizationMemberOut]
    model_config = {"from_attributes": True}

class AddMemberRequest(BaseModel):
    email: str
    role: str = "member"  # member, admin

# ===== USER SCHEMAS =====

class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    role: Optional[str] = "analyst"
    subscription_tier: Optional[str] = "free"

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    username: str
    role: str
    subscription_tier: str
    language: Optional[str] = "en"
    is_active: int
    created_at: datetime
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class TextAnalysisRequest(BaseModel):
    text: str


class AnalysisCreate(BaseModel):
    text: str
    source_platform: Optional[str] = None
    source_id: Optional[str] = None
    analysis_type: Optional[str] = "general"


class BatchTextAnalysisRequest(BaseModel):
    texts: List[str]  # max 10 items, each max 10000 chars

class AnalysisResult(BaseModel):
    id: Optional[int] = None
    input_type: str = "text"
    raw_input: Optional[str] = None
    trust_score: float
    sentiment: float
    fake_news_probability: float
    manipulation_score: float
    credibility: float
    emotional_stability: float
    linguistic_neutrality: float
    content_reliability: float
    dominant_emotion: str
    risk_level: str
    emotions: Dict[str, float]
    signals: List[str]
    summary: str
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class AnalysisHistoryItem(BaseModel):
    id: int
    input_type: str
    raw_input: Optional[str] = None
    trust_score: float
    sentiment: float
    fake_news_probability: float
    dominant_emotion: Optional[str] = None
    risk_level: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}

# ─── PSYCHOLOGICAL ANALYSIS ───
class PsychologicalAnalysis(BaseModel):
    aggression_score: float  # 0-100: Level of aggressive language/intent
    deception_score: float  # 0-100: Likelihood of deceptive content
    cognitive_bias_score: float  # 0-100: Presence of cognitive biases
    persuasion_score: float  # 0-100: Persuasive/manipulative techniques
    model_config = {"from_attributes": True}


# ─── SOCIAL MEDIA IMPORT ───
class SocialMediaImportRequest(BaseModel):
    source: str  # facebook, instagram, twitter, telegram, whatsapp, tiktok, youtube
    content: str
    url: Optional[str] = None
    metadata: Optional[Dict] = None


class UsageStats(BaseModel):
    daily_analyses: int
    daily_limit: int
    remaining_analyses: int
    subscription_tier: str
    reset_time: str