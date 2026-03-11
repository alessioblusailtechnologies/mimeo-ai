export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkspaceDto {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceDto {
  name?: string;
  description?: string;
}
