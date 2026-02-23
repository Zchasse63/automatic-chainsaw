import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createWorkoutTools(athleteId: string, userId: string, supabase: SupabaseClient) {
  return {
    create_workout_log: tool({
      description: 'Log a completed workout for the athlete.',
      inputSchema: z.object({
        date: z.string().describe('Workout date YYYY-MM-DD'),
        session_type: z.enum(['run', 'hiit', 'strength', 'simulation', 'recovery', 'station_practice', 'general']),
        duration_minutes: z.number().optional().describe('Duration in minutes'),
        rpe_post: z.number().min(1).max(10).optional().describe('RPE 1-10'),
        notes: z.string().optional(),
        total_volume_kg: z.number().optional().describe('Total weight volume in kg (sum of all sets: weight x reps)'),
        total_distance_km: z.number().optional().describe('Total distance in km'),
        training_load: z.number().min(0).max(1000).optional().describe('Training load score 0-1000 (duration x RPE)'),
      }),
      execute: async ({ date, session_type, duration_minutes, rpe_post, notes, total_volume_kg, total_distance_km, training_load }) => {
        const { data, error } = await supabase
          .from('workout_logs')
          .insert({
            athlete_id: athleteId,
            date,
            session_type,
            duration_minutes: duration_minutes ?? null,
            rpe_post: rpe_post ?? null,
            notes: notes ?? null,
            total_volume_kg: total_volume_kg ?? null,
            total_distance_km: total_distance_km ?? null,
            training_load: training_load ?? null,
            completion_status: 'completed',
          })
          .select('id, date, session_type, duration_minutes, rpe_post, total_volume_kg, total_distance_km, training_load')
          .single();
        if (error) return { success: false, error: error.message };
        return { success: true, workout: data };
      },
    }),

    get_workout_sets: tool({
      description:
        "Get the individual sets logged for a specific workout — reps, weight, distance, pace, RPE per set. Use when the athlete asks about their performance on specific exercises within a workout or wants set-level analysis.",
      inputSchema: z.object({
        workout_log_id: z.string().describe('The workout log ID to fetch sets for'),
      }),
      execute: async ({ workout_log_id }) => {
        try {
          const { data: workout } = await supabase
            .from('workout_logs')
            .select('id')
            .eq('id', workout_log_id)
            .eq('athlete_id', athleteId)
            .is('deleted_at', null)
            .single();

          if (!workout) {
            return { sets: [], message: 'Workout not found.' };
          }

          const { data: sets } = await supabase
            .from('workout_sets')
            .select('exercise_name, exercise_category, set_number, reps, weight_kg, distance_meters, duration_seconds, pace, status, rpe, notes')
            .eq('workout_log_id', workout_log_id)
            .order('exercise_name')
            .order('set_number', { ascending: true });

          return { sets: sets ?? [] };
        } catch {
          return { error: true, message: 'Unable to fetch workout sets.' };
        }
      },
    }),

    get_daily_metrics: tool({
      description:
        "Get the athlete's daily biometric data — HRV, resting heart rate, sleep, stress, recovery, and readiness scores. Use this to assess recovery status before recommending training intensity.",
      inputSchema: z.object({
        days: z.number().optional().describe('Number of days to look back (default 7, max 30)'),
      }),
      execute: async ({ days = 7 }) => {
        try {
          const lookback = Math.min(days, 30);
          const since = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];

          const { data: metrics } = await supabase
            .from('daily_metrics')
            .select('date, hrv_ms, rhr_bpm, sleep_hours, stress_score, recovery_score, readiness_score, source')
            .eq('user_id', userId)
            .gte('date', since)
            .order('date', { ascending: false });

          if (!metrics || metrics.length === 0) {
            return { metrics: [], message: 'No biometric data recorded yet.' };
          }

          const withHrv = metrics.filter((m) => m.hrv_ms != null);
          const withRhr = metrics.filter((m) => m.rhr_bpm != null);
          const withSleep = metrics.filter((m) => m.sleep_hours != null);

          return {
            metrics,
            averages: {
              hrv_ms: withHrv.length > 0
                ? Math.round(withHrv.reduce((s, m) => s + m.hrv_ms!, 0) / withHrv.length)
                : null,
              rhr_bpm: withRhr.length > 0
                ? Math.round(withRhr.reduce((s, m) => s + m.rhr_bpm!, 0) / withRhr.length)
                : null,
              sleep_hours: withSleep.length > 0
                ? Math.round((withSleep.reduce((s, m) => s + Number(m.sleep_hours!), 0) / withSleep.length) * 10) / 10
                : null,
            },
          };
        } catch {
          return { error: true, message: 'Unable to fetch daily metrics.' };
        }
      },
    }),

    log_daily_metrics: tool({
      description:
        "Log the athlete's daily biometric data (HRV, resting heart rate, sleep, stress, etc). Upserts — calling with the same date updates the existing entry.",
      inputSchema: z.object({
        date: z.string().describe('Date YYYY-MM-DD'),
        hrv_ms: z.number().optional().describe('Heart rate variability in milliseconds'),
        rhr_bpm: z.number().optional().describe('Resting heart rate in bpm'),
        sleep_hours: z.number().optional().describe('Sleep duration in hours (e.g. 7.5)'),
        stress_score: z.number().min(0).max(100).optional().describe('Stress score 0-100'),
        recovery_score: z.number().min(0).max(100).optional().describe('Recovery score 0-100'),
        readiness_score: z.number().min(0).max(100).optional().describe('Readiness score 0-100'),
        notes: z.string().optional(),
        source: z.enum(['manual', 'whoop', 'garmin', 'oura', 'apple_watch']).optional(),
      }),
      execute: async ({ date, hrv_ms, rhr_bpm, sleep_hours, stress_score, recovery_score, readiness_score, notes, source }) => {
        const { data, error } = await supabase
          .from('daily_metrics')
          .upsert(
            {
              user_id: userId,
              date,
              hrv_ms: hrv_ms ?? null,
              rhr_bpm: rhr_bpm ?? null,
              sleep_hours: sleep_hours ?? null,
              stress_score: stress_score ?? null,
              recovery_score: recovery_score ?? null,
              readiness_score: readiness_score ?? null,
              notes: notes ?? null,
              source: source ?? 'manual',
            },
            { onConflict: 'user_id,date' },
          )
          .select('date, hrv_ms, rhr_bpm, sleep_hours, recovery_score, readiness_score')
          .single();
        if (error) return { success: false, error: error.message };
        return { success: true, metric: data };
      },
    }),
  };
}
