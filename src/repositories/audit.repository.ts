import { db } from '../database/connection';
import { AuditLog, AuditAction, PaginationParams } from '../types';
import { getOffset } from '../utils/pagination';

export class AuditRepository {
  async create(auditLog: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const result = await db.queryOne<AuditLog>(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        auditLog.userId,
        auditLog.action,
        auditLog.resourceType,
        auditLog.resourceId || null,
        auditLog.details ? JSON.stringify(auditLog.details) : null,
        auditLog.ipAddress || null,
        auditLog.userAgent || null,
      ]
    );
    if (!result) throw new Error('Failed to create audit log');
    return this.mapRow(result);
  }

  async findByUserId(userId: string, pagination: PaginationParams): Promise<{ logs: AuditLog[]; total: number }> {
    const offset = getOffset(pagination.page, pagination.limit);
    
    const logs = await db.query<AuditLog>(
      `SELECT * FROM audit_logs 
       WHERE user_id = $1 
       ORDER BY ${pagination.sortBy} ${pagination.sortOrder} 
       LIMIT $2 OFFSET $3`,
      [userId, pagination.limit, offset]
    );

    const totalResult = await db.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM audit_logs WHERE user_id = $1',
      [userId]
    );

    return {
      logs: logs.map((l) => this.mapRow(l)),
      total: totalResult ? parseInt(totalResult.count, 10) : 0,
    };
  }

  async findByResource(
    resourceType: string,
    resourceId: string,
    pagination: PaginationParams
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const offset = getOffset(pagination.page, pagination.limit);
    
    const logs = await db.query<AuditLog>(
      `SELECT * FROM audit_logs 
       WHERE resource_type = $1 AND resource_id = $2 
       ORDER BY ${pagination.sortBy} ${pagination.sortOrder} 
       LIMIT $3 OFFSET $4`,
      [resourceType, resourceId, pagination.limit, offset]
    );

    const totalResult = await db.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM audit_logs WHERE resource_type = $1 AND resource_id = $2',
      [resourceType, resourceId]
    );

    return {
      logs: logs.map((l) => this.mapRow(l)),
      total: totalResult ? parseInt(totalResult.count, 10) : 0,
    };
  }

  async findByAction(action: AuditAction, pagination: PaginationParams): Promise<{ logs: AuditLog[]; total: number }> {
    const offset = getOffset(pagination.page, pagination.limit);
    
    const logs = await db.query<AuditLog>(
      `SELECT * FROM audit_logs 
       WHERE action = $1 
       ORDER BY ${pagination.sortBy} ${pagination.sortOrder} 
       LIMIT $2 OFFSET $3`,
      [action, pagination.limit, offset]
    );

    const totalResult = await db.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM audit_logs WHERE action = $1',
      [action]
    );

    return {
      logs: logs.map((l) => this.mapRow(l)),
      total: totalResult ? parseInt(totalResult.count, 10) : 0,
    };
  }

  private mapRow(row: unknown): AuditLog {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      action: r.action as AuditAction,
      resourceType: r.resource_type as string,
      resourceId: r.resource_id as string | undefined,
      details: r.details ? (typeof r.details === 'string' ? JSON.parse(r.details) : r.details) : undefined,
      ipAddress: r.ip_address as string | undefined,
      userAgent: r.user_agent as string | undefined,
      createdAt: new Date(r.created_at as string),
    };
  }
}

