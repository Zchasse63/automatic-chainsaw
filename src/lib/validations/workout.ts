import { z } from 'zod';

const SESSION_TYPES = [
  'run', 'hiit', 'strength', 'simulation', 'recovery',
  'station_practice', 'general',
] as const;

export const createWorkoutSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  session_type: z.enum(SESSION_TYPES).optional().default('general'),
  duration_minutes: z.number().int().min(1).max(600).nullable().optional(),
  rpe_pre: z.number().min(1).max(10).nullable().optional(),
  rpe_post: z.number().min(1).max(10).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  completed_workout: z.record(z.string(), z.unknown()).nullable().optional(),
  prescribed_workout: z.record(z.string(), z.unknown()).nullable().optional(),
  training_plan_day_id: z.string().uuid().nullable().optional(),
  heart_rate_avg: z.number().int().min(30).max(250).nullable().optional(),
  completion_status: z.enum(['completed', 'partial', 'skipped']).optional().default('completed'),
});

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
