import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/api-error.js';
import type { ToneOfVoice, CreateToneOfVoiceDto, UpdateToneOfVoiceDto } from '../types/tone-of-voice.types.js';

export async function findAllByWorkspaceId(workspaceId: string, userId: string): Promise<ToneOfVoice[]> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_tone_of_voice')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ToneOfVoice[];
}

export async function findById(id: string, userId: string): Promise<ToneOfVoice> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_tone_of_voice')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new NotFoundError('Tone of Voice not found');
  return data as ToneOfVoice;
}

export async function create(workspaceId: string, dto: CreateToneOfVoiceDto, userId: string): Promise<ToneOfVoice> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_tone_of_voice')
    .insert({ ...dto, user_id: userId, workspace_id: workspaceId })
    .select()
    .single();

  if (error) throw error;
  return data as ToneOfVoice;
}

export async function update(id: string, dto: UpdateToneOfVoiceDto, userId: string): Promise<ToneOfVoice> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_tone_of_voice')
    .update(dto)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) throw new NotFoundError('Tone of Voice not found');
  return data as ToneOfVoice;
}

export async function remove(id: string, userId: string): Promise<void> {
  const { error, count } = await supabaseAdmin
    .from('mimeo_tone_of_voice')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
  if (count === 0) throw new NotFoundError('Tone of Voice not found');
}
