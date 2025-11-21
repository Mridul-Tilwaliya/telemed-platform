import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  setupMFASchema,
  enableMFASchema,
  disableMFASchema,
} from '../validations/auth.validation';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/mfa/setup', authenticate, authController.setupMFA);
router.post('/mfa/enable', authenticate, validate(enableMFASchema), authController.enableMFA);
router.post('/mfa/disable', authenticate, validate(disableMFASchema), authController.disableMFA);

export default router;

