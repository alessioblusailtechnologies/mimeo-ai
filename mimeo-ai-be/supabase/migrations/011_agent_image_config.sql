-- Add image generation configuration to agents
ALTER TABLE public.mimeo_agents
  ADD COLUMN image_generation_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN image_prompt TEXT,
  ADD COLUMN image_count INTEGER NOT NULL DEFAULT 1 CHECK (image_count >= 1 AND image_count <= 4);
