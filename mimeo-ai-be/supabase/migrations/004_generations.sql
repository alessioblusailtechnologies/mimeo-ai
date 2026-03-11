CREATE TABLE public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  ai_provider TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  generation_time_ms INTEGER,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_generations_post_id ON public.generations(post_id);

ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generations"
  ON public.generations FOR ALL
  USING (auth.uid() = user_id);
