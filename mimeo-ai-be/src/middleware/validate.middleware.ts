import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { BadRequestError } from '../utils/api-error.js';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const messages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      next(new BadRequestError(messages));
      return;
    }
    req[source] = result.data;
    next();
  };
}
