import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validate } from '../middleware/validation.middleware';
import { updateProfileSchema, changePasswordSchema } from '../validations/user.validation';
import { authenticate } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';

const router = Router();
const userController = new UserController();

router.get('/profile', authenticate, userController.getProfile);
router.put(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  auditLog('profile', (req) => req.user?.userId),
  userController.updateProfile
);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  userController.changePassword
);

export default router;

