import { createClient } from '@supabase/supabase-js';
import { config } from './index.js';

export const supabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);
