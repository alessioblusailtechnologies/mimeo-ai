import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { requestLogger } from './middleware/request-logger.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { NotFoundError } from './utils/api-error.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.cors.origin }));
  app.use(express.json());
  app.use(requestLogger);

  app.use('/api/v1', routes);

  app.use((_req, _res, next) => {
    next(new NotFoundError('Route not found'));
  });

  app.use(errorMiddleware);

  return app;
}
