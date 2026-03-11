import type { Post } from '../../types/post.types.js';

export interface PublishResult {
  success: boolean;
  publishedUrl?: string;
  publishedAt: string;
  error?: string;
  method: 'manual' | 'linkedin_api';
}

export interface Publisher {
  publish(post: Post): Promise<PublishResult>;
  getType(): string;
}
