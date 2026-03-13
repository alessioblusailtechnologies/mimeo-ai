import { Router } from 'express';
import * as tovController from '../controllers/tone-of-voice.controller.js';
import * as tovChatController from '../controllers/tone-of-voice-chat.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createToneOfVoiceSchema, updateToneOfVoiceSchema } from '../validators/tone-of-voice.validators.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/chat', tovChatController.chat);
router.post('/', validate(createToneOfVoiceSchema, 'body'), tovController.create);
router.get('/', tovController.list);
router.get('/:id', tovController.getById);
router.patch('/:id', validate(updateToneOfVoiceSchema, 'body'), tovController.update);
router.delete('/:id', tovController.remove);

export default router;
