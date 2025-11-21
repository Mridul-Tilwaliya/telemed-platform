import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { validate } from '../middleware/validation.middleware';
import {
  bookConsultationSchema,
  getAvailableSlotsSchema,
  cancelConsultationSchema,
} from '../validations/booking.validation';
import { authenticate } from '../middleware/auth.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { idempotency } from '../middleware/idempotency.middleware';

const router = Router();
const bookingController = new BookingController();

router.get(
  '/doctors/:doctorId/slots',
  validate(getAvailableSlotsSchema),
  bookingController.getAvailableSlots
);
router.post(
  '/consultations',
  authenticate,
  idempotency,
  validate(bookConsultationSchema),
  auditLog('consultation', (req) => req.body?.consultationId),
  bookingController.bookConsultation
);
router.delete(
  '/consultations/:consultationId',
  authenticate,
  validate(cancelConsultationSchema),
  bookingController.cancelConsultation
);

export default router;

