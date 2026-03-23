export interface PostImage {
  id: string;
  post_id: string;
  user_id: string;
  prompt: string;
  storage_path: string;
  public_url: string;
  ai_model: string;
  generation_time_ms: number | null;
  created_at: string;
}
