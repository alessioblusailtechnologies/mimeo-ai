import morgan from 'morgan';
import { config } from '../config/index.js';

export const requestLogger = morgan(
  config.nodeEnv === 'production' ? 'combined' : 'dev'
);
