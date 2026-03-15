import { z } from 'zod';

const agentSourceSchema = z.object({
  type: z.enum(['url', 'file']),
  value: z.string().min(1).max(2000),
  label: z.string().max(200).optional(),
});

export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  tone: z.enum(['professional', 'creative', 'technical', 'casual', 'inspirational', 'educational']),
  tone_of_voice_id: z.string().uuid().nullable().optional(),
  target_audience: z.string().max(500).optional(),
  writing_style_guidelines: z.string().max(2000).optional(),
  custom_system_prompt: z.string().max(5000).optional(),
  ai_provider: z.enum(['claude', 'openai']),
  ai_model: z.string().min(1).max(100),
  schedule_enabled: z.boolean().optional(),
  schedule_cron: z.string().max(100).optional(),
  schedule_brief: z.string().max(5000).optional(),
  sources: z.array(agentSourceSchema).max(20).optional(),
});

export const updateAgentSchema = createAgentSchema.partial();
