import { Request, Response, NextFunction } from 'express';
import * as agentService from '../services/agent.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/api-response.js';

export async function create(req: Request<{ wsId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const agent = await agentService.createAgent(req.params.wsId, req.body, req.user!.id);
    sendCreated(res, agent);
  } catch (err) { next(err); }
}

export async function list(req: Request<{ wsId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const agents = await agentService.listAgents(req.params.wsId, req.user!.id);
    sendSuccess(res, agents);
  } catch (err) { next(err); }
}

export async function getById(req: Request<{ wsId: string; id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const agent = await agentService.getAgent(req.params.id, req.user!.id);
    sendSuccess(res, agent);
  } catch (err) { next(err); }
}

export async function update(req: Request<{ wsId: string; id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const agent = await agentService.updateAgent(req.params.id, req.body, req.user!.id);
    sendSuccess(res, agent);
  } catch (err) { next(err); }
}

export async function remove(req: Request<{ wsId: string; id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    await agentService.deleteAgent(req.params.id, req.user!.id);
    sendNoContent(res);
  } catch (err) { next(err); }
}
