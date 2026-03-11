import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error.js';
import { config } from '../config/index.js';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
    return;
  }

  console.error('Unexpected error:', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
}
