import { Router } from 'express';
import * as postController from '../controllers/post.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { generateDraftSchema, updatePostSchema } from '../validators/post.validators.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/generate', validate(generateDraftSchema, 'body'), postController.generate);
router.get('/', postController.list);
router.get('/:id', postController.getById);
router.patch('/:id', validate(updatePostSchema, 'body'), postController.update);
router.post('/:id/regenerate', postController.regenerate);
router.post('/:id/approve', postController.approve);
router.post('/:id/publish', postController.publish);
router.get('/:id/generations', postController.getGenerations);
router.post('/:id/generations/:genId/select', postController.selectGeneration);
router.post('/:id/images/regenerate', postController.regenerateImages);
router.post('/:id/images/generate', postController.generateImages);
router.get('/:id/images', postController.getImages);
router.delete('/:id/images/:imgId', postController.deleteImage);
router.post('/:id/share', postController.enableShare);
router.delete('/:id/share', postController.disableShare);

export default router;
