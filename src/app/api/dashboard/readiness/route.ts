import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('athlete_profiles').select('*').eq('user_id', user.id).single();
  if (!profile) return NextResponse.json({ score: 0, components: {}, weakest: '' });

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Get recent workouts
  const { data: recentWorkouts } = await supabase
    .from('workout_logs')
    .select('session_type, duration_minutes, rpe_post, date')
    .eq('athlete_id', profile.id)
    .is('deleted_at', null)
    .gte('date', monthAgo);

  const workouts = recentWorkouts ?? [];
  const thisWeek = workouts.filter((w) => w.date && w.date >= weekAgo);

  // Get active plan adherence
  const { data: plan } = await supabase
    .from('training_plans')
    .select('id').eq('athlete_id', profile.id).eq('status', 'active').limit(1).single();

  let adherence = 0;
  if (plan) {
    const { data: weeks } = await supabase
      .from('training_plan_weeks')
      .select('training_plan_days(is_completed, is_rest_day)')
      .eq('training_plan_id', plan.id);
    const allDays = weeks?.flatMap((w) => (w.training_plan_days as Array<{ is_completed: boolean; is_rest_day: boolean }>) ?? []) ?? [];
    const nonRest = allDays.filter((d) => !d.is_rest_day);
    const completed = nonRest.filter((d) => d.is_completed);
    adherence = nonRest.length > 0 ? Math.round((completed.length / nonRest.length) * 100) : 0;
  }

  // Components (0-100 each)
  const consistency = Math.min(100, thisWeek.length * 20); // 5 workouts/week = 100%
  const volume = Math.min(100, Math.round((thisWeek.reduce((s, w) => s + (w.duration_minutes ?? 0), 0) / 300) * 100));
  const runCount = workouts.filter((w) => w.session_type === 'run').length;
  const stationCount = workouts.filter((w) => w.session_type && ['hiit', 'station_practice', 'simulation'].includes(w.session_type)).length;
  const runFitness = Math.min(100, runCount * 10);
  const stationPrep = Math.min(100, stationCount * 15);
  const planFollow = adherence;
  const recovery = thisWeek.length > 0
    ? Math.max(0, 100 - ((thisWeek.reduce((s, w) => s + (w.rpe_post ?? 5), 0) / thisWeek.length) - 5) * 20)
    : 50;
  const raceSpecific = workouts.filter((w) => w.session_type === 'simulation').length > 0 ? 80 : 30;

  const components: Record<string, number> = {
    consistency: Math.round(consistency),
    volume: Math.round(volume),
    run_fitness: Math.round(runFitness),
    station_prep: Math.round(stationPrep),
    plan_adherence: Math.round(planFollow),
    recovery: Math.round(recovery),
    race_specific: Math.round(raceSpecific),
  };

  const weights = { consistency: 0.2, volume: 0.15, run_fitness: 0.2, station_prep: 0.15, plan_adherence: 0.15, recovery: 0.05, race_specific: 0.1 };
  const score = Math.round(
    Object.entries(components).reduce((s, [k, v]) => s + v * (weights[k as keyof typeof weights] ?? 0.1), 0)
  );

  const weakest = Object.entries(components).reduce((a, b) => (b[1] < a[1] ? b : a))[0];

  return NextResponse.json({ score, components, weakest });
}
