import { Response, NextFunction } from 'express';
import { PrescriptionService } from '../services/prescription.service';
import { PrescriptionRepository } from '../repositories/prescription.repository';
import { ConsultationRepository } from '../repositories/consultation.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { AuthRequest } from '../middleware/auth.middleware';
import { parsePaginationParams } from '../utils/pagination';

export class PrescriptionController {
  private prescriptionService: PrescriptionService;

  constructor() {
    const prescriptionRepo = new PrescriptionRepository();
    const consultationRepo = new ConsultationRepository();
    const auditRepo = new AuditRepository();
    this.prescriptionService = new PrescriptionService(
      prescriptionRepo,
      consultationRepo,
      auditRepo
    );
  }

  createPrescription = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { consultationId } = req.params;
      const { medications, instructions, followUpDate } = req.body;
      const prescription = await this.prescriptionService.createPrescription(
        consultationId,
        req.user.userId,
        medications,
        instructions,
        followUpDate ? new Date(followUpDate) : undefined
      );
      res.status(201).json(prescription);
    } catch (error) {
      next(error);
    }
  };

  getPrescription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { prescriptionId } = req.params;
      const isDoctor = req.user.role === 'doctor';
      const prescription = await this.prescriptionService.getPrescription(
        prescriptionId,
        req.user.userId,
        isDoctor
      );
      res.json(prescription);
    } catch (error) {
      next(error);
    }
  };

  getMyPrescriptions = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const pagination = parsePaginationParams(req.query);
      const filters = {
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      };

      const result = await this.prescriptionService.getPatientPrescriptions(
        req.user.userId,
        filters,
        pagination
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getPrescriptionByConsultation = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { consultationId } = req.params;
      const isDoctor = req.user.role === 'doctor';
      const prescription = await this.prescriptionService.getPrescriptionByConsultation(
        consultationId,
        req.user.userId,
        isDoctor
      );
      res.json(prescription);
    } catch (error) {
      next(error);
    }
  };
}

