export type AgentTone = 'professional' | 'creative' | 'technical' | 'casual' | 'inspirational' | 'educational';
export type AiProvider = 'claude' | 'openai';

export interface Agent {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  tone: AgentTone;
  tone_of_voice_id: string | null;
  target_audience: string | null;
  writing_style_guidelines: string | null;
  custom_system_prompt: string | null;
  ai_provider: AiProvider;
  ai_model: string;
  is_active: boolean;
  schedule_enabled: boolean;
  schedule_cron: string | null;
  schedule_brief: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentDto {
  name: string;
  tone: AgentTone;
  tone_of_voice_id?: string | null;
  target_audience?: string;
  writing_style_guidelines?: string;
  custom_system_prompt?: string;
  ai_provider: AiProvider;
  ai_model: string;
  schedule_enabled?: boolean;
  schedule_cron?: string;
  schedule_brief?: string;
}

export interface UpdateAgentDto {
  name?: string;
  tone?: AgentTone;
  tone_of_voice_id?: string | null;
  target_audience?: string;
  writing_style_guidelines?: string;
  custom_system_prompt?: string;
  ai_provider?: AiProvider;
  ai_model?: string;
  is_active?: boolean;
  schedule_enabled?: boolean;
  schedule_cron?: string;
  schedule_brief?: string;
}
