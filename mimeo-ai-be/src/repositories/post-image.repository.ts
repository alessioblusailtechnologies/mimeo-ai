import { supabaseAdmin } from '../config/supabase.js';
import type { PostImage } from '../types/post-image.types.js';

export async function findByPostId(postId: string, userId: string): Promise<PostImage[]> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_post_images')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as PostImage[];
}

export async function create(image: Omit<PostImage, 'id' | 'created_at'>): Promise<PostImage> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_post_images')
    .insert(image)
    .select()
    .single();

  if (error) throw error;
  return data as PostImage;
}

export async function remove(imageId: string, userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('mimeo_post_images')
    .delete()
    .eq('id', imageId)
    .eq('user_id', userId);

  if (error) throw error;
}
