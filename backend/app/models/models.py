from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Date, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# ===== MULTI-TENANCY MODELS =====

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tier = Column(String, default="free")  # free, pro, enterprise
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    members = relationship("OrganizationMember", back_populates="organization", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="organization")

class OrganizationMember(Base):
    __tablename__ = "organization_members"
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, default="member")  # owner, admin, member
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    organization = relationship("Organization", back_populates="members")
    user = relationship("User", back_populates="memberships")

# ===== USER MODEL =====

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="analyst")  # analyst, admin, user
    subscription_tier = Column(String, default="free")  # free, pro, enterprise (deprecated in favor of org.tier)
    language = Column(String, default="en")  # user UI language preference
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    analyses = relationship("Analysis", back_populates="user")
    usage_logs = relationship("UsageLog", back_populates="user")
    memberships = relationship("OrganizationMember", back_populates="user", cascade="all, delete-orphan")

class Analysis(Base):
    __tablename__ = "analyses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    input_type = Column(String, default="text")
    raw_input = Column(Text)
    trust_score = Column(Float)
    sentiment = Column(Float)
    fake_news_probability = Column(Float)
    manipulation_score = Column(Float)
    credibility = Column(Float)
    emotional_stability = Column(Float)
    linguistic_neutrality = Column(Float)
    content_reliability = Column(Float)
    dominant_emotion = Column(String)
    risk_level = Column(String)
    emotions_json = Column(JSON)
    signals_json = Column(JSON)
    summary = Column(Text)
    # Audio/Video fields
    speech_transcript = Column(Text, nullable=True)
    voice_emotion = Column(String, nullable=True)
    voice_emotion_score = Column(Float, nullable=True)
    deepfake_probability = Column(Float, nullable=True)
    facial_emotions_json = Column(JSON, nullable=True)
    # Image analysis fields
    image_text_ocr = Column(Text, nullable=True)
    image_description = Column(Text, nullable=True)
    image_analysis_json = Column(JSON, nullable=True)
# Psychological analysis fields
    aggression_score = Column(Float, nullable=True)
    deception_score = Column(Float, nullable=True)
    cognitive_bias_score = Column(Float, nullable=True)
    persuasion_score = Column(Float, nullable=True)
    psychological_json = Column(JSON, nullable=True)
    # Social media fields
    source_platform = Column(String, nullable=True)  # twitter, instagram, youtube, tiktok, etc.
    source_id = Column(String, nullable=True)  # tweet_id, post_id, video_id, etc.
    analysis_type = Column(String, default="general")  # general, social_media, news, audio, video, image
    # Data format
    powerbi_synced = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="analyses")
    organization = relationship("Organization", back_populates="analyses")


class NewsArticle(Base):
    __tablename__ = "news_articles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=True)
    source = Column(String, nullable=True)
    language = Column(String, default="en")
    published_at = Column(DateTime, nullable=True)
    url = Column(String, nullable=True)
    trust_score = Column(Float, nullable=True)
    analysis_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    scripts = relationship("NewsScript", back_populates="article", cascade="all, delete-orphan")


class NewsScript(Base):
    __tablename__ = "news_scripts"
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("news_articles.id"), nullable=False)
    language = Column(String, default="en")
    script = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    article = relationship("NewsArticle", back_populates="scripts")
    videos = relationship("NewsVideo", back_populates="script", cascade="all, delete-orphan")


class NewsVideo(Base):
    __tablename__ = "news_videos"
    id = Column(Integer, primary_key=True, index=True)
    script_id = Column(Integer, ForeignKey("news_scripts.id"), nullable=False)
    video_url = Column(String, nullable=True)
    local_path = Column(String, nullable=True)
    status = Column(String, default="created")
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    script = relationship("NewsScript", back_populates="videos")
    publications = relationship("PublicationRecord", back_populates="video", cascade="all, delete-orphan")


class PublicationRecord(Base):
    __tablename__ = "publication_records"
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("news_videos.id"), nullable=False)
    platform = Column(String, nullable=False)
    status = Column(String, default="pending")
    publish_url = Column(String, nullable=True)
    response_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    video = relationship("NewsVideo", back_populates="publications")


class UsageLog(Base):
    __tablename__ = "usage_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    analysis_date = Column(Date, default=func.now())
    analysis_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="usage_logs")
