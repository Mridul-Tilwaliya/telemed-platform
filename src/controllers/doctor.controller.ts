import { Request, Response, NextFunction } from 'express';
import { DoctorRepository } from '../repositories/doctor.repository';
import { NotFoundError } from '../utils/errors';
import { parsePaginationParams, createPaginatedResponse } from '../utils/pagination';

export class DoctorController {
  private doctorRepo: DoctorRepository;

  constructor() {
    this.doctorRepo = new DoctorRepository();
  }

  getDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pagination = parsePaginationParams(req.query);
      const filters = {
        specialization: req.query.specialization as string | undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        search: req.query.search as string | undefined,
      };

      const result = await this.doctorRepo.findAvailable(filters, pagination);
      res.json(createPaginatedResponse(result.doctors, result.total, pagination));
    } catch (error) {
      next(error);
    }
  };

  getDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctor = await this.doctorRepo.findById(req.params.id);
      if (!doctor) {
        throw new NotFoundError('Doctor');
      }
      res.json(doctor);
    } catch (error) {
      next(error);
    }
  };
}

