import { PrescriptionRepository } from '../repositories/prescription.repository';
import { ConsultationRepository } from '../repositories/consultation.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors';
import { ConsultationStatus, AuditAction, Medication, PaginationParams } from '../types';
import { createPaginatedResponse } from '../utils/pagination';

export class PrescriptionService {
  constructor(
    private prescriptionRepo: PrescriptionRepository,
    private consultationRepo: ConsultationRepository,
    private auditRepo: AuditRepository
  ) {}

  async createPrescription(
    consultationId: string,
    doctorId: string,
    medications: Medication[],
    instructions?: string,
    followUpDate?: Date
  ): Promise<any> {
    const consultation = await this.consultationRepo.findById(consultationId);
    if (!consultation) {
      throw new NotFoundError('Consultation');
    }

    if (consultation.doctorId !== doctorId) {
      throw new AuthorizationError();
    }

    if (consultation.status !== ConsultationStatus.COMPLETED) {
      throw new ValidationError('Can only create prescription for completed consultations');
    }

    // Check if prescription already exists
    const existing = await this.prescriptionRepo.findByConsultationId(consultationId);
    if (existing) {
      throw new ValidationError('Prescription already exists for this consultation');
    }

    if (medications.length === 0) {
      throw new ValidationError('At least one medication is required');
    }

    const prescription = await this.prescriptionRepo.create({
      consultationId,
      doctorId,
      patientId: consultation.patientId,
      medications,
      instructions: instructions || undefined,
      followUpDate: followUpDate || undefined,
      isActive: true,
    });

    await this.auditRepo.create({
      userId: doctorId,
      action: AuditAction.PRESCRIPTION,
      resourceType: 'prescription',
      resourceId: prescription.id,
      details: { consultationId, medicationCount: medications.length },
    });

    return prescription;
  }

  async getPrescription(prescriptionId: string, userId: string, isDoctor: boolean): Promise<any> {
    const prescription = await this.prescriptionRepo.findById(prescriptionId);
    if (!prescription) {
      throw new NotFoundError('Prescription');
    }

    // Check authorization
    if (!isDoctor && prescription.patientId !== userId) {
      throw new AuthorizationError();
    }
    if (isDoctor && prescription.doctorId !== userId) {
      throw new AuthorizationError();
    }

    return prescription;
  }

  async getPrescriptionByConsultation(
    consultationId: string,
    userId: string,
    isDoctor: boolean
  ): Promise<any> {
    const consultation = await this.consultationRepo.findById(consultationId);
    if (!consultation) {
      throw new NotFoundError('Consultation');
    }

    // Check authorization
    if (!isDoctor && consultation.patientId !== userId) {
      throw new AuthorizationError();
    }
    if (isDoctor && consultation.doctorId !== userId) {
      throw new AuthorizationError();
    }

    const prescription = await this.prescriptionRepo.findByConsultationId(consultationId);
    if (!prescription) {
      throw new NotFoundError('Prescription');
    }

    return prescription;
  }

  async getPatientPrescriptions(
    patientId: string,
    filters: { isActive?: boolean },
    pagination: PaginationParams
  ) {
    const result = await this.prescriptionRepo.findByPatientId(patientId, filters, pagination);
    return createPaginatedResponse(result.prescriptions, result.total, pagination);
  }

  async updatePrescription(
    prescriptionId: string,
    doctorId: string,
    updates: {
      medications?: Medication[];
      instructions?: string;
      followUpDate?: Date;
      isActive?: boolean;
    }
  ): Promise<any> {
    const prescription = await this.prescriptionRepo.findById(prescriptionId);
    if (!prescription) {
      throw new NotFoundError('Prescription');
    }

    if (prescription.doctorId !== doctorId) {
      throw new AuthorizationError();
    }

    const updated = await this.prescriptionRepo.update(prescriptionId, updates);

    await this.auditRepo.create({
      userId: doctorId,
      action: AuditAction.UPDATE,
      resourceType: 'prescription',
      resourceId: prescriptionId,
      details: { updatedFields: Object.keys(updates) },
    });

    return updated;
  }
}

