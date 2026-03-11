export interface Generation {
  id: string;
  post_id: string;
  user_id: string;
  agent_id: string;
  content: string;
  ai_provider: string;
  ai_model: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  generation_time_ms: number | null;
  is_selected: boolean;
  created_at: string;
}
