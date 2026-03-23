import { Request, Response, NextFunction } from 'express';
import * as linkedInService from '../services/linkedin/linkedin.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/api-response.js';

export async function getOAuthUrl(req: Request<{ wsId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const redirectUri = req.query.redirect_uri as string;
    const result = linkedInService.getOAuthUrl(req.params.wsId, redirectUri);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function exchangeCode(req: Request<{ wsId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await linkedInService.exchangeCode(
      req.params.wsId,
      req.user!.id,
      req.body.code,
      req.body.redirect_uri
    );
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function selectOrganization(req: Request<{ wsId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const connection = await linkedInService.selectOrganization(
      req.params.wsId,
      req.user!.id,
      req.body.organization_id,
      req.body.organization_name,
      req.body.organization_logo_url
    );
    sendCreated(res, connection);
  } catch (err) { next(err); }
}

export async function getConnection(req: Request<{ wsId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const connection = await linkedInService.getConnection(req.params.wsId, req.user!.id);
    sendSuccess(res, connection);
  } catch (err) { next(err); }
}

export async function disconnect(req: Request<{ wsId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    await linkedInService.disconnect(req.params.wsId, req.user!.id);
    sendNoContent(res);
  } catch (err) { next(err); }
}
