import { supabaseAdmin } from '../config/supabase.js';
import type { Generation } from '../types/generation.types.js';

export async function findByPostId(postId: string, userId: string): Promise<Generation[]> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_generations')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Generation[];
}

export async function create(generation: Omit<Generation, 'id' | 'created_at'>): Promise<Generation> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_generations')
    .insert(generation)
    .select()
    .single();

  if (error) throw error;
  return data as Generation;
}

export async function markSelected(
  generationId: string,
  postId: string,
  userId: string
): Promise<void> {
  // Deselect all generations for this post
  await supabaseAdmin
    .from('mimeo_generations')
    .update({ is_selected: false })
    .eq('post_id', postId)
    .eq('user_id', userId);

  // Select the chosen one
  const { error } = await supabaseAdmin
    .from('mimeo_generations')
    .update({ is_selected: true })
    .eq('id', generationId)
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) throw error;
}
