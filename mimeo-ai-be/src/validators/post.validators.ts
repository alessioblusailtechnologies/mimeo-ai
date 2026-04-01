import { z } from 'zod';

export const generateDraftSchema = z.object({
  agent_id: z.string().uuid(),
  brief: z.string().min(1).max(5000),
  title: z.string().max(200).optional(),
  reference_urls: z.array(z.string().url()).max(5).optional(),
});

export const updatePostSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(20000).optional(),
});
