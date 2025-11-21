import { db } from '../database/connection';
import { User, UserRole } from '../types';

export class UserRepository {
  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const result = await db.queryOne<User>(
      `INSERT INTO users (email, password_hash, role, is_email_verified, is_mfa_enabled, mfa_secret, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        user.email,
        user.passwordHash,
        user.role,
        user.isEmailVerified,
        user.isMfaEnabled,
        user.mfaSecret || null,
        user.isActive,
      ]
    );
    if (!result) throw new Error('Failed to create user');
    return this.mapRow(result);
  }

  async findById(id: string): Promise<User | null> {
    const result = await db.queryOne<User>('SELECT * FROM users WHERE id = $1', [id]);
    return result ? this.mapRow(result) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await db.queryOne<User>('SELECT * FROM users WHERE email = $1', [email]);
    return result ? this.mapRow(result) : null;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (updates.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    if (updates.passwordHash !== undefined) {
      fields.push(`password_hash = $${paramCount++}`);
      values.push(updates.passwordHash);
    }
    if (updates.role !== undefined) {
      fields.push(`role = $${paramCount++}`);
      values.push(updates.role);
    }
    if (updates.isEmailVerified !== undefined) {
      fields.push(`is_email_verified = $${paramCount++}`);
      values.push(updates.isEmailVerified);
    }
    if (updates.isMfaEnabled !== undefined) {
      fields.push(`is_mfa_enabled = $${paramCount++}`);
      values.push(updates.isMfaEnabled);
    }
    if (updates.mfaSecret !== undefined) {
      fields.push(`mfa_secret = $${paramCount++}`);
      values.push(updates.mfaSecret);
    }
    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(updates.isActive);
    }
    if (updates.lastLoginAt !== undefined) {
      fields.push(`last_login_at = $${paramCount++}`);
      values.push(updates.lastLoginAt);
    }

    if (fields.length === 0) {
      return this.findById(id) as Promise<User>;
    }

    values.push(id);
    const result = await db.queryOne<User>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    if (!result) throw new Error('User not found');
    return this.mapRow(result);
  }

  async delete(id: string): Promise<void> {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  }

  private mapRow(row: unknown): User {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      email: r.email as string,
      passwordHash: r.password_hash as string,
      role: r.role as UserRole,
      isEmailVerified: r.is_email_verified as boolean,
      isMfaEnabled: r.is_mfa_enabled as boolean,
      mfaSecret: r.mfa_secret as string | undefined,
      isActive: r.is_active as boolean,
      lastLoginAt: r.last_login_at ? new Date(r.last_login_at as string) : undefined,
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }
}

