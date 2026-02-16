import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('athlete_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 400 });
  }

  // Race countdown
  let daysUntilRace: number | null = null;
  if (profile.race_date) {
    daysUntilRace = Math.ceil(
      (new Date(profile.race_date).getTime() - Date.now()) /
        (24 * 60 * 60 * 1000)
    );
    if (daysUntilRace < 0) daysUntilRace = null;
  }

  // Weekly training summary (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data: recentWorkouts } = await supabase
    .from('workout_logs')
    .select('id, duration_minutes, rpe_post, session_type, date')
    .eq('athlete_id', profile.id)
    .is('deleted_at', null)
    .gte('date', weekAgo)
    .order('date', { ascending: false });

  const workoutsThisWeek = recentWorkouts?.length ?? 0;
  const totalMinutes =
    recentWorkouts?.reduce((sum, w) => sum + (w.duration_minutes ?? 0), 0) ??
    0;
  const avgRpe =
    workoutsThisWeek > 0
      ? (recentWorkouts?.reduce((sum, w) => sum + (w.rpe_post ?? 0), 0) ?? 0) /
        workoutsThisWeek
      : null;

  // Training streak (consecutive days with workouts)
  let streak = 0;
  if (recentWorkouts && recentWorkouts.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = 0; d < 30; d++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - d);
      const dateStr = checkDate.toISOString().split('T')[0];

      const hasWorkout = recentWorkouts.some(
        (w) => w.date && w.date.startsWith(dateStr)
      );

      if (hasWorkout) {
        streak++;
      } else if (d > 0) {
        break;
      }
    }
  }

  // Recent PRs (last 30 days)
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data: recentPRs } = await supabase
    .from('personal_records')
    .select('id, record_type, exercise_name, value, value_unit, date_achieved')
    .eq('athlete_id', profile.id)
    .gte('date_achieved', monthAgo)
    .order('date_achieved', { ascending: false })
    .limit(5);

  // Active goals
  const { data: goals } = await supabase
    .from('goals')
    .select('id, title, target_value, current_value, target_date, status')
    .eq('athlete_id', profile.id)
    .eq('status', 'active')
    .order('target_date', { ascending: true })
    .limit(3);

  // Last conversation snippet
  const { data: lastConv } = await supabase
    .from('conversations')
    .select('id, title, updated_at')
    .eq('athlete_id', profile.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({
    profile: {
      display_name: profile.display_name,
      race_date: profile.race_date,
      goal_time_minutes: profile.goal_time_minutes,
      current_phase: profile.current_phase,
      hyrox_division: profile.hyrox_division,
    },
    daysUntilRace,
    weeklyStats: {
      workouts: workoutsThisWeek,
      totalMinutes,
      avgRpe: avgRpe ? Math.round(avgRpe * 10) / 10 : null,
    },
    streak,
    recentPRs: recentPRs ?? [],
    goals: goals ?? [],
    lastConversation: lastConv ?? null,
  });
}
