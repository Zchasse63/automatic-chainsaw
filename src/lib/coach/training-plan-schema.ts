import { z } from 'zod';

export const SESSION_TYPES = [
  'run',
  'hiit',
  'strength',
  'simulation',
  'recovery',
  'station_practice',
  'general',
] as const;

export const TrainingPlanDaySchema = z.object({
  day_of_week: z.number().min(0).max(6), // 0=Monday, 6=Sunday
  session_type: z.enum(SESSION_TYPES).optional(),
  workout_title: z.string(),
  workout_description: z.string().optional(),
  workout_details: z.record(z.string(), z.unknown()).optional(),
  estimated_duration_minutes: z.number().optional(),
  is_rest_day: z.boolean().default(false),
});

export const TrainingPlanWeekSchema = z.object({
  week_number: z.number().min(1),
  focus: z.string().optional(),
  notes: z.string().optional(),
  target_volume_hours: z.number().optional(),
  days: z.array(TrainingPlanDaySchema).min(1).max(7),
});

export const TrainingPlanSchema = z.object({
  plan_name: z.string(),
  goal: z.string().optional(),
  duration_weeks: z.number().min(1).max(52),
  start_date: z.string().optional(),
  difficulty: z.string().optional(),
  weeks: z.array(TrainingPlanWeekSchema).min(1),
});

export type TrainingPlanInput = z.infer<typeof TrainingPlanSchema>;
export type TrainingPlanWeekInput = z.infer<typeof TrainingPlanWeekSchema>;
export type TrainingPlanDayInput = z.infer<typeof TrainingPlanDaySchema>;
