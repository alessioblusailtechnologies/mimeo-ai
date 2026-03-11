import type { Request, Response, NextFunction } from 'express';
import * as chatService from '../services/chat.service.js';
import { sendSuccess } from '../utils/api-response.js';

export async function chat(req: Request<{ wsId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await chatService.processMessage(req.params.wsId, req.body, req.user!.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}
