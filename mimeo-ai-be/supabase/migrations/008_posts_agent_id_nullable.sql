-- ============================================================
-- 008: Cascade delete posts and generations when agent is deleted
-- ============================================================

-- Posts: drop existing FK and recreate with ON DELETE CASCADE
ALTER TABLE public.mimeo_posts
  DROP CONSTRAINT mimeo_posts_agent_id_fkey;

ALTER TABLE public.mimeo_posts
  ADD CONSTRAINT mimeo_posts_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES public.mimeo_agents(id) ON DELETE CASCADE;

-- Generations: drop existing FK and recreate with ON DELETE CASCADE
ALTER TABLE public.mimeo_generations
  DROP CONSTRAINT mimeo_generations_agent_id_fkey;

ALTER TABLE public.mimeo_generations
  ADD CONSTRAINT mimeo_generations_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES public.mimeo_agents(id) ON DELETE CASCADE;
