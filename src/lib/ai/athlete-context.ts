import type { SupabaseClient } from '@supabase/supabase-js';

interface AthleteProfile {
  id: string;
  display_name: string | null;
  date_of_birth: string | null;
  sex: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  hyrox_division: string | null;
  hyrox_race_count: number | null;
  training_history: Record<string, unknown> | null;
  current_phase: string | null;
  race_date: string | null;
  goal_time_minutes: number | null;
  weekly_availability_hours: number | null;
  equipment_available: string[] | null;
  injuries_limitations: string[] | null;
}

export function buildAthleteProfileMessage(
  profile: AthleteProfile
): string | null {
  const parts: string[] = [];

  if (profile.display_name) parts.push(`Name: ${profile.display_name}`);

  if (profile.date_of_birth) {
    const age = Math.floor(
      (Date.now() - new Date(profile.date_of_birth).getTime()) /
        (365.25 * 24 * 60 * 60 * 1000)
    );
    parts.push(`${age}yo`);
  }

  if (profile.sex) parts.push(profile.sex);
  if (profile.weight_kg) parts.push(`${profile.weight_kg}kg`);
  if (profile.height_cm) parts.push(`${profile.height_cm}cm`);

  if (profile.hyrox_division)
    parts.push(`Division: ${profile.hyrox_division}`);
  if (profile.hyrox_race_count !== null)
    parts.push(`${profile.hyrox_race_count} Hyrox races completed`);

  const history = profile.training_history as Record<string, unknown> | null;
  if (history) {
    if (history.experience) parts.push(`Experience: ${history.experience}`);
    if (history.run_mpw) parts.push(`runs ${history.run_mpw}mi/week`);
    if (history.strength_days)
      parts.push(`${history.strength_days} strength days/week`);
  }

  if (profile.weekly_availability_hours)
    parts.push(`${profile.weekly_availability_hours}h/week available`);

  if (profile.race_date) {
    const daysUntil = Math.ceil(
      (new Date(profile.race_date).getTime() - Date.now()) /
        (24 * 60 * 60 * 1000)
    );
    if (daysUntil > 0) {
      parts.push(`race in ${daysUntil} days`);
    } else {
      parts.push('race date has passed');
    }
  }

  if (profile.goal_time_minutes)
    parts.push(`goal: ${profile.goal_time_minutes} min`);

  if (profile.current_phase)
    parts.push(`phase: ${profile.current_phase.replace(/_/g, ' ')}`);

  if (profile.equipment_available && profile.equipment_available.length > 0)
    parts.push(`equipment: ${profile.equipment_available.join(', ')}`);

  if (profile.injuries_limitations && profile.injuries_limitations.length > 0)
    parts.push(
      `injuries/limitations: ${profile.injuries_limitations.join(', ')}`
    );

  if (parts.length === 0) return null;

  return `Athlete profile: ${parts.join(', ')}`;
}

/**
 * Pre-fetch athlete training stats (weekly workouts, PRs, active plan status)
 * so the model doesn't need to call get_athlete_stats as a tool.
 * All 3 queries run in parallel — adds ~50ms to route setup, saves a full
 * model round-trip (~5-15s) every time the model would have called the tool.
 */
export async function buildAthleteStatsMessage(
  athleteId: string,
  supabase: SupabaseClient,
): Promise<string | null> {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Run all 3 queries in parallel
    const [workoutsResult, prsResult, planResult] = await Promise.all([
      supabase
        .from('workout_logs')
        .select('id, duration_minutes, rpe_post, session_type, date')
        .eq('athlete_id', athleteId)
        .is('deleted_at', null)
        .gte('date', weekAgo),
      supabase
        .from('personal_records')
        .select('record_type, exercise_name, value, value_unit, date_achieved')
        .eq('athlete_id', athleteId)
        .order('date_achieved', { ascending: false })
        .limit(5),
      supabase
        .from('training_plans')
        .select('plan_name, status, duration_weeks, start_date')
        .eq('athlete_id', athleteId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle(),
    ]);

    const recentWorkouts = workoutsResult.data ?? [];
    const prs = prsResult.data ?? [];
    const activePlan = planResult.data;

    const parts: string[] = [];

    // Weekly training summary
    const workoutCount = recentWorkouts.length;
    const totalMinutes = recentWorkouts.reduce(
      (s, w) => s + (w.duration_minutes ?? 0),
      0,
    );
    const avgRpe =
      workoutCount > 0
        ? Math.round(
            (recentWorkouts.reduce((s, w) => s + (w.rpe_post ?? 0), 0) /
              workoutCount) *
              10,
          ) / 10
        : null;

    parts.push(`This week: ${workoutCount} workouts, ${totalMinutes} minutes total`);
    if (avgRpe !== null) parts.push(`avg RPE ${avgRpe}/10`);

    // Session type breakdown
    const byType: Record<string, number> = {};
    for (const w of recentWorkouts) {
      byType[w.session_type] = (byType[w.session_type] || 0) + 1;
    }
    if (Object.keys(byType).length > 0) {
      const breakdown = Object.entries(byType)
        .map(([type, count]) => `${count} ${type}`)
        .join(', ');
      parts.push(`breakdown: ${breakdown}`);
    }

    // Recent PRs
    if (prs.length > 0) {
      const prLines = prs.map(
        (pr) =>
          `${pr.exercise_name ?? pr.record_type}: ${pr.value} ${pr.value_unit ?? ''}`.trim(),
      );
      parts.push(`Recent PRs: ${prLines.join('; ')}`);
    } else {
      parts.push('No PRs recorded yet');
    }

    // Active plan status
    if (activePlan) {
      const startDate = new Date(activePlan.start_date!);
      const diffDays = Math.floor(
        (Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000),
      );
      const currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1);
      parts.push(
        `Active plan: "${activePlan.plan_name}" — week ${currentWeek} of ${activePlan.duration_weeks}`,
      );
    } else {
      parts.push('No active training plan');
    }

    return `Current training stats: ${parts.join('. ')}.`;
  } catch {
    // Non-critical — if this fails the model can still call get_athlete_stats
    return null;
  }
}
