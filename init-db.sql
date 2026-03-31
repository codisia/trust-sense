-- Trust Sense PostgreSQL Database Initialization
-- This script creates all necessary tables for the application

-- ===== EXTENSIONS =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== ORGANIZATIONS TABLE =====
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    owner_id INTEGER NOT NULL,
    tier VARCHAR(50) DEFAULT 'free',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== ORGANIZATION MEMBERS TABLE =====
CREATE TABLE IF NOT EXISTS organization_members (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    user_id INTEGER NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    UNIQUE(organization_id, user_id)
);

-- ===== USERS TABLE =====
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'analyst',
    subscription_tier VARCHAR(50) DEFAULT 'free',
    language VARCHAR(50) DEFAULT 'en',
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== ANALYSES TABLE =====
CREATE TABLE IF NOT EXISTS analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    input_type VARCHAR(50) DEFAULT 'text',
    raw_input TEXT,
    trust_score REAL,
    sentiment REAL,
    fake_news_probability REAL,
    manipulation_score REAL,
    credibility REAL,
    emotional_stability REAL,
    linguistic_neutrality REAL,
    content_reliability REAL,
    dominant_emotion VARCHAR(50),
    risk_level VARCHAR(50),
    emotions_json JSONB,
    signals_json JSONB,
    summary TEXT,
    speech_transcript TEXT,
    voice_emotion VARCHAR(50),
    voice_emotion_score REAL,
    deepfake_probability REAL,
    facial_emotions_json JSONB,
    image_text_ocr TEXT,
    image_description TEXT,
    image_analysis_json JSONB,
    aggression_score REAL,
    deception_score REAL,
    cognitive_bias_score REAL,
    persuasion_score REAL,
    psychological_json JSONB,
    source_platform VARCHAR(50),
    source_id VARCHAR(255),
    analysis_type VARCHAR(50) DEFAULT 'general',
    powerbi_synced INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== USAGE LOGS TABLE =====
CREATE TABLE IF NOT EXISTS usage_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    analysis_date DATE DEFAULT CURRENT_DATE,
    analysis_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== NEWS ARTICLES TABLE =====
CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    source VARCHAR(255),
    language VARCHAR(10) DEFAULT 'en',
    published_at TIMESTAMP WITH TIME ZONE,
    url VARCHAR(1000),
    trust_score REAL,
    analysis_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== NEWS SCRIPTS TABLE =====
CREATE TABLE IF NOT EXISTS news_scripts (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
    language VARCHAR(10) DEFAULT 'en',
    script TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== NEWS VIDEOS TABLE =====
CREATE TABLE IF NOT EXISTS news_videos (
    id SERIAL PRIMARY KEY,
    script_id INTEGER NOT NULL REFERENCES news_scripts(id) ON DELETE CASCADE,
    video_url VARCHAR(1000),
    local_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'created',
    metadata_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== PUBLICATION RECORDS TABLE =====
CREATE TABLE IF NOT EXISTS publication_records (
    id SERIAL PRIMARY KEY,
    video_id INTEGER NOT NULL REFERENCES news_videos(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    publish_url VARCHAR(1000),
    response_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== INDEXES =====
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_organization_id ON analyses(organization_id);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_news_articles_title ON news_articles(title);
CREATE INDEX idx_news_articles_source ON news_articles(source);
CREATE INDEX idx_news_scripts_article_id ON news_scripts(article_id);
CREATE INDEX idx_news_videos_script_id ON news_videos(script_id);
CREATE INDEX idx_publication_records_video_id ON publication_records(video_id);

CREATE INDEX idx_org_member_org ON organization_member(organization_id);
CREATE INDEX idx_org_member_user ON organization_member(user_id);

-- ===== ANALYSIS TABLE (For Trust Scores & Sentiment) =====
CREATE TABLE IF NOT EXISTS analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    organization_id UUID,
    content TEXT NOT NULL,
    trust_score DECIMAL(5,2) CHECK (trust_score >= 0 AND trust_score <= 100),
    credibility_score DECIMAL(5,2) CHECK (credibility_score >= 0 AND credibility_score <= 100),
    sentiment_score DECIMAL(5,3) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    sentiment_label VARCHAR(50) CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
    dominant_emotion VARCHAR(50),
    risk_level VARCHAR(50) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    analysis_type VARCHAR(50) DEFAULT 'general' CHECK (analysis_type IN ('general', 'social_media', 'news', 'audio', 'video', 'image')),
    source_platform VARCHAR(100),
    source_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT fk_org FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE SET NULL
);

CREATE INDEX idx_analysis_user ON analysis(user_id);
CREATE INDEX idx_analysis_org ON analysis(organization_id);
CREATE INDEX idx_analysis_created ON analysis(created_at);
CREATE INDEX idx_analysis_risk ON analysis(risk_level);
CREATE INDEX idx_analysis_platform ON analysis(source_platform);

-- ===== INSERT SAMPLE DATA FOR POWER BI =====
-- Sample user (admin)
INSERT INTO "user" (email, hashed_password, full_name, role, is_active)
VALUES (
    'admin@trustsense.com',
    'hashed_password_placeholder',
    'Admin User',
    'admin',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Sample organization
INSERT INTO organization (name, description, owner_id)
SELECT id, 'Default Organization', id
FROM "user"
WHERE email = 'admin@trustsense.com'
ON CONFLICT DO NOTHING;

-- Sample analysis data for Power BI
INSERT INTO analysis (user_id, content, trust_score, credibility_score, sentiment_score, sentiment_label, dominant_emotion, risk_level, source_platform, source_id, analysis_type)
SELECT 
    u.id,
    'Sample analysis content for dashboard testing',
    FLOOR(RANDOM() * 100)::DECIMAL,
    FLOOR(RANDOM() * 100)::DECIMAL,
    (RANDOM() * 2 - 1)::DECIMAL,
    CASE WHEN RANDOM() < 0.33 THEN 'positive' WHEN RANDOM() < 0.66 THEN 'neutral' ELSE 'negative' END,
    CASE FLOOR(RANDOM() * 5)::INT
        WHEN 0 THEN 'joy'
        WHEN 1 THEN 'sadness'
        WHEN 2 THEN 'anger'
        WHEN 3 THEN 'fear'
        ELSE 'surprise'
    END,
    CASE FLOOR(RANDOM() * 4)::INT
        WHEN 0 THEN 'LOW'
        WHEN 1 THEN 'MEDIUM'
        WHEN 2 THEN 'HIGH'
        ELSE 'CRITICAL'
    END,
    CASE FLOOR(RANDOM() * 4)::INT
        WHEN 0 THEN 'twitter'
        WHEN 1 THEN 'instagram'
        WHEN 2 THEN 'youtube'
        ELSE 'tiktok'
    END,
    'post_' || GENERATE_SERIES(1, 15),
    CASE FLOOR(RANDOM() * 5)::INT
        WHEN 0 THEN 'general'
        WHEN 1 THEN 'social_media'
        WHEN 2 THEN 'news'
        WHEN 3 THEN 'audio'
        ELSE 'video'
    END
FROM "user" u
WHERE email = 'admin@trustsense.com'
ON CONFLICT DO NOTHING;

-- ===== Grant Permissions =====
GRANT CONNECT ON DATABASE trustsense TO trustsense;
GRANT USAGE ON SCHEMA public TO trustsense;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO trustsense;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO trustsense;

-- ===== Refresh Schema =====
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO trustsense;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO trustsense;
