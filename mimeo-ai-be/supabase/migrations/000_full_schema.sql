-- ============================================================
-- Mimeo AI - Full Database Schema
-- Run this script in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 0. CLEAN UP (drop old objects if they exist)
-- ============================================================

-- Drop trigger on auth.users (always exists)
DROP TRIGGER IF EXISTS mimeo_on_auth_user_created ON auth.users;

-- Drop tables with CASCADE (also removes their triggers, indexes, policies)
DROP TABLE IF EXISTS public.mimeo_generations CASCADE;
DROP TABLE IF EXISTS public.mimeo_posts CASCADE;
DROP TABLE IF EXISTS public.mimeo_agents CASCADE;
DROP TABLE IF EXISTS public.mimeo_workspaces CASCADE;
DROP TABLE IF EXISTS public.mimeo_profiles CASCADE;

-- Drop enum type
DROP TYPE IF EXISTS mimeo_post_status;

-- Drop functions
DROP FUNCTION IF EXISTS public.mimeo_update_updated_at();
DROP FUNCTION IF EXISTS public.mimeo_handle_new_user();

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

CREATE TYPE mimeo_post_status AS ENUM ('draft', 'approved', 'published');

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE public.mimeo_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  linkedin_profile_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workspaces (organizational containers)
CREATE TABLE public.mimeo_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agents (configurable AI writing agents, belong to a workspace)
CREATE TABLE public.mimeo_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.mimeo_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'professional',
  target_audience TEXT,
  writing_style_guidelines TEXT,
  custom_system_prompt TEXT,
  ai_provider TEXT NOT NULL CHECK (ai_provider IN ('claude', 'openai')),
  ai_model TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  schedule_enabled BOOLEAN NOT NULL DEFAULT false,
  schedule_cron TEXT,
  schedule_brief TEXT,
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Posts (LinkedIn post drafts, belong to a workspace)
CREATE TABLE public.mimeo_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.mimeo_workspaces(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.mimeo_agents(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT NOT NULL,
  original_brief TEXT NOT NULL,
  status mimeo_post_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generations (AI generation history per post)
CREATE TABLE public.mimeo_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.mimeo_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.mimeo_agents(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  ai_provider TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  generation_time_ms INTEGER,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX idx_mimeo_workspaces_user_id ON public.mimeo_workspaces(user_id);

CREATE INDEX idx_mimeo_agents_user_id ON public.mimeo_agents(user_id);
CREATE INDEX idx_mimeo_agents_workspace_id ON public.mimeo_agents(workspace_id);

CREATE INDEX idx_mimeo_posts_user_id ON public.mimeo_posts(user_id);
CREATE INDEX idx_mimeo_posts_workspace_id ON public.mimeo_posts(workspace_id);
CREATE INDEX idx_mimeo_posts_agent_id ON public.mimeo_posts(agent_id);
CREATE INDEX idx_mimeo_posts_status ON public.mimeo_posts(status);

CREATE INDEX idx_mimeo_generations_post_id ON public.mimeo_generations(post_id);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.mimeo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mimeo_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mimeo_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mimeo_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mimeo_generations ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "mimeo_profiles_select_own"
  ON public.mimeo_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "mimeo_profiles_update_own"
  ON public.mimeo_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Workspaces
CREATE POLICY "mimeo_workspaces_all_own"
  ON public.mimeo_workspaces FOR ALL
  USING (auth.uid() = user_id);

-- Agents
CREATE POLICY "mimeo_agents_all_own"
  ON public.mimeo_agents FOR ALL
  USING (auth.uid() = user_id);

-- Posts
CREATE POLICY "mimeo_posts_all_own"
  ON public.mimeo_posts FOR ALL
  USING (auth.uid() = user_id);

-- Generations
CREATE POLICY "mimeo_generations_all_own"
  ON public.mimeo_generations FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION public.mimeo_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mimeo_profiles_updated_at
  BEFORE UPDATE ON public.mimeo_profiles
  FOR EACH ROW EXECUTE FUNCTION public.mimeo_update_updated_at();

CREATE TRIGGER mimeo_workspaces_updated_at
  BEFORE UPDATE ON public.mimeo_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.mimeo_update_updated_at();

CREATE TRIGGER mimeo_agents_updated_at
  BEFORE UPDATE ON public.mimeo_agents
  FOR EACH ROW EXECUTE FUNCTION public.mimeo_update_updated_at();

CREATE TRIGGER mimeo_posts_updated_at
  BEFORE UPDATE ON public.mimeo_posts
  FOR EACH ROW EXECUTE FUNCTION public.mimeo_update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.mimeo_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.mimeo_profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER mimeo_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.mimeo_handle_new_user();
