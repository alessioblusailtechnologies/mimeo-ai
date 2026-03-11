CREATE TYPE post_status AS ENUM ('draft', 'approved', 'published');

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT NOT NULL,
  original_brief TEXT NOT NULL,
  status post_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_agent_id ON public.posts(agent_id);
CREATE INDEX idx_posts_status ON public.posts(status);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own posts"
  ON public.posts FOR ALL
  USING (auth.uid() = user_id);
