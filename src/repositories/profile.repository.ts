import { db } from '../database/connection';
import { Profile } from '../types';

export class ProfileRepository {
  async create(profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>): Promise<Profile> {
    const result = await db.queryOne<Profile>(
      `INSERT INTO profiles (user_id, first_name, last_name, phone, date_of_birth, gender, 
        address, city, state, zip_code, country, avatar_url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        profile.userId,
        profile.firstName,
        profile.lastName,
        profile.phone || null,
        profile.dateOfBirth || null,
        profile.gender || null,
        profile.address || null,
        profile.city || null,
        profile.state || null,
        profile.zipCode || null,
        profile.country || null,
        profile.avatarUrl || null,
        profile.metadata ? JSON.stringify(profile.metadata) : null,
      ]
    );
    if (!result) throw new Error('Failed to create profile');
    return this.mapRow(result);
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const result = await db.queryOne<Profile>(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId]
    );
    return result ? this.mapRow(result) : null;
  }

  async update(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'userId' && key !== 'createdAt' && key !== 'updatedAt') {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (key === 'metadata') {
          fields.push(`${dbKey} = $${paramCount++}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${dbKey} = $${paramCount++}`);
          values.push(value);
        }
      }
    });

    if (fields.length === 0) {
      return this.findByUserId(userId) as Promise<Profile>;
    }

    values.push(userId);
    const result = await db.queryOne<Profile>(
      `UPDATE profiles SET ${fields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
      values
    );
    if (!result) throw new Error('Profile not found');
    return this.mapRow(result);
  }

  private mapRow(row: unknown): Profile {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      firstName: r.first_name as string,
      lastName: r.last_name as string,
      phone: r.phone as string | undefined,
      dateOfBirth: r.date_of_birth ? new Date(r.date_of_birth as string) : undefined,
      gender: r.gender as string | undefined,
      address: r.address as string | undefined,
      city: r.city as string | undefined,
      state: r.state as string | undefined,
      zipCode: r.zip_code as string | undefined,
      country: r.country as string | undefined,
      avatarUrl: r.avatar_url as string | undefined,
      metadata: r.metadata ? (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata) : undefined,
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }
}

