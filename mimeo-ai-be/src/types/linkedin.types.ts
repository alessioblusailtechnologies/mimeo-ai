export interface LinkedInConnection {
  id: string;
  workspace_id: string;
  user_id: string;
  linkedin_organization_id: string;
  organization_name: string;
  organization_logo_url: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string;
  refresh_token_expires_at: string | null;
  scopes: string;
  created_at: string;
  updated_at: string;
}

export interface LinkedInConnectionInfo {
  id: string;
  workspace_id: string;
  linkedin_organization_id: string;
  organization_name: string;
  organization_logo_url: string | null;
  token_expires_at: string;
  is_token_valid: boolean;
  connected_at: string;
}

export interface LinkedInOrganization {
  id: string;
  name: string;
  logo_url: string | null;
}
