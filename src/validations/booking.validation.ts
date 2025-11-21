import { z } from 'zod';

export const bookConsultationSchema = z.object({
  body: z.object({
    slotId: z.string().uuid('Invalid slot ID'),
    symptoms: z.string().optional(),
  }),
});

export const getAvailableSlotsSchema = z.object({
  params: z.object({
    doctorId: z.string().uuid('Invalid doctor ID'),
  }),
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const cancelConsultationSchema = z.object({
  params: z.object({
    consultationId: z.string().uuid('Invalid consultation ID'),
  }),
});

