import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  full_name: z.string().min(1).max(200).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  avatar_url: z.string().url().optional(),
  linkedin_profile_url: z.string().url().optional(),
});
