-- Add sources JSONB column to mimeo_agents
-- Stores an array of source objects: [{ type: 'url'|'file', value: string, label?: string }]
ALTER TABLE public.mimeo_agents
  ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.mimeo_agents.sources IS 'JSON array of knowledge sources (URLs, files) used by the agent for content generation';
