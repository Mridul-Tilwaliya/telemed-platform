import { db } from '../database/connection';

export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

export class RefreshTokenRepository {
  async create(token: Omit<RefreshToken, 'id' | 'createdAt'>): Promise<RefreshToken> {
    const result = await db.queryOne<RefreshToken>(
      `INSERT INTO refresh_tokens (user_id, token, expires_at, is_revoked)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [token.userId, token.token, token.expiresAt, token.isRevoked]
    );
    if (!result) throw new Error('Failed to create refresh token');
    return this.mapRow(result);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const result = await db.queryOne<RefreshToken>(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND is_revoked = false AND expires_at > NOW()',
      [token]
    );
    return result ? this.mapRow(result) : null;
  }

  async revokeToken(token: string): Promise<void> {
    await db.query('UPDATE refresh_tokens SET is_revoked = true WHERE token = $1', [token]);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await db.query('UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1', [userId]);
  }

  async deleteExpiredTokens(): Promise<number> {
    const result = await db.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM refresh_tokens WHERE expires_at < NOW()'
    );
    await db.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
    return result ? parseInt(result.count, 10) : 0;
  }

  private mapRow(row: unknown): RefreshToken {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      token: r.token as string,
      expiresAt: new Date(r.expires_at as string),
      isRevoked: r.is_revoked as boolean,
      createdAt: new Date(r.created_at as string),
    };
  }
}

