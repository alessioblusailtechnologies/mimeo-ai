-- Add sources JSONB column to mimeo_agents
-- Stores an array of source objects: [{ type: 'url'|'file', value: string, label?: string }]
ALTER TABLE public.mimeo_agents
  ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.mimeo_agents.sources IS 'JSON array of knowledge sources (URLs, files) used by the agent for content generation';

-- Move platform_type from tone_of_voice to agent
-- The channel/platform is now an agent-level concept (a ToV can be reused across platforms)
ALTER TABLE public.mimeo_agents
  ADD COLUMN IF NOT EXISTS platform_type TEXT NOT NULL DEFAULT 'linkedin'
  CHECK (platform_type IN ('linkedin', 'twitter', 'blog', 'generic'));

-- Number of content versions to generate (A/B testing, 1-3)
ALTER TABLE public.mimeo_agents
  ADD COLUMN IF NOT EXISTS versions_count INTEGER NOT NULL DEFAULT 1
  CHECK (versions_count >= 1 AND versions_count <= 3);
