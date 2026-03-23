import { z } from 'zod';

export const exchangeCodeSchema = z.object({
  code: z.string().min(1),
  redirect_uri: z.string().url(),
});

export const selectOrgSchema = z.object({
  organization_id: z.string().min(1),
  organization_name: z.string().min(1).max(200),
  organization_logo_url: z.string().url().optional(),
});
