import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/api-error.js';
import type { Post, PostStatus, ImageStatus } from '../types/post.types.js';

export async function findAllByWorkspaceId(
  workspaceId: string,
  userId: string,
  filters?: { status?: PostStatus }
): Promise<Post[]> {
  let query = supabaseAdmin
    .from('mimeo_posts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Post[];
}

export async function findById(id: string, userId: string): Promise<Post> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_posts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new NotFoundError('Post not found');
  return data as Post;
}

export async function create(post: {
  user_id: string;
  workspace_id: string;
  agent_id: string;
  title?: string;
  content: string;
  original_brief: string;
}): Promise<Post> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_posts')
    .insert({ ...post, status: 'draft' })
    .select()
    .single();

  if (error) throw error;
  return data as Post;
}

export async function update(
  id: string,
  fields: Partial<Pick<Post, 'title' | 'content'>>,
  userId: string
): Promise<Post> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_posts')
    .update(fields)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) throw new NotFoundError('Post not found');
  return data as Post;
}

export async function updateImageStatus(
  id: string,
  imageStatus: ImageStatus | null,
  userId: string
): Promise<void> {
  await supabaseAdmin
    .from('mimeo_posts')
    .update({ image_status: imageStatus })
    .eq('id', id)
    .eq('user_id', userId);
}

export async function updateStatus(
  id: string,
  status: PostStatus,
  userId: string,
  extra?: { published_at?: string }
): Promise<Post> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_posts')
    .update({ status, ...extra })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) throw new NotFoundError('Post not found');
  return data as Post;
}

export async function findByShareToken(shareToken: string): Promise<Post> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_posts')
    .select('*')
    .eq('share_token', shareToken)
    .single();

  if (error || !data) throw new NotFoundError('Shared post not found');
  return data as Post;
}

export async function enableShare(id: string, userId: string): Promise<Post> {
  const post = await findById(id, userId);
  if (post.share_token) return post;

  const { data, error } = await supabaseAdmin
    .from('mimeo_posts')
    .update({ share_token: randomUUID() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) throw new NotFoundError('Post not found');
  return data as Post;
}

export async function disableShare(id: string, userId: string): Promise<Post> {
  const { data, error } = await supabaseAdmin
    .from('mimeo_posts')
    .update({ share_token: null })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) throw new NotFoundError('Post not found');
  return data as Post;
}
