import { z } from 'zod';

export const createDailyMetricsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  hrv_ms: z.number().min(0).max(300).nullable().optional(),
  rhr_bpm: z.number().int().min(20).max(200).nullable().optional(),
  sleep_hours: z.number().min(0).max(24).nullable().optional(),
  stress_score: z.number().min(0).max(100).nullable().optional(),
  recovery_score: z.number().min(0).max(100).nullable().optional(),
  readiness_score: z.number().min(0).max(100).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  source: z.enum(['manual', 'whoop', 'garmin', 'oura', 'apple_watch']).nullable().optional(),
});

export type CreateDailyMetricsInput = z.infer<typeof createDailyMetricsSchema>;
