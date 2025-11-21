import { ConsultationRepository } from '../repositories/consultation.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors';
import { ConsultationStatus, AuditAction, PaginationParams } from '../types';
import { createPaginatedResponse } from '../utils/pagination';

export class ConsultationService {
  constructor(
    private consultationRepo: ConsultationRepository,
    private doctorRepo: DoctorRepository,
    private auditRepo: AuditRepository
  ) {}

  async startConsultation(consultationId: string, doctorId: string): Promise<any> {
    const consultation = await this.consultationRepo.findById(consultationId);
    if (!consultation) {
      throw new NotFoundError('Consultation');
    }

    if (consultation.doctorId !== doctorId) {
      throw new AuthorizationError();
    }

    if (consultation.status !== ConsultationStatus.SCHEDULED) {
      throw new ValidationError('Consultation is not in scheduled status');
    }

    const updated = await this.consultationRepo.update(consultationId, {
      status: ConsultationStatus.IN_PROGRESS,
      startedAt: new Date(),
    });

    await this.auditRepo.create({
      userId: doctorId,
      action: AuditAction.UPDATE,
      resourceType: 'consultation',
      resourceId: consultationId,
      details: { action: 'start' },
    });

    return updated;
  }

  async completeConsultation(
    consultationId: string,
    doctorId: string,
    diagnosis?: string,
    notes?: string
  ): Promise<any> {
    const consultation = await this.consultationRepo.findById(consultationId);
    if (!consultation) {
      throw new NotFoundError('Consultation');
    }

    if (consultation.doctorId !== doctorId) {
      throw new AuthorizationError();
    }

    if (consultation.status !== ConsultationStatus.IN_PROGRESS) {
      throw new ValidationError('Consultation is not in progress');
    }

    const updated = await this.consultationRepo.update(consultationId, {
      status: ConsultationStatus.COMPLETED,
      endedAt: new Date(),
      diagnosis: diagnosis || undefined,
      notes: notes || undefined,
    });

    await this.auditRepo.create({
      userId: doctorId,
      action: AuditAction.UPDATE,
      resourceType: 'consultation',
      resourceId: consultationId,
      details: { action: 'complete', diagnosis: !!diagnosis },
    });

    return updated;
  }

  async addRating(
    consultationId: string,
    patientId: string,
    rating: number,
    feedback?: string
  ): Promise<any> {
    if (rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    const consultation = await this.consultationRepo.findById(consultationId);
    if (!consultation) {
      throw new NotFoundError('Consultation');
    }

    if (consultation.patientId !== patientId) {
      throw new AuthorizationError();
    }

    if (consultation.status !== ConsultationStatus.COMPLETED) {
      throw new ValidationError('Can only rate completed consultations');
    }

    const updated = await this.consultationRepo.update(consultationId, {
      rating,
      feedback: feedback || undefined,
    });

    // Update doctor rating
    await this.updateDoctorRating(consultation.doctorId);

    await this.auditRepo.create({
      userId: patientId,
      action: AuditAction.UPDATE,
      resourceType: 'consultation',
      resourceId: consultationId,
      details: { action: 'rating', rating },
    });

    return updated;
  }

  async getPatientConsultations(
    patientId: string,
    filters: { status?: ConsultationStatus },
    pagination: PaginationParams
  ) {
    const result = await this.consultationRepo.findByPatientId(patientId, filters, pagination);
    return createPaginatedResponse(result.consultations, result.total, pagination);
  }

  async getDoctorConsultations(
    doctorId: string,
    filters: { status?: ConsultationStatus },
    pagination: PaginationParams
  ) {
    const result = await this.consultationRepo.findByDoctorId(doctorId, filters, pagination);
    return createPaginatedResponse(result.consultations, result.total, pagination);
  }

  private async updateDoctorRating(doctorId: string): Promise<void> {
    const consultations = await this.consultationRepo.findByDoctorId(
      doctorId,
      { status: ConsultationStatus.COMPLETED },
      { page: 1, limit: 1000, sortBy: 'createdAt', sortOrder: 'desc' }
    );

    const ratedConsultations = consultations.consultations.filter((c) => c.rating);
    if (ratedConsultations.length === 0) return;

    const avgRating =
      ratedConsultations.reduce((sum, c) => sum + (c.rating || 0), 0) /
      ratedConsultations.length;

    await this.doctorRepo.update(doctorId, {
      rating: Math.round(avgRating * 100) / 100,
      totalConsultations: consultations.total,
    });
  }
}

