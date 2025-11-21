import { Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service';
import { AvailabilityRepository } from '../repositories/availability.repository';
import { ConsultationRepository } from '../repositories/consultation.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { AuthRequest } from '../middleware/auth.middleware';
import { addDays, startOfDay, endOfDay } from 'date-fns';

export class BookingController {
  private bookingService: BookingService;

  constructor() {
    const availabilityRepo = new AvailabilityRepository();
    const consultationRepo = new ConsultationRepository();
    const doctorRepo = new DoctorRepository();
    const paymentRepo = new PaymentRepository();
    const auditRepo = new AuditRepository();
    this.bookingService = new BookingService(
      availabilityRepo,
      consultationRepo,
      doctorRepo,
      paymentRepo,
      auditRepo
    );
  }

  bookConsultation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { slotId, symptoms } = req.body;
      const result = await this.bookingService.bookConsultation(
        req.user.userId,
        slotId,
        symptoms
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  getAvailableSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { doctorId } = req.params;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : startOfDay(new Date());
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : endOfDay(addDays(new Date(), 30));

      const slots = await this.bookingService.getAvailableSlots(doctorId, startDate, endDate);
      res.json(slots);
    } catch (error) {
      next(error);
    }
  };

  cancelConsultation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { consultationId } = req.params;
      // TODO: Check if user is doctor
      await this.bookingService.cancelConsultation(consultationId, req.user.userId, false);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

