import { z } from 'zod';

const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  instructions: z.string().optional(),
});

export const createPrescriptionSchema = z.object({
  params: z.object({
    consultationId: z.string().uuid('Invalid consultation ID'),
  }),
  body: z.object({
    medications: z.array(medicationSchema).min(1, 'At least one medication is required'),
    instructions: z.string().optional(),
    followUpDate: z.string().date().optional(),
  }),
});

export const getPrescriptionsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    isActive: z.string().transform((val) => val === 'true').optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

