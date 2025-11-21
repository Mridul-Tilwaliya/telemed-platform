import { db } from '../database/connection';
import { Prescription, PaginationParams } from '../types';
import { getOffset } from '../utils/pagination';

export class PrescriptionRepository {
  async create(
    prescription: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Prescription> {
    const result = await db.queryOne<Prescription>(
      `INSERT INTO prescriptions (consultation_id, doctor_id, patient_id, medications, 
        instructions, follow_up_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        prescription.consultationId,
        prescription.doctorId,
        prescription.patientId,
        JSON.stringify(prescription.medications),
        prescription.instructions || null,
        prescription.followUpDate || null,
        prescription.isActive,
      ]
    );
    if (!result) throw new Error('Failed to create prescription');
    return this.mapRow(result);
  }

  async findById(id: string): Promise<Prescription | null> {
    const result = await db.queryOne<Prescription>(
      'SELECT * FROM prescriptions WHERE id = $1',
      [id]
    );
    return result ? this.mapRow(result) : null;
  }

  async findByConsultationId(consultationId: string): Promise<Prescription | null> {
    const result = await db.queryOne<Prescription>(
      'SELECT * FROM prescriptions WHERE consultation_id = $1',
      [consultationId]
    );
    return result ? this.mapRow(result) : null;
  }

  async findByPatientId(
    patientId: string,
    filters: { isActive?: boolean },
    pagination: PaginationParams
  ): Promise<{ prescriptions: Prescription[]; total: number }> {
    const offset = getOffset(pagination.page, pagination.limit);
    const conditions: string[] = ['patient_id = $1'];
    const params: unknown[] = [patientId];
    let paramCount = 2;

    if (filters.isActive !== undefined) {
      conditions.push(`is_active = $${paramCount++}`);
      params.push(filters.isActive);
    }

    const whereClause = conditions.join(' AND ');
    const orderBy = `ORDER BY ${pagination.sortBy} ${pagination.sortOrder}`;

    const prescriptions = await db.query<Prescription>(
      `SELECT * FROM prescriptions WHERE ${whereClause} ${orderBy} LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, pagination.limit, offset]
    );

    const totalResult = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM prescriptions WHERE ${whereClause}`,
      params
    );

    return {
      prescriptions: prescriptions.map((p) => this.mapRow(p)),
      total: totalResult ? parseInt(totalResult.count, 10) : 0,
    };
  }

  async update(id: string, updates: Partial<Prescription>): Promise<Prescription> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (updates.medications !== undefined) {
      fields.push(`medications = $${paramCount++}`);
      values.push(JSON.stringify(updates.medications));
    }
    if (updates.instructions !== undefined) {
      fields.push(`instructions = $${paramCount++}`);
      values.push(updates.instructions);
    }
    if (updates.followUpDate !== undefined) {
      fields.push(`follow_up_date = $${paramCount++}`);
      values.push(updates.followUpDate);
    }
    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(updates.isActive);
    }

    if (fields.length === 0) {
      return this.findById(id) as Promise<Prescription>;
    }

    values.push(id);
    const result = await db.queryOne<Prescription>(
      `UPDATE prescriptions SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    if (!result) throw new Error('Prescription not found');
    return this.mapRow(result);
  }

  private mapRow(row: unknown): Prescription {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      consultationId: r.consultation_id as string,
      doctorId: r.doctor_id as string,
      patientId: r.patient_id as string,
      medications: typeof r.medications === 'string' ? JSON.parse(r.medications) : (r.medications as any[]),
      instructions: r.instructions as string | undefined,
      followUpDate: r.follow_up_date ? new Date(r.follow_up_date as string) : undefined,
      isActive: r.is_active as boolean,
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }
}

