import { Request, Response, NextFunction } from 'express';
import * as postService from '../services/post.service.js';
import * as postImageService from '../services/post-image.service.js';
import { sendSuccess, sendCreated } from '../utils/api-response.js';
import type { PostStatus } from '../types/post.types.js';

export async function generate(req: Request<{ wsId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await postService.generateDraft(req.params.wsId, req.body, req.user!.id);
    sendCreated(res, result);
  } catch (err) { next(err); }
}

export async function regenerate(req: Request<{ wsId: string; id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const userFeedback = req.body?.user_feedback as string | undefined;
    const result = await postService.regenerate(req.params.id, req.user!.id, userFeedback);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function selectGeneration(req: Request<{ wsId: string; id: string; genId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await postService.selectGeneration(req.params.id, req.params.genId, req.user!.id);
    sendSuccess(res, post);
  } catch (err) { next(err); }
}

export async function list(req: Request<{ wsId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = req.query.status as PostStatus | undefined;
    const posts = await postService.listDrafts(req.params.wsId, req.user!.id, status ? { status } : undefined);
    sendSuccess(res, posts);
  } catch (err) { next(err); }
}

export async function getById(req: Request<{ wsId: string; id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await postService.getDraft(req.params.id, req.user!.id);
    sendSuccess(res, post);
  } catch (err) { next(err); }
}

export async function update(req: Request<{ wsId: string; id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await postService.updateDraft(req.params.id, req.body, req.user!.id);
    sendSuccess(res, post);
  } catch (err) { next(err); }
}

export async function approve(req: Request<{ wsId: string; id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await postService.approveDraft(req.params.id, req.user!.id);
    sendSuccess(res, post);
  } catch (err) { next(err); }
}

export async function publish(req: Request<{ wsId: string; id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await postService.publishPost(req.params.id, req.user!.id);
    sendSuccess(res, post);
  } catch (err) { next(err); }
}

export async function getGenerations(req: Request<{ wsId: string; id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const generations = await postService.getGenerations(req.params.id, req.user!.id);
    sendSuccess(res, generations);
  } catch (err) { next(err); }
}

export async function regenerateImages(req: Request<{ wsId: string; id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const imageFeedback = req.body?.image_feedback as string | undefined;
    const images = await postImageService.regenerateImages(req.params.id, req.user!.id, imageFeedback);
    sendCreated(res, images);
  } catch (err) { next(err); }
}

export async function generateImages(req: Request<{ wsId: string; id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const { prompt, count } = req.body;
    const images = await postImageService.generateImages(req.params.id, req.user!.id, prompt, count);
    sendCreated(res, images);
  } catch (err) { next(err); }
}

export async function getImages(req: Request<{ wsId: string; id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const images = await postImageService.getPostImages(req.params.id, req.user!.id);
    sendSuccess(res, images);
  } catch (err) { next(err); }
}

export async function deleteImage(req: Request<{ wsId: string; id: string; imgId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    await postImageService.deleteImage(req.params.imgId, req.user!.id);
    sendSuccess(res, { deleted: true });
  } catch (err) { next(err); }
}
