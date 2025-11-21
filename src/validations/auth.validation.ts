import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['patient', 'doctor', 'admin', 'support']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
    mfaToken: z.string().optional(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const setupMFASchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
});

export const enableMFASchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    token: z.string().length(6, 'MFA token must be 6 digits'),
  }),
});

export const disableMFASchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    password: z.string().min(1, 'Password is required'),
  }),
});

