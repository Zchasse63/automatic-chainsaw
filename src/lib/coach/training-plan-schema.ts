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

// ── Structured Exercise Schema ────────────────────────────
// Used in workout_details to give per-exercise structure
// that the workout execution UI can render as interactive cards.

export const ExerciseSchema = z.object({
  name: z.string().describe('Exercise name, e.g. "SkiErg", "Sled Push", "Back Squat"'),
  sets: z.number().optional().describe('Number of sets'),
  reps: z.number().optional().describe('Reps per set (omit for time/distance-based)'),
  weight_kg: z.number().optional().describe('Load in kg (omit for bodyweight)'),
  distance_m: z.number().optional().describe('Distance in meters per set'),
  duration_seconds: z.number().optional().describe('Duration in seconds per set (for timed holds, carries, etc.)'),
  rest_seconds: z.number().optional().describe('Rest between sets in seconds'),
  notes: z.string().optional().describe('Form cues, tempo, modifications'),
});

export const WorkoutDetailsSchema = z.object({
  warmup: z.array(ExerciseSchema).optional().describe('Warm-up exercises'),
  main: z.array(ExerciseSchema).describe('Main workout exercises'),
  cooldown: z.array(ExerciseSchema).optional().describe('Cool-down / stretching'),
});

export type Exercise = z.infer<typeof ExerciseSchema>;
export type WorkoutDetails = z.infer<typeof WorkoutDetailsSchema>;

export const TrainingPlanDaySchema = z.object({
  day_of_week: z.number().min(0).max(6), // 0=Monday, 6=Sunday
  session_type: z.enum(SESSION_TYPES).optional(),
  workout_title: z.string(),
  workout_description: z.string().optional(),
  workout_details: WorkoutDetailsSchema.optional(),
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
