import { Request, Response, NextFunction } from 'express';
import { supabaseClient } from '../config/supabase.js';
import { UnauthorizedError } from '../utils/api-error.js';
import type { User } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or invalid authorization header'));
    return;
  }

  const token = authHeader.substring(7);

  const { data, error } = await supabaseClient.auth.getUser(token);

  if (error || !data.user) {
    next(new UnauthorizedError('Invalid or expired token'));
    return;
  }

  req.user = data.user;
  next();
}
