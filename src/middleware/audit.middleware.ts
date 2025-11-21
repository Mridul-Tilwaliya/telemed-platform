import { Request, Response, NextFunction } from 'express';
import { AuditRepository } from '../repositories/audit.repository';
import { AuditAction } from '../types';
import { AuthRequest } from './auth.middleware';

const ACTION_MAP: Record<string, AuditAction> = {
  POST: AuditAction.CREATE,
  PUT: AuditAction.UPDATE,
  PATCH: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

export function auditLog(
  resourceType: string,
  getResourceId?: (req: Request) => string | undefined
) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // Only log after successful requests
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          const auditRepo = new AuditRepository();
          const action = ACTION_MAP[req.method] || AuditAction.UPDATE;
          const resourceId = getResourceId ? getResourceId(req) : req.params.id;

          await auditRepo.create({
            userId: req.user.userId,
            action,
            resourceType,
            resourceId,
            details: {
              method: req.method,
              path: req.path,
              ...(req.body && Object.keys(req.body).length > 0 && { body: req.body }),
            },
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
          });
        } catch (error) {
          // Don't fail the request if audit logging fails
          console.error('Audit logging failed', error);
        }
      }
    });

    next();
  };
}

