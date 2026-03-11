import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/api-error.js';
import type { Workspace, CreateWorkspaceDto, UpdateWorkspaceDto } from '../types/workspace.types.js';

export async function findAllByUserId(userId: string): Promise<Workspace[]> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_workspaces')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Workspace[];
}

export async function findById(id: string, userId: string): Promise<Workspace> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_workspaces')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new NotFoundError('Workspace not found');
  return data as Workspace;
}

export async function create(dto: CreateWorkspaceDto, userId: string): Promise<Workspace> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_workspaces')
    .insert({ ...dto, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data as Workspace;
}

export async function update(id: string, dto: UpdateWorkspaceDto, userId: string): Promise<Workspace> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_workspaces')
    .update(dto)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) throw new NotFoundError('Workspace not found');
  return data as Workspace;
}

export async function remove(id: string, userId: string): Promise<void> {
  const { error, count } = await supabaseAdmin
    .from('mimeo_workspaces')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
  if (count === 0) throw new NotFoundError('Workspace not found');
}
