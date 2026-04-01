export interface PostCarousel {
  id: string;
  post_id: string;
  user_id: string;
  storage_path: string;
  public_url: string;
  slides_count: number;
  ai_model: string;
  generation_time_ms: number | null;
  created_at: string;
}
