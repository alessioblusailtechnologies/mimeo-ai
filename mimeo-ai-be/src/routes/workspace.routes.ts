import { Router } from 'express';
import * as workspaceController from '../controllers/workspace.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createWorkspaceSchema, updateWorkspaceSchema } from '../validators/workspace.validators.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createWorkspaceSchema, 'body'), workspaceController.create);
router.get('/', workspaceController.list);
router.get('/:wsId', workspaceController.getById);
router.patch('/:wsId', validate(updateWorkspaceSchema, 'body'), workspaceController.update);
router.delete('/:wsId', workspaceController.remove);

export default router;
