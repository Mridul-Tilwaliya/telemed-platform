import { Router } from 'express';
import { ConsultationController } from '../controllers/consultation.controller';
import { validate } from '../middleware/validation.middleware';
import {
  startConsultationSchema,
  completeConsultationSchema,
  addRatingSchema,
  getConsultationsSchema,
} from '../validations/consultation.validation';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import { UserRole } from '../types';
import { auditLog } from '../middleware/audit.middleware';

const router = Router();
const consultationController = new ConsultationController();

router.get(
  '/consultations',
  authenticate,
  validate(getConsultationsSchema),
  consultationController.getMyConsultations
);
router.post(
  '/consultations/:consultationId/start',
  authenticate,
  requireRole(UserRole.DOCTOR),
  validate(startConsultationSchema),
  auditLog('consultation', (req) => req.params.consultationId),
  consultationController.startConsultation
);
router.post(
  '/consultations/:consultationId/complete',
  authenticate,
  requireRole(UserRole.DOCTOR),
  validate(completeConsultationSchema),
  auditLog('consultation', (req) => req.params.consultationId),
  consultationController.completeConsultation
);
router.post(
  '/consultations/:consultationId/rating',
  authenticate,
  validate(addRatingSchema),
  consultationController.addRating
);

export default router;

