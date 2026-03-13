-- ============================================================
-- 006: Tone of Voice
-- ============================================================

CREATE TABLE public.mimeo_tone_of_voice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.mimeo_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform_type TEXT NOT NULL DEFAULT 'linkedin',
  description TEXT,
  style_profile JSONB NOT NULL DEFAULT '{}',
  system_prompt_fragment TEXT NOT NULL,
  conversation_history JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mimeo_tov_user_id ON public.mimeo_tone_of_voice(user_id);
CREATE INDEX idx_mimeo_tov_workspace_id ON public.mimeo_tone_of_voice(workspace_id);

ALTER TABLE public.mimeo_tone_of_voice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mimeo_tov_all_own"
  ON public.mimeo_tone_of_voice FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER mimeo_tov_updated_at
  BEFORE UPDATE ON public.mimeo_tone_of_voice
  FOR EACH ROW EXECUTE FUNCTION public.mimeo_update_updated_at();

-- Add tone_of_voice_id FK to agents
ALTER TABLE public.mimeo_agents
  ADD COLUMN tone_of_voice_id UUID REFERENCES public.mimeo_tone_of_voice(id) ON DELETE SET NULL;

CREATE INDEX idx_mimeo_agents_tov_id ON public.mimeo_agents(tone_of_voice_id);
