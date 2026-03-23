import { Router } from 'express';
import * as linkedinController from '../controllers/linkedin.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { exchangeCodeSchema, selectOrgSchema } from '../validators/linkedin.validators.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/oauth-url', linkedinController.getOAuthUrl);
router.post('/exchange', validate(exchangeCodeSchema, 'body'), linkedinController.exchangeCode);
router.post('/select-organization', validate(selectOrgSchema, 'body'), linkedinController.selectOrganization);
router.get('/connection', linkedinController.getConnection);
router.delete('/connection', linkedinController.disconnect);

export default router;
