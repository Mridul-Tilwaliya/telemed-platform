import { Router } from 'express';
import { PrescriptionController } from '../controllers/prescription.controller';
import { validate } from '../middleware/validation.middleware';
import {
  createPrescriptionSchema,
  getPrescriptionsSchema,
} from '../validations/prescription.validation';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import { UserRole } from '../types';
import { auditLog } from '../middleware/audit.middleware';
import { idempotency } from '../middleware/idempotency.middleware';

const router = Router();
const prescriptionController = new PrescriptionController();

router.post(
  '/consultations/:consultationId/prescriptions',
  authenticate,
  requireRole(UserRole.DOCTOR),
  idempotency,
  validate(createPrescriptionSchema),
  auditLog('prescription', (req) => req.body?.prescriptionId),
  prescriptionController.createPrescription
);
router.get(
  '/consultations/:consultationId/prescriptions',
  authenticate,
  prescriptionController.getPrescriptionByConsultation
);
router.get(
  '/prescriptions',
  authenticate,
  validate(getPrescriptionsSchema),
  prescriptionController.getMyPrescriptions
);
router.get(
  '/prescriptions/:prescriptionId',
  authenticate,
  prescriptionController.getPrescription
);

export default router;

