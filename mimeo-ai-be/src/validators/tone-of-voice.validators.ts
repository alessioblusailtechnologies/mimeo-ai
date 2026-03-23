import { z } from 'zod';

export const createToneOfVoiceSchema = z.object({
  name: z.string().min(1).max(100),
  platform_type: z.enum(['linkedin', 'blog', 'generic']).optional().default('linkedin'),
  description: z.string().max(500).optional(),
  style_profile: z.record(z.unknown()).optional().default({}),
  system_prompt_fragment: z.string().min(1).max(5000),
  conversation_history: z.array(z.unknown()).optional(),
});

export const updateToneOfVoiceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  platform_type: z.enum(['linkedin', 'blog', 'generic']).optional(),
  description: z.string().max(500).optional(),
  style_profile: z.record(z.unknown()).optional(),
  system_prompt_fragment: z.string().min(1).max(5000).optional(),
  is_active: z.boolean().optional(),
});
