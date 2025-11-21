import { z } from 'zod';

export const startConsultationSchema = z.object({
  params: z.object({
    consultationId: z.string().uuid('Invalid consultation ID'),
  }),
});

export const completeConsultationSchema = z.object({
  params: z.object({
    consultationId: z.string().uuid('Invalid consultation ID'),
  }),
  body: z.object({
    diagnosis: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const addRatingSchema = z.object({
  params: z.object({
    consultationId: z.string().uuid('Invalid consultation ID'),
  }),
  body: z.object({
    rating: z.number().min(1).max(5),
    feedback: z.string().optional(),
  }),
});

export const getConsultationsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

