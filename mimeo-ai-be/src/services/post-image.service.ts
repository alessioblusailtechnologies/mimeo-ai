import { supabaseAdmin } from '../config/supabase.js';
import * as postRepo from '../repositories/post.repository.js';
import * as agentRepo from '../repositories/agent.repository.js';
import * as postImageRepo from '../repositories/post-image.repository.js';
import { getImageProvider } from './ai/ai-provider.factory.js';
import { buildImagePrompt } from '../utils/prompt-builder.js';
import { BadRequestError } from '../utils/api-error.js';
import type { PostImage } from '../types/post-image.types.js';
import { randomUUID } from 'crypto';

export async function generateImages(
  postId: string,
  userId: string,
  prompt: string,
  count: number = 1
): Promise<PostImage[]> {
  // Verify post ownership
  await postRepo.findById(postId, userId);

  const imageProvider = getImageProvider();
  const n = Math.min(Math.max(count, 1), 4);

  const result = await imageProvider.generateImages({
    prompt,
    n,
    size: '1024x1024',
    quality: 'medium',
  });

  // Upload each image to Supabase Storage and create DB records
  const images = await Promise.all(
    result.images.map(async (buffer) => {
      const fileName = `${userId}/${postId}/${randomUUID()}.png`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('post-images')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseAdmin.storage
        .from('post-images')
        .getPublicUrl(fileName);

      return postImageRepo.create({
        post_id: postId,
        user_id: userId,
        prompt,
        storage_path: fileName,
        public_url: urlData.publicUrl,
        ai_model: result.model,
        generation_time_ms: Math.round(result.generationTimeMs / n),
      });
    })
  );

  return images;
}

export async function getPostImages(postId: string, userId: string): Promise<PostImage[]> {
  await postRepo.findById(postId, userId);
  return postImageRepo.findByPostId(postId, userId);
}

export async function regenerateImages(
  postId: string,
  userId: string,
  imageFeedback?: string
): Promise<PostImage[]> {
  const post = await postRepo.findById(postId, userId);
  const agent = await agentRepo.findById(post.agent_id, userId);

  if (!agent.image_generation_enabled || !agent.image_prompt) {
    throw new BadRequestError('Image generation is not configured for this agent');
  }

  const prompt = buildImagePrompt(
    agent.image_prompt,
    post.content,
    post.original_brief,
    imageFeedback
  );

  return generateImages(postId, userId, prompt, agent.image_count || 1);
}

export async function deleteImage(imageId: string, userId: string): Promise<void> {
  // Get image to find storage path
  const images = await supabaseAdmin
    .from('mimeo_post_images')
    .select('storage_path')
    .eq('id', imageId)
    .eq('user_id', userId)
    .single();

  if (images.data) {
    await supabaseAdmin.storage
      .from('post-images')
      .remove([images.data.storage_path]);
  }

  await postImageRepo.remove(imageId, userId);
}
