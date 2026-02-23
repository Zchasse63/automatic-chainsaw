import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createTrainingPlanTools(athleteId: string, supabase: SupabaseClient) {
  return {
    get_today_workout: tool({
      description: "Get the athlete's scheduled workout for today from their active training plan.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const { data: plan } = await supabase
            .from('training_plans')
            .select('id, start_date, duration_weeks')
            .eq('athlete_id', athleteId)
            .eq('status', 'active')
            .limit(1)
            .single();
          if (!plan?.start_date) return { workout: null, message: 'No active training plan.' };

          const now = new Date();
          const todayDow = (now.getDay() + 6) % 7;
          const startDate = new Date(plan.start_date);
          const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
          const currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1);

          const { data: weeks } = await supabase
            .from('training_plan_weeks')
            .select('id, week_number, training_plan_days(*)')
            .eq('training_plan_id', plan.id)
            .eq('week_number', currentWeek)
            .single();

          if (!weeks) return { workout: null, message: `No data for week ${currentWeek}.` };

          const todayDay = (weeks.training_plan_days as Array<Record<string, unknown>>)?.find(
            (d) => d.day_of_week === todayDow
          );
          if (!todayDay) return { workout: null, message: 'No workout scheduled today.' };
          return { workout: todayDay, week: currentWeek };
        } catch {
          return { error: true, message: 'Unable to fetch today workout. Please try again.' };
        }
      },
    }),

    get_training_plan: tool({
      description: "Get the athlete's active training plan overview with all weeks and days.",
      inputSchema: z.object({
        week_number: z.number().optional().describe('Specific week number to fetch'),
      }),
      execute: async ({ week_number }) => {
        try {
          const { data: plan } = await supabase
            .from('training_plans')
            .select('id, plan_name, goal, start_date, duration_weeks, status')
            .eq('athlete_id', athleteId)
            .eq('status', 'active')
            .limit(1)
            .single();
          if (!plan) return { plan: null, message: 'No active training plan.' };

          let weeksQuery = supabase
            .from('training_plan_weeks')
            .select('week_number, focus, training_plan_days(day_of_week, session_type, workout_title, workout_description, estimated_duration_minutes, is_rest_day, is_completed)')
            .eq('training_plan_id', plan.id)
            .order('week_number', { ascending: true });

          if (week_number) weeksQuery = weeksQuery.eq('week_number', week_number);

          const { data: weeks } = await weeksQuery;
          return { plan: { ...plan, weeks: weeks ?? [] } };
        } catch {
          return { error: true, message: 'Unable to fetch training plan. Please try again.' };
        }
      },
    }),

    update_training_plan_day: tool({
      description: 'Update a specific day in the training plan (modify workout, mark complete, etc).',
      inputSchema: z.object({
        day_id: z.string().describe('The training_plan_day ID'),
        workout_title: z.string().optional(),
        workout_description: z.string().optional(),
        session_type: z.enum(['run', 'hiit', 'strength', 'simulation', 'recovery', 'station_practice', 'general']).optional(),
        is_completed: z.boolean().optional(),
      }),
      execute: async ({ day_id, ...updates }) => {
        // Verify the day belongs to this athlete's plan before updating
        const { data: dayRow } = await supabase
          .from('training_plan_days')
          .select('id, training_plan_weeks(training_plan_id)')
          .eq('id', day_id)
          .single();

        if (!dayRow) return { success: false, error: 'Training plan day not found.' };

        const weeks = dayRow.training_plan_weeks as unknown as { training_plan_id: string } | { training_plan_id: string }[] | null;
        const planId = Array.isArray(weeks) ? weeks[0]?.training_plan_id : weeks?.training_plan_id;
        if (!planId) return { success: false, error: 'Training plan day not found.' };

        const { data: plan } = await supabase
          .from('training_plans')
          .select('id')
          .eq('id', planId)
          .eq('athlete_id', athleteId)
          .single();

        if (!plan) return { success: false, error: 'Training plan day not found.' };

        const updateData: Record<string, unknown> = {};
        if (updates.workout_title !== undefined) updateData.workout_title = updates.workout_title;
        if (updates.workout_description !== undefined) updateData.workout_description = updates.workout_description;
        if (updates.session_type !== undefined) updateData.session_type = updates.session_type;
        if (updates.is_completed !== undefined) updateData.is_completed = updates.is_completed;

        const { data, error } = await supabase
          .from('training_plan_days')
          .update(updateData)
          .eq('id', day_id)
          .select('id, day_of_week, workout_title, session_type, is_completed')
          .single();
        if (error) return { success: false, error: error.message };
        return { success: true, day: data };
      },
    }),
  };
}
