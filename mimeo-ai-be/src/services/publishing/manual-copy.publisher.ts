import type { Post } from '../../types/post.types.js';
import type { Publisher, PublishResult } from './publisher.interface.js';

export class ManualCopyPublisher implements Publisher {
  async publish(_post: Post): Promise<PublishResult> {
    return {
      success: true,
      publishedAt: new Date().toISOString(),
      method: 'manual',
    };
  }

  getType(): string {
    return 'manual';
  }
}
