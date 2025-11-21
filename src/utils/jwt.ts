import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtPayload, UserRole } from '../types';

export function generateAccessToken(payload: {
  userId: string;
  email: string;
  role: UserRole;
}): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessTokenExpiry,
    issuer: 'amrutam-api',
    audience: 'amrutam-client',
  });
}

export function generateRefreshToken(payload: {
  userId: string;
  email: string;
  role: UserRole;
}): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshTokenExpiry,
    issuer: 'amrutam-api',
    audience: 'amrutam-client',
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.jwt.secret, {
      issuer: 'amrutam-api',
      audience: 'amrutam-client',
    }) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.jwt.refreshSecret, {
      issuer: 'amrutam-api',
      audience: 'amrutam-client',
    }) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

