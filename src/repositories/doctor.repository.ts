import { db } from '../database/connection';
import { Doctor } from '../types';
import { PaginationParams } from '../types';
import { getOffset } from '../utils/pagination';

export class DoctorRepository {
  async create(doctor: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Doctor> {
    const result = await db.queryOne<Doctor>(
      `INSERT INTO doctors (user_id, license_number, specialization, years_of_experience,
        consultation_fee, bio, qualifications, languages, is_available, rating, total_consultations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        doctor.userId,
        doctor.licenseNumber,
        doctor.specialization,
        doctor.yearsOfExperience,
        doctor.consultationFee,
        doctor.bio || null,
        doctor.qualifications || null,
        doctor.languages || null,
        doctor.isAvailable,
        doctor.rating || null,
        doctor.totalConsultations || 0,
      ]
    );
    if (!result) throw new Error('Failed to create doctor');
    return this.mapRow(result);
  }

  async findById(id: string): Promise<Doctor | null> {
    const result = await db.queryOne<Doctor>('SELECT * FROM doctors WHERE id = $1', [id]);
    return result ? this.mapRow(result) : null;
  }

  async findByUserId(userId: string): Promise<Doctor | null> {
    const result = await db.queryOne<Doctor>('SELECT * FROM doctors WHERE user_id = $1', [userId]);
    return result ? this.mapRow(result) : null;
  }

  async findAvailable(
    filters: {
      specialization?: string;
      minRating?: number;
      search?: string;
    },
    pagination: PaginationParams
  ): Promise<{ doctors: Doctor[]; total: number }> {
    const offset = getOffset(pagination.page, pagination.limit);
    const conditions: string[] = ['is_available = true'];
    const params: unknown[] = [];
    let paramCount = 1;

    if (filters.specialization) {
      conditions.push(`specialization = $${paramCount++}`);
      params.push(filters.specialization);
    }

    if (filters.minRating) {
      conditions.push(`rating >= $${paramCount++}`);
      params.push(filters.minRating);
    }

    if (filters.search) {
      conditions.push(
        `(specialization ILIKE $${paramCount} OR bio ILIKE $${paramCount})`
      );
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = `ORDER BY ${pagination.sortBy} ${pagination.sortOrder}`;

    const doctors = await db.query<Doctor>(
      `SELECT * FROM doctors ${whereClause} ${orderBy} LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, pagination.limit, offset]
    );

    const totalResult = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM doctors ${whereClause}`,
      params
    );

    return {
      doctors: doctors.map((d) => this.mapRow(d)),
      total: totalResult ? parseInt(totalResult.count, 10) : 0,
    };
  }

  async update(id: string, updates: Partial<Doctor>): Promise<Doctor> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (updates.specialization !== undefined) {
      fields.push(`specialization = $${paramCount++}`);
      values.push(updates.specialization);
    }
    if (updates.yearsOfExperience !== undefined) {
      fields.push(`years_of_experience = $${paramCount++}`);
      values.push(updates.yearsOfExperience);
    }
    if (updates.consultationFee !== undefined) {
      fields.push(`consultation_fee = $${paramCount++}`);
      values.push(updates.consultationFee);
    }
    if (updates.bio !== undefined) {
      fields.push(`bio = $${paramCount++}`);
      values.push(updates.bio);
    }
    if (updates.qualifications !== undefined) {
      fields.push(`qualifications = $${paramCount++}`);
      values.push(updates.qualifications);
    }
    if (updates.languages !== undefined) {
      fields.push(`languages = $${paramCount++}`);
      values.push(updates.languages);
    }
    if (updates.isAvailable !== undefined) {
      fields.push(`is_available = $${paramCount++}`);
      values.push(updates.isAvailable);
    }
    if (updates.rating !== undefined) {
      fields.push(`rating = $${paramCount++}`);
      values.push(updates.rating);
    }
    if (updates.totalConsultations !== undefined) {
      fields.push(`total_consultations = $${paramCount++}`);
      values.push(updates.totalConsultations);
    }

    if (fields.length === 0) {
      return this.findById(id) as Promise<Doctor>;
    }

    values.push(id);
    const result = await db.queryOne<Doctor>(
      `UPDATE doctors SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    if (!result) throw new Error('Doctor not found');
    return this.mapRow(result);
  }

  private mapRow(row: unknown): Doctor {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      licenseNumber: r.license_number as string,
      specialization: r.specialization as string,
      yearsOfExperience: r.years_of_experience as number,
      consultationFee: parseFloat(r.consultation_fee as string),
      bio: r.bio as string | undefined,
      qualifications: r.qualifications as string[] | undefined,
      languages: r.languages as string[] | undefined,
      isAvailable: r.is_available as boolean,
      rating: r.rating ? parseFloat(r.rating as string) : undefined,
      totalConsultations: r.total_consultations as number | undefined,
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }
}

