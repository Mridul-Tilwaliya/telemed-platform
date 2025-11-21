import { db } from '../database/connection';
import { AvailabilitySlot } from '../types';

export class AvailabilityRepository {
  async create(slot: Omit<AvailabilitySlot, 'id' | 'createdAt' | 'updatedAt'>): Promise<AvailabilitySlot> {
    // Check for overlapping slots
    const overlapping = await db.query<AvailabilitySlot>(
      `SELECT * FROM availability_slots 
       WHERE doctor_id = $1 
       AND is_booked = false
       AND (
         (start_time <= $2 AND end_time > $2) OR
         (start_time < $3 AND end_time >= $3) OR
         (start_time >= $2 AND end_time <= $3)
       )`,
      [slot.doctorId, slot.startTime, slot.endTime]
    );

    if (overlapping.length > 0) {
      throw new Error('Slot overlaps with existing availability');
    }

    const result = await db.queryOne<AvailabilitySlot>(
      `INSERT INTO availability_slots (doctor_id, start_time, end_time, is_booked, consultation_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        slot.doctorId,
        slot.startTime,
        slot.endTime,
        slot.isBooked,
        slot.consultationId || null,
      ]
    );
    if (!result) throw new Error('Failed to create availability slot');
    return this.mapRow(result);
  }

  async findById(id: string): Promise<AvailabilitySlot | null> {
    const result = await db.queryOne<AvailabilitySlot>(
      'SELECT * FROM availability_slots WHERE id = $1',
      [id]
    );
    return result ? this.mapRow(result) : null;
  }

  async findByDoctorId(
    doctorId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AvailabilitySlot[]> {
    let query = 'SELECT * FROM availability_slots WHERE doctor_id = $1';
    const params: unknown[] = [doctorId];
    let paramCount = 2;

    if (startDate) {
      query += ` AND start_time >= $${paramCount++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND end_time <= $${paramCount++}`;
      params.push(endDate);
    }

    query += ' ORDER BY start_time ASC';

    const results = await db.query<AvailabilitySlot>(query, params);
    return results.map((r) => this.mapRow(r));
  }

  async findAvailableSlots(
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AvailabilitySlot[]> {
    const results = await db.query<AvailabilitySlot>(
      `SELECT * FROM availability_slots 
       WHERE doctor_id = $1 
       AND is_booked = false 
       AND start_time >= $2 
       AND end_time <= $3
       ORDER BY start_time ASC`,
      [doctorId, startDate, endDate]
    );
    return results.map((r) => this.mapRow(r));
  }

  async bookSlot(id: string, consultationId: string): Promise<AvailabilitySlot> {
    const result = await db.queryOne<AvailabilitySlot>(
      `UPDATE availability_slots 
       SET is_booked = true, consultation_id = $1 
       WHERE id = $2 AND is_booked = false
       RETURNING *`,
      [consultationId, id]
    );
    if (!result) throw new Error('Slot not available or already booked');
    return this.mapRow(result);
  }

  async releaseSlot(id: string): Promise<AvailabilitySlot> {
    const result = await db.queryOne<AvailabilitySlot>(
      `UPDATE availability_slots 
       SET is_booked = false, consultation_id = NULL 
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    if (!result) throw new Error('Slot not found');
    return this.mapRow(result);
  }

  async delete(id: string): Promise<void> {
    await db.query('DELETE FROM availability_slots WHERE id = $1 AND is_booked = false', [id]);
  }

  private mapRow(row: unknown): AvailabilitySlot {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      doctorId: r.doctor_id as string,
      startTime: new Date(r.start_time as string),
      endTime: new Date(r.end_time as string),
      isBooked: r.is_booked as boolean,
      consultationId: r.consultation_id as string | undefined,
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }
}

