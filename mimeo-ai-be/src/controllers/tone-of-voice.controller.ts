import { Request, Response, NextFunction } from 'express';
import * as tovService from '../services/tone-of-voice.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/api-response.js';

export async function create(req: Request<{ wsId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const tov = await tovService.createToneOfVoice(req.params.wsId, req.body, req.user!.id);
    sendCreated(res, tov);
  } catch (err) { next(err); }
}

export async function list(req: Request<{ wsId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const tovs = await tovService.listToneOfVoices(req.params.wsId, req.user!.id);
    sendSuccess(res, tovs);
  } catch (err) { next(err); }
}

export async function getById(req: Request<{ wsId: string; id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const tov = await tovService.getToneOfVoice(req.params.id, req.user!.id);
    sendSuccess(res, tov);
  } catch (err) { next(err); }
}

export async function update(req: Request<{ wsId: string; id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const tov = await tovService.updateToneOfVoice(req.params.id, req.body, req.user!.id);
    sendSuccess(res, tov);
  } catch (err) { next(err); }
}

export async function remove(req: Request<{ wsId: string; id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    await tovService.deleteToneOfVoice(req.params.id, req.user!.id);
    sendNoContent(res);
  } catch (err) { next(err); }
}
