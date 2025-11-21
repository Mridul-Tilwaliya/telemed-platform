import { AvailabilityRepository } from '../repositories/availability.repository';
import { ConsultationRepository } from '../repositories/consultation.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';
import { ConsultationStatus, PaymentStatus, AuditAction } from '../types';
import { db } from '../database/connection';

export class BookingService {
  constructor(
    private availabilityRepo: AvailabilityRepository,
    private consultationRepo: ConsultationRepository,
    private doctorRepo: DoctorRepository,
    private paymentRepo: PaymentRepository,
    private auditRepo: AuditRepository
  ) {}

  async bookConsultation(
    patientId: string,
    slotId: string,
    symptoms?: string
  ): Promise<{ consultation: any; payment: any }> {
    return db.transaction(async (client) => {
      // Get slot
      const slot = await this.availabilityRepo.findById(slotId);
      if (!slot) {
        throw new NotFoundError('Availability slot');
      }

      if (slot.isBooked) {
        throw new ConflictError('Slot is already booked');
      }

      // Check if slot is in the future
      if (slot.startTime < new Date()) {
        throw new ValidationError('Cannot book past slots');
      }

      // Get doctor
      const doctor = await this.doctorRepo.findById(slot.doctorId);
      if (!doctor || !doctor.isAvailable) {
        throw new NotFoundError('Doctor or doctor not available');
      }

      // Book slot atomically
      const bookedSlot = await this.availabilityRepo.bookSlot(slotId, 'temp'); // Will update with real ID

      // Create consultation
      const consultation = await this.consultationRepo.create({
        patientId,
        doctorId: doctor.id,
        slotId: slotId,
        status: ConsultationStatus.SCHEDULED,
        scheduledAt: slot.startTime,
        symptoms: symptoms || undefined,
      });

      // Update slot with consultation ID
      await client.query(
        'UPDATE availability_slots SET consultation_id = $1 WHERE id = $2',
        [consultation.id, slotId]
      );

      // Create payment record
      const payment = await this.paymentRepo.create({
        consultationId: consultation.id,
        patientId,
        doctorId: doctor.id,
        amount: doctor.consultationFee,
        currency: 'USD',
        status: PaymentStatus.PENDING,
      });

      // Audit log
      await this.auditRepo.create({
        userId: patientId,
        action: AuditAction.BOOKING,
        resourceType: 'consultation',
        resourceId: consultation.id,
        details: { slotId, doctorId: doctor.id, amount: doctor.consultationFee },
      });

      return { consultation, payment };
    });
  }

  async cancelConsultation(
    consultationId: string,
    userId: string,
    isDoctor: boolean
  ): Promise<void> {
    const consultation = await this.consultationRepo.findById(consultationId);
    if (!consultation) {
      throw new NotFoundError('Consultation');
    }

    // Check authorization
    if (!isDoctor && consultation.patientId !== userId) {
      throw new ValidationError('Not authorized to cancel this consultation');
    }

    // Can only cancel scheduled consultations
    if (consultation.status !== ConsultationStatus.SCHEDULED) {
      throw new ValidationError('Can only cancel scheduled consultations');
    }

    await db.transaction(async () => {
      // Update consultation status
      await this.consultationRepo.update(consultationId, {
        status: ConsultationStatus.CANCELLED,
      });

      // Release slot
      await this.availabilityRepo.releaseSlot(consultation.slotId);

      // Refund payment if completed
      const payment = await this.paymentRepo.findByConsultationId(consultationId);
      if (payment && payment.status === PaymentStatus.COMPLETED) {
        await this.paymentRepo.update(payment.id, {
          status: PaymentStatus.REFUNDED,
        });
      }

      // Audit log
      await this.auditRepo.create({
        userId,
        action: AuditAction.UPDATE,
        resourceType: 'consultation',
        resourceId: consultationId,
        details: { action: 'cancel' },
      });
    });
  }

  async getAvailableSlots(
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const doctor = await this.doctorRepo.findById(doctorId);
    if (!doctor || !doctor.isAvailable) {
      throw new NotFoundError('Doctor or doctor not available');
    }

    return this.availabilityRepo.findAvailableSlots(doctorId, startDate, endDate);
  }
}

