import type { Post } from '../../types/post.types.js';
import type { Publisher, PublishResult } from './publisher.interface.js';
import * as linkedInService from '../linkedin/linkedin.service.js';
import * as linkedInApi from '../linkedin/linkedin-api.service.js';
import * as postImageRepo from '../../repositories/post-image.repository.js';

export class LinkedInPublisher implements Publisher {
  constructor(
    private workspaceId: string,
    private userId: string
  ) {}

  async publish(post: Post): Promise<PublishResult> {
    try {
      const { token, organizationId } = await linkedInService.getValidAccessToken(
        this.workspaceId,
        this.userId
      );

      const images = await postImageRepo.findByPostId(post.id, this.userId);

      let postUrn: string;

      if (images.length > 0) {
        const imageUrns: string[] = [];
        for (const img of images) {
          try {
            const imgRes = await fetch(img.public_url);
            if (!imgRes.ok) continue;
            const buffer = Buffer.from(await imgRes.arrayBuffer());

            const { uploadUrl, imageUrn } = await linkedInApi.initializeImageUpload(token, organizationId);
            await linkedInApi.uploadImageBinary(uploadUrl, buffer, 'image/png');
            imageUrns.push(imageUrn);
          } catch {
            // Skip failed image uploads
            continue;
          }
        }

        if (imageUrns.length > 0) {
          const result = await linkedInApi.createImagePost(token, organizationId, post.content, imageUrns);
          postUrn = result.postUrn;
        } else {
          const result = await linkedInApi.createTextPost(token, organizationId, post.content);
          postUrn = result.postUrn;
        }
      } else {
        const result = await linkedInApi.createTextPost(token, organizationId, post.content);
        postUrn = result.postUrn;
      }

      const publishedUrl = postUrn
        ? `https://www.linkedin.com/feed/update/${postUrn}`
        : undefined;

      return {
        success: true,
        publishedUrl,
        publishedAt: new Date().toISOString(),
        method: 'linkedin_api',
      };
    } catch (error: any) {
      return {
        success: false,
        publishedAt: new Date().toISOString(),
        method: 'linkedin_api',
        error: error.message || 'LinkedIn publishing failed',
      };
    }
  }

  getType(): string {
    return 'linkedin';
  }
}
