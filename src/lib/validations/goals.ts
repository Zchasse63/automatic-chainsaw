import { z } from 'zod';

export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).nullable().optional(),
  goal_type: z.enum(['race_time', 'station_time', 'fitness', 'custom']).optional().default('custom'),
  target_value: z.number().nullable().optional(),
  current_value: z.number().optional().default(0),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').nullable().optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
