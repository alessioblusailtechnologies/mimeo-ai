import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import { sendSuccess, sendCreated } from '../utils/api-response.js';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await authService.register(req.body);
    sendCreated(res, data);
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await authService.login(req.body);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await authService.getProfile(req.user!.id);
    sendSuccess(res, { user: req.user, profile });
  } catch (err) { next(err); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await authService.updateProfile(req.user!.id, req.body);
    sendSuccess(res, profile);
  } catch (err) { next(err); }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, { message: 'Logged out successfully' });
}
