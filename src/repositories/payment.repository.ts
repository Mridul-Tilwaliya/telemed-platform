import { db } from '../database/connection';
import { Payment, PaymentStatus, PaginationParams } from '../types';
import { getOffset } from '../utils/pagination';

export class PaymentRepository {
  async create(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
    const result = await db.queryOne<Payment>(
      `INSERT INTO payments (consultation_id, patient_id, doctor_id, amount, currency, 
        status, payment_method, transaction_id, paid_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        payment.consultationId,
        payment.patientId,
        payment.doctorId,
        payment.amount,
        payment.currency,
        payment.status,
        payment.paymentMethod || null,
        payment.transactionId || null,
        payment.paidAt || null,
        payment.metadata ? JSON.stringify(payment.metadata) : null,
      ]
    );
    if (!result) throw new Error('Failed to create payment');
    return this.mapRow(result);
  }

  async findById(id: string): Promise<Payment | null> {
    const result = await db.queryOne<Payment>(
      'SELECT * FROM payments WHERE id = $1',
      [id]
    );
    return result ? this.mapRow(result) : null;
  }

  async findByConsultationId(consultationId: string): Promise<Payment | null> {
    const result = await db.queryOne<Payment>(
      'SELECT * FROM payments WHERE consultation_id = $1',
      [consultationId]
    );
    return result ? this.mapRow(result) : null;
  }

  async findByPatientId(
    patientId: string,
    filters: { status?: PaymentStatus },
    pagination: PaginationParams
  ): Promise<{ payments: Payment[]; total: number }> {
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

    const payments = await db.query<Payment>(
      `SELECT * FROM payments WHERE ${whereClause} ${orderBy} LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, pagination.limit, offset]
    );

    const totalResult = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM payments WHERE ${whereClause}`,
      params
    );

    return {
      payments: payments.map((p) => this.mapRow(p)),
      total: totalResult ? parseInt(totalResult.count, 10) : 0,
    };
  }

  async update(id: string, updates: Partial<Payment>): Promise<Payment> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.paymentMethod !== undefined) {
      fields.push(`payment_method = $${paramCount++}`);
      values.push(updates.paymentMethod);
    }
    if (updates.transactionId !== undefined) {
      fields.push(`transaction_id = $${paramCount++}`);
      values.push(updates.transactionId);
    }
    if (updates.paidAt !== undefined) {
      fields.push(`paid_at = $${paramCount++}`);
      values.push(updates.paidAt);
    }
    if (updates.metadata !== undefined) {
      fields.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(updates.metadata));
    }

    if (fields.length === 0) {
      return this.findById(id) as Promise<Payment>;
    }

    values.push(id);
    const result = await db.queryOne<Payment>(
      `UPDATE payments SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    if (!result) throw new Error('Payment not found');
    return this.mapRow(result);
  }

  private mapRow(row: unknown): Payment {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      consultationId: r.consultation_id as string,
      patientId: r.patient_id as string,
      doctorId: r.doctor_id as string,
      amount: parseFloat(r.amount as string),
      currency: r.currency as string,
      status: r.status as PaymentStatus,
      paymentMethod: r.payment_method as string | undefined,
      transactionId: r.transaction_id as string | undefined,
      paidAt: r.paid_at ? new Date(r.paid_at as string) : undefined,
      metadata: r.metadata ? (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata) : undefined,
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }
}

