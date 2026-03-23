import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/api-error.js';
import type { LinkedInConnection } from '../types/linkedin.types.js';

const TABLE = 'mimeo_linkedin_connections';

export async function findByWorkspaceId(workspaceId: string, userId: string): Promise<LinkedInConnection | null> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as LinkedInConnection | null;
}

export async function upsert(
  connection: Omit<LinkedInConnection, 'id' | 'created_at' | 'updated_at'>
): Promise<LinkedInConnection> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .upsert(connection, { onConflict: 'workspace_id' })
    .select()
    .single();

  if (error) throw error;
  return data as LinkedInConnection;
}

export async function updateTokens(
  workspaceId: string,
  userId: string,
  tokens: {
    access_token: string;
    refresh_token?: string;
    token_expires_at: string;
    refresh_token_expires_at?: string;
  }
): Promise<LinkedInConnection> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update(tokens)
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) throw new NotFoundError('LinkedIn connection not found');
  return data as LinkedInConnection;
}

export async function remove(workspaceId: string, userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from(TABLE)
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) throw error;
}
