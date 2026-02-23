import type { SupabaseClient } from '@supabase/supabase-js';

export interface ReadinessResult {
  score: number;
  components: Record<string, number>;
  weakest: string;
}

const WEIGHTS = {
  consistency: 0.2,
  volume: 0.15,
  run_fitness: 0.2,
  station_prep: 0.15,
  plan_adherence: 0.15,
  recovery: 0.05,
  race_specific: 0.1,
} as const;

/**
 * Compute race readiness score (0-100) with 7 weighted components.
 * Shared between the dashboard API route and the AI coach tool.
 */
export async function computeReadinessScore(
  athleteId: string,
  supabase: SupabaseClient,
): Promise<ReadinessResult> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [workoutsResult, planResult] = await Promise.all([
    supabase
      .from('workout_logs')
      .select('session_type, duration_minutes, rpe_post, date')
      .eq('athlete_id', athleteId)
      .is('deleted_at', null)
      .gte('date', monthAgo),
    supabase
      .from('training_plans')
      .select('id')
      .eq('athlete_id', athleteId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle(),
  ]);

  const workouts = workoutsResult.data ?? [];
  const thisWeek = workouts.filter((w) => w.date && w.date >= weekAgo);

  // Plan adherence
  let adherence = 0;
  if (planResult.data) {
    const { data: weeks } = await supabase
      .from('training_plan_weeks')
      .select('training_plan_days(is_completed, is_rest_day)')
      .eq('training_plan_id', planResult.data.id);
    const allDays = weeks?.flatMap(
      (w) => (w.training_plan_days as Array<{ is_completed: boolean; is_rest_day: boolean }>) ?? [],
    ) ?? [];
    const nonRest = allDays.filter((d) => !d.is_rest_day);
    const completed = nonRest.filter((d) => d.is_completed);
    adherence = nonRest.length > 0 ? Math.round((completed.length / nonRest.length) * 100) : 0;
  }

  // Components (0-100 each)
  const runCount = workouts.filter((w) => w.session_type === 'run').length;
  const stationCount = workouts.filter(
    (w) => w.session_type && ['hiit', 'station_practice', 'simulation'].includes(w.session_type),
  ).length;

  const components: Record<string, number> = {
    consistency: Math.round(Math.min(100, thisWeek.length * 20)),
    volume: Math.round(
      Math.min(100, (thisWeek.reduce((s, w) => s + (w.duration_minutes ?? 0), 0) / 300) * 100),
    ),
    run_fitness: Math.round(Math.min(100, runCount * 10)),
    station_prep: Math.round(Math.min(100, stationCount * 15)),
    plan_adherence: Math.round(adherence),
    recovery: Math.round(
      thisWeek.length > 0
        ? Math.min(100, Math.max(
            0,
            100 - ((thisWeek.reduce((s, w) => s + (w.rpe_post ?? 5), 0) / thisWeek.length) - 5) * 20,
          ))
        : 50,
    ),
    race_specific: workouts.some((w) => w.session_type === 'simulation') ? 80 : 30,
  };

  const score = Math.round(
    Object.entries(components).reduce(
      (s, [k, v]) => s + v * (WEIGHTS[k as keyof typeof WEIGHTS] ?? 0.1),
      0,
    ),
  );

  const weakest = Object.entries(components).reduce((a, b) => (b[1] < a[1] ? b : a))[0];

  return { score, components, weakest };
}
