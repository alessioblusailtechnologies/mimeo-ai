import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();
