import { Router } from 'express';
import authRoutes from './auth.routes.js';
import workspaceRoutes from './workspace.routes.js';
import agentRoutes from './agent.routes.js';
import postRoutes from './post.routes.js';
import chatRoutes from './chat.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/workspaces/:wsId/agents', agentRoutes);
router.use('/workspaces/:wsId/posts', postRoutes);
router.use('/workspaces/:wsId/chat', chatRoutes);

export default router;
