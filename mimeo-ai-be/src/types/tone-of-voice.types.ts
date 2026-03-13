export interface ToneOfVoice {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  platform_type: string;
  description: string | null;
  style_profile: Record<string, unknown>;
  system_prompt_fragment: string;
  example_posts: string[];
  conversation_history: unknown[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateToneOfVoiceDto {
  name: string;
  platform_type?: string;
  description?: string;
  style_profile: Record<string, unknown>;
  system_prompt_fragment: string;
  example_posts?: string[];
  conversation_history?: unknown[];
}

export interface UpdateToneOfVoiceDto {
  name?: string;
  platform_type?: string;
  description?: string;
  style_profile?: Record<string, unknown>;
  system_prompt_fragment?: string;
  is_active?: boolean;
}

export interface TovChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TovChatRequest {
  message: string;
  history: TovChatMessage[];
  platform_type: string;
}

export interface TovChatResponse {
  message: string;
  done: boolean;
  result?: {
    toneOfVoice: { id: string; name: string; description: string | null };
  };
}
