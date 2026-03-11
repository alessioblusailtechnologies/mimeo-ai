import { Router } from 'express';
import * as chatController from '../controllers/chat.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/', chatController.chat);

export default router;
