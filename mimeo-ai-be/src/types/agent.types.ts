export type AgentTone = 'professional' | 'creative' | 'technical' | 'casual' | 'inspirational' | 'educational';
export type AiProvider = 'claude' | 'openai';
export type AgentSourceType = 'url' | 'file';
export type PlatformType = 'linkedin' | 'twitter' | 'blog' | 'generic';

export interface AgentSource {
  type: AgentSourceType;
  value: string;
  label?: string;
}

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
  platform_type: PlatformType;
  versions_count: number;
  is_active: boolean;
  schedule_enabled: boolean;
  schedule_cron: string | null;
  schedule_brief: string | null;
  sources: AgentSource[];
  image_generation_enabled: boolean;
  image_prompt: string | null;
  image_count: number;
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
  platform_type?: PlatformType;
  versions_count?: number;
  schedule_enabled?: boolean;
  schedule_cron?: string;
  schedule_brief?: string;
  sources?: AgentSource[];
  image_generation_enabled?: boolean;
  image_prompt?: string;
  image_count?: number;
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
  platform_type?: PlatformType;
  versions_count?: number;
  is_active?: boolean;
  schedule_enabled?: boolean;
  schedule_cron?: string;
  schedule_brief?: string;
  sources?: AgentSource[];
  image_generation_enabled?: boolean;
  image_prompt?: string;
  image_count?: number;
}
