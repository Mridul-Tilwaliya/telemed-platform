import { Response, NextFunction } from 'express';
import { ConsultationService } from '../services/consultation.service';
import { ConsultationRepository } from '../repositories/consultation.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { AuthRequest } from '../middleware/auth.middleware';
import { parsePaginationParams } from '../utils/pagination';
import { ConsultationStatus } from '../types';

export class ConsultationController {
  private consultationService: ConsultationService;

  constructor() {
    const consultationRepo = new ConsultationRepository();
    const doctorRepo = new DoctorRepository();
    const auditRepo = new AuditRepository();
    this.consultationService = new ConsultationService(
      consultationRepo,
      doctorRepo,
      auditRepo
    );
  }

  startConsultation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { consultationId } = req.params;
      const consultation = await this.consultationService.startConsultation(
        consultationId,
        req.user.userId
      );
      res.json(consultation);
    } catch (error) {
      next(error);
    }
  };

  completeConsultation = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { consultationId } = req.params;
      const { diagnosis, notes } = req.body;
      const consultation = await this.consultationService.completeConsultation(
        consultationId,
        req.user.userId,
        diagnosis,
        notes
      );
      res.json(consultation);
    } catch (error) {
      next(error);
    }
  };

  addRating = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { consultationId } = req.params;
      const { rating, feedback } = req.body;
      const consultation = await this.consultationService.addRating(
        consultationId,
        req.user.userId,
        rating,
        feedback
      );
      res.json(consultation);
    } catch (error) {
      next(error);
    }
  };

  getMyConsultations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const pagination = parsePaginationParams(req.query);
      const filters = {
        status: req.query.status as ConsultationStatus | undefined,
      };

      // Check if user is doctor
      const isDoctor = req.user.role === 'doctor';
      const result = isDoctor
        ? await this.consultationService.getDoctorConsultations(
            req.user.userId,
            filters,
            pagination
          )
        : await this.consultationService.getPatientConsultations(
            req.user.userId,
            filters,
            pagination
          );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

