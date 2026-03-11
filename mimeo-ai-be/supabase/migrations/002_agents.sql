CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'professional',
  target_audience TEXT,
  writing_style_guidelines TEXT,
  custom_system_prompt TEXT,
  ai_provider TEXT NOT NULL CHECK (ai_provider IN ('claude', 'openai')),
  ai_model TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agents_user_id ON public.agents(user_id);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own agents"
  ON public.agents FOR ALL
  USING (auth.uid() = user_id);
