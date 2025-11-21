import { Response, NextFunction } from 'express';
import { AuthorizationError } from '../utils/errors';
import { UserRole } from '../types';
import { AuthRequest } from './auth.middleware';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthorizationError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return next(new AuthorizationError('Insufficient permissions'));
    }

    next();
  };
}

export function requireSameUserOrAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new AuthorizationError('Authentication required'));
  }

  const requestedUserId = req.params.userId || req.body.userId;
  const isAdmin = req.user.role === UserRole.ADMIN;
  const isSameUser = req.user.userId === requestedUserId;

  if (!isAdmin && !isSameUser) {
    return next(new AuthorizationError('Insufficient permissions'));
  }

  next();
}

