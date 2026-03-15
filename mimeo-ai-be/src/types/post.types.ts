export type PostStatus = 'draft' | 'approved' | 'published';

export interface Post {
  id: string;
  user_id: string;
  workspace_id: string;
  agent_id: string;
  title: string | null;
  content: string;
  original_brief: string;
  status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerateDraftDto {
  agent_id: string;
  brief: string;
  title?: string;
  reference_urls?: string[];
}

export interface UpdatePostDto {
  title?: string;
  content?: string;
}
