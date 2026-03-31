-- ============================================================================
-- TRUST SENSE - SUPABASE DATABASE SETUP
-- ============================================================================
-- Run these SQL commands in your Supabase SQL Editor to set up the database
-- Created: 2026-03-02
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. ENABLE EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- 2. CREATE USERS TABLE (Extends Supabase Auth)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'analyst' CHECK (role IN ('analyst', 'admin', 'moderator')),
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. CREATE ANALYSES TABLE
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Input Content
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'audio', 'video', 'image', 'multimodal')),
  text_input TEXT,
  audio_file_url TEXT,
  video_file_url TEXT,
  image_file_url TEXT,
  
  -- Text Analysis
  trust_score FLOAT DEFAULT NULL CHECK (trust_score >= 0 AND trust_score <= 100),
  sentiment TEXT DEFAULT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  credibility_score FLOAT DEFAULT NULL CHECK (credibility_score >= 0 AND credibility_score <= 100),
  risk_level TEXT DEFAULT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  emotions_json JSONB,
  signals_json JSONB,
  summary TEXT,
  
  -- Audio Analysis
  speech_transcript TEXT,
  voice_emotion TEXT,
  voice_emotion_score FLOAT,
  
  -- Video Analysis
  deepfake_probability FLOAT CHECK (deepfake_probability >= 0 AND deepfake_probability <= 1),
  facial_emotions_json JSONB,
  
  -- Image Analysis
  image_text_ocr TEXT,
  image_description TEXT,
  image_analysis_json JSONB,
  
  -- Integration Status
  powerbi_synced INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days')
);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. CREATE HISTORY TABLE (For audit trail)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'exported')),
  previous_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. CREATE INSIGHTS TABLE (Aggregated analysis results)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('trend', 'alert', 'pattern', 'summary')),
  data_json JSONB,
  severity TEXT DEFAULT 'normal' CHECK (severity IN ('low', 'normal', 'high', 'critical')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 6. CREATE SETTINGS TABLE (User preferences)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  language TEXT DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_on_alerts BOOLEAN DEFAULT TRUE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_risk_level ON public.analyses(risk_level);
CREATE INDEX IF NOT EXISTS idx_analyses_content_type ON public.analyses(content_type);
CREATE INDEX IF NOT EXISTS idx_history_analysis_id ON public.analysis_history(analysis_id);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON public.analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON public.insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_severity ON public.insights(severity);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ─────────────────────────────────────────────────────────────────────────
-- 8. CREATE ROW LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can read own analyses
CREATE POLICY "Users can read own analyses" ON public.analyses
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create analyses
CREATE POLICY "Users can create analyses" ON public.analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own analyses
CREATE POLICY "Users can update own analyses" ON public.analyses
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete own analyses
CREATE POLICY "Users can delete own analyses" ON public.analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Users can read own history
CREATE POLICY "Users can read own history" ON public.analysis_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read own insights
CREATE POLICY "Users can read own insights" ON public.insights
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage own settings
CREATE POLICY "Users can manage own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 9. CREATE TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ─────────────────────────────────────────────────────────────────────────

-- Trigger for users.updated_at
CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_update_timestamp
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_timestamp();

-- Trigger for analyses.updated_at
CREATE OR REPLACE FUNCTION update_analyses_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analyses_update_timestamp
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_analyses_timestamp();

-- Trigger for insights.updated_at
CREATE OR REPLACE FUNCTION update_insights_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER insights_update_timestamp
  BEFORE UPDATE ON public.insights
  FOR EACH ROW
  EXECUTE FUNCTION update_insights_timestamp();

-- Trigger for user_settings.updated_at
CREATE OR REPLACE FUNCTION update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_update_timestamp
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_timestamp();

-- ─────────────────────────────────────────────────────────────────────────
-- 10. CREATE FUNCTION TO HANDLE NEW USER SIGNUP
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.user_metadata->>'username', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────
-- 11. CREATE MATERIALIZED VIEW FOR USER STATISTICS
-- ─────────────────────────────────────────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS user_statistics AS
SELECT
  u.id,
  u.username,
  COUNT(a.id) as total_analyses,
  COUNT(CASE WHEN a.content_type = 'text' THEN 1 END) as text_analyses,
  COUNT(CASE WHEN a.content_type = 'audio' THEN 1 END) as audio_analyses,
  COUNT(CASE WHEN a.content_type = 'video' THEN 1 END) as video_analyses,
  COUNT(CASE WHEN a.content_type = 'image' THEN 1 END) as image_analyses,
  AVG(a.trust_score) as avg_trust_score,
  MAX(a.created_at) as last_analysis_date
FROM public.users u
LEFT JOIN public.analyses a ON u.id = a.user_id
GROUP BY u.id, u.username;

-- Index for the materialized view
CREATE UNIQUE INDEX idx_user_statistics_id ON user_statistics(id);

-- ─────────────────────────────────────────────────────────────────────────
-- 12. SETUP GOOGLE OAUTH (Backend Configuration)
-- ─────────────────────────────────────────────────────────────────────────
-- Steps to enable Google OAuth in Supabase:
-- 1. Go to Supabase Dashboard → Authentication → Providers
-- 2. Enable "Google"
-- 3. Add Google OAuth Client ID and Secret (from Google Cloud Console)
-- 4. Set Authorized redirect URIs:
--    - https://your-project.supabase.co/auth/v1/callback
--    - http://localhost:5173 (for local development)
--    - https://yourdomain.com (for production)

-- ─────────────────────────────────────────────────────────────────────────
-- 13. GRANT PROPER PERMISSIONS
-- ─────────────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- SUMMARY OF TABLES CREATED:
-- ============================================================================
--
-- 1. users: Extended user profiles (id, email, username, role, etc.)
-- 2. analyses: Main analysis records with multimodal fields
-- 3. analysis_history: Audit trail for changes
-- 4. insights: Aggregated findings and trends
-- 5. user_settings: User preferences and configurations
--
-- All tables have:
-- - UUID primary keys
-- - Automatic timestamps (created_at, updated_at)
-- - Row Level Security (RLS) enabled
-- - Proper foreign key relationships with CASCADE delete
-- - Performance indexes
--
-- ============================================================================
-- NEXT STEPS:
-- ============================================================================
--
-- 1. Copy and paste this SQL into Supabase SQL Editor and run it
-- 2. Enable Google OAuth in Supabase Authentication settings
-- 3. Update frontend/.env.local with your Supabase credentials:
--    VITE_SUPABASE_URL=https://your-project.supabase.co
--    VITE_SUPABASE_ANON_KEY=your-anon-key
-- 4. Install @supabase/supabase-js: npm install @supabase/supabase-js
-- 5. Restart frontend and test authentication
--
-- ============================================================================
