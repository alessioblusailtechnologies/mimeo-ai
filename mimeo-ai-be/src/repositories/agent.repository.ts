import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/api-error.js';
import type { Agent, CreateAgentDto, UpdateAgentDto } from '../types/agent.types.js';

export async function findAllByWorkspaceId(workspaceId: string, userId: string): Promise<Agent[]> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_agents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Agent[];
}

export async function findById(id: string, userId: string): Promise<Agent> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_agents')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new NotFoundError('Agent not found');
  return data as Agent;
}

export async function create(workspaceId: string, dto: CreateAgentDto, userId: string): Promise<Agent> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_agents')
    .insert({ ...dto, user_id: userId, workspace_id: workspaceId })
    .select()
    .single();

  if (error) throw error;
  return data as Agent;
}

export async function update(id: string, dto: UpdateAgentDto, userId: string): Promise<Agent> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_agents')
    .update(dto)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) throw new NotFoundError('Agent not found');
  return data as Agent;
}

export async function remove(id: string, userId: string): Promise<void> {
  const { error, count } = await supabaseAdmin
    .from('mimeo_agents')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
  if (count === 0) throw new NotFoundError('Agent not found');
}
