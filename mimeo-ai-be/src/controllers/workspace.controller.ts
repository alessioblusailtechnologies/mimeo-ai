import { Request, Response, NextFunction } from 'express';
import * as workspaceService from '../services/workspace.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/api-response.js';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const workspace = await workspaceService.createWorkspace(req.body, req.user!.id);
    sendCreated(res, workspace);
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const workspaces = await workspaceService.listWorkspaces(req.user!.id);
    sendSuccess(res, workspaces);
  } catch (err) { next(err); }
}

export async function getById(req: Request<{ wsId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const workspace = await workspaceService.getWorkspace(req.params.wsId, req.user!.id);
    sendSuccess(res, workspace);
  } catch (err) { next(err); }
}

export async function update(req: Request<{ wsId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const workspace = await workspaceService.updateWorkspace(req.params.wsId, req.body, req.user!.id);
    sendSuccess(res, workspace);
  } catch (err) { next(err); }
}

export async function remove(req: Request<{ wsId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    await workspaceService.deleteWorkspace(req.params.wsId, req.user!.id);
    sendNoContent(res);
  } catch (err) { next(err); }
}
