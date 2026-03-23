-- LinkedIn connections per workspace (one Company Page per workspace)
CREATE TABLE public.mimeo_linkedin_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.mimeo_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linkedin_organization_id TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  organization_logo_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ NOT NULL,
  refresh_token_expires_at TIMESTAMPTZ,
  scopes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_workspace_linkedin UNIQUE (workspace_id)
);

CREATE INDEX idx_linkedin_connections_workspace ON public.mimeo_linkedin_connections(workspace_id);
CREATE INDEX idx_linkedin_connections_user ON public.mimeo_linkedin_connections(user_id);

ALTER TABLE public.mimeo_linkedin_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own LinkedIn connections"
  ON public.mimeo_linkedin_connections FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER mimeo_linkedin_connections_updated_at
  BEFORE UPDATE ON public.mimeo_linkedin_connections
  FOR EACH ROW EXECUTE FUNCTION public.mimeo_update_updated_at();
