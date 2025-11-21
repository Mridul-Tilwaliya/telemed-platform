import { db } from '../database/connection';
import { Consultation, ConsultationStatus, PaginationParams } from '../types';
import { getOffset } from '../utils/pagination';

export class ConsultationRepository {
  async create(
    consultation: Omit<Consultation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Consultation> {
    const result = await db.queryOne<Consultation>(
      `INSERT INTO consultations (patient_id, doctor_id, slot_id, status, scheduled_at, 
        started_at, ended_at, symptoms, diagnosis, notes, rating, feedback, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        consultation.patientId,
        consultation.doctorId,
        consultation.slotId,
        consultation.status,
        consultation.scheduledAt,
        consultation.startedAt || null,
        consultation.endedAt || null,
        consultation.symptoms || null,
        consultation.diagnosis || null,
        consultation.notes || null,
        consultation.rating || null,
        consultation.feedback || null,
        consultation.metadata ? JSON.stringify(consultation.metadata) : null,
      ]
    );
    if (!result) throw new Error('Failed to create consultation');
    return this.mapRow(result);
  }

  async findById(id: string): Promise<Consultation | null> {
    const result = await db.queryOne<Consultation>(
      'SELECT * FROM consultations WHERE id = $1',
      [id]
    );
    return result ? this.mapRow(result) : null;
  }

  async findByPatientId(
    patientId: string,
    filters: { status?: ConsultationStatus },
    pagination: PaginationParams
  ): Promise<{ consultations: Consultation[]; total: number }> {
    const offset = getOffset(pagination.page, pagination.limit);
    const conditions: string[] = ['patient_id = $1'];
    const params: unknown[] = [patientId];
    let paramCount = 2;

    if (filters.status) {
      conditions.push(`status = $${paramCount++}`);
      params.push(filters.status);
    }

    const whereClause = conditions.join(' AND ');
    const orderBy = `ORDER BY ${pagination.sortBy} ${pagination.sortOrder}`;

    const consultations = await db.query<Consultation>(
      `SELECT * FROM consultations WHERE ${whereClause} ${orderBy} LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, pagination.limit, offset]
    );

    const totalResult = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM consultations WHERE ${whereClause}`,
      params
    );

    return {
      consultations: consultations.map((c) => this.mapRow(c)),
      total: totalResult ? parseInt(totalResult.count, 10) : 0,
    };
  }

  async findByDoctorId(
    doctorId: string,
    filters: { status?: ConsultationStatus },
    pagination: PaginationParams
  ): Promise<{ consultations: Consultation[]; total: number }> {
    const offset = getOffset(pagination.page, pagination.limit);
    const conditions: string[] = ['doctor_id = $1'];
    const params: unknown[] = [doctorId];
    let paramCount = 2;

    if (filters.status) {
      conditions.push(`status = $${paramCount++}`);
      params.push(filters.status);
    }

    const whereClause = conditions.join(' AND ');
    const orderBy = `ORDER BY ${pagination.sortBy} ${pagination.sortOrder}`;

    const consultations = await db.query<Consultation>(
      `SELECT * FROM consultations WHERE ${whereClause} ${orderBy} LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, pagination.limit, offset]
    );

    const totalResult = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM consultations WHERE ${whereClause}`,
      params
    );

    return {
      consultations: consultations.map((c) => this.mapRow(c)),
      total: totalResult ? parseInt(totalResult.count, 10) : 0,
    };
  }

  async update(id: string, updates: Partial<Consultation>): Promise<Consultation> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.startedAt !== undefined) {
      fields.push(`started_at = $${paramCount++}`);
      values.push(updates.startedAt);
    }
    if (updates.endedAt !== undefined) {
      fields.push(`ended_at = $${paramCount++}`);
      values.push(updates.endedAt);
    }
    if (updates.symptoms !== undefined) {
      fields.push(`symptoms = $${paramCount++}`);
      values.push(updates.symptoms);
    }
    if (updates.diagnosis !== undefined) {
      fields.push(`diagnosis = $${paramCount++}`);
      values.push(updates.diagnosis);
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${paramCount++}`);
      values.push(updates.notes);
    }
    if (updates.rating !== undefined) {
      fields.push(`rating = $${paramCount++}`);
      values.push(updates.rating);
    }
    if (updates.feedback !== undefined) {
      fields.push(`feedback = $${paramCount++}`);
      values.push(updates.feedback);
    }
    if (updates.metadata !== undefined) {
      fields.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(updates.metadata));
    }

    if (fields.length === 0) {
      return this.findById(id) as Promise<Consultation>;
    }

    values.push(id);
    const result = await db.queryOne<Consultation>(
      `UPDATE consultations SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    if (!result) throw new Error('Consultation not found');
    return this.mapRow(result);
  }

  private mapRow(row: unknown): Consultation {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      patientId: r.patient_id as string,
      doctorId: r.doctor_id as string,
      slotId: r.slot_id as string,
      status: r.status as ConsultationStatus,
      scheduledAt: new Date(r.scheduled_at as string),
      startedAt: r.started_at ? new Date(r.started_at as string) : undefined,
      endedAt: r.ended_at ? new Date(r.ended_at as string) : undefined,
      symptoms: r.symptoms as string | undefined,
      diagnosis: r.diagnosis as string | undefined,
      notes: r.notes as string | undefined,
      rating: r.rating as number | undefined,
      feedback: r.feedback as string | undefined,
      metadata: r.metadata ? (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata) : undefined,
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }
}

