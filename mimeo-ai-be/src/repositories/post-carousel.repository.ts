import { supabaseAdmin } from '../config/supabase.js';
import type { PostCarousel } from '../types/post-carousel.types.js';

export async function findByPostId(postId: string, userId: string): Promise<PostCarousel[]> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_post_carousels')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as PostCarousel[];
}

export async function create(carousel: Omit<PostCarousel, 'id' | 'created_at'>): Promise<PostCarousel> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_post_carousels')
    .insert(carousel)
    .select()
    .single();

  if (error) throw error;
  return data as PostCarousel;
}

export async function remove(carouselId: string, userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('mimeo_post_carousels')
    .delete()
    .eq('id', carouselId)
    .eq('user_id', userId);

  if (error) throw error;
}
