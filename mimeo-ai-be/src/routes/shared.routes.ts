import { Router } from 'express';
import * as postController from '../controllers/post.controller.js';

const router = Router();

// Public endpoint — no auth required
router.get('/posts/:shareToken', postController.getShared);

export default router;
