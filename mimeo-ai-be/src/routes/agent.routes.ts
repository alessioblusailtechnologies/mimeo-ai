import { Router } from 'express';
import * as agentController from '../controllers/agent.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createAgentSchema, updateAgentSchema } from '../validators/agent.validators.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/', validate(createAgentSchema, 'body'), agentController.create);
router.get('/', agentController.list);
router.get('/:id', agentController.getById);
router.patch('/:id', validate(updateAgentSchema, 'body'), agentController.update);
router.post('/:id/duplicate', agentController.duplicate);
router.delete('/:id', agentController.remove);
router.post('/upload-reference-image', agentController.uploadReferenceImage);

export default router;
