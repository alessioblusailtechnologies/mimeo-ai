import { Router } from 'express';
import authRoutes from './auth.routes.js';
import workspaceRoutes from './workspace.routes.js';
import agentRoutes from './agent.routes.js';
import postRoutes from './post.routes.js';
import chatRoutes from './chat.routes.js';
import tovRoutes from './tone-of-voice.routes.js';
import linkedinRoutes from './linkedin.routes.js';
import sharedRoutes from './shared.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/workspaces/:wsId/agents', agentRoutes);
router.use('/workspaces/:wsId/posts', postRoutes);
router.use('/workspaces/:wsId/chat', chatRoutes);
router.use('/workspaces/:wsId/tone-of-voice', tovRoutes);
router.use('/workspaces/:wsId/linkedin', linkedinRoutes);
router.use('/shared', sharedRoutes);

export default router;
