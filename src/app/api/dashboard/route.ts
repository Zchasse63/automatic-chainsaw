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

  // Streak calculation needs a wider window (90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data: recentWorkouts } = await supabase
    .from('workout_logs')
    .select('id, duration_minutes, rpe_post, session_type, date')
    .eq('athlete_id', profile.id)
    .is('deleted_at', null)
    .gte('date', ninetyDaysAgo)
    .order('date', { ascending: false });

  const weekWorkouts = recentWorkouts?.filter((w) => w.date && w.date >= weekAgo) ?? [];
  const workoutsThisWeek = weekWorkouts.length;
  const totalMinutes =
    weekWorkouts.reduce((sum, w) => sum + (w.duration_minutes ?? 0), 0);
  const avgRpe =
    workoutsThisWeek > 0
      ? weekWorkouts.reduce((sum, w) => sum + (w.rpe_post ?? 0), 0) /
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

  // Active training plan + today's workout
  let activePlan: {
    id: string;
    plan_name: string;
    currentWeek: number;
    totalWeeks: number;
    progressPct: number;
  } | null = null;
  let todaysWorkout: {
    id: string;
    session_type: string | null;
    workout_title: string | null;
    estimated_duration_minutes: number | null;
    is_completed: boolean | null;
  } | null = null;

  const { data: plan } = await supabase
    .from('training_plans')
    .select('id, plan_name, start_date, duration_weeks, status')
    .eq('athlete_id', profile.id)
    .eq('status', 'active')
    .limit(1)
    .single();

  if (plan && plan.start_date) {
    const startDate = new Date(plan.start_date);
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1);
    const totalWeeks = plan.duration_weeks ?? 1;

    // Get all days to compute progress
    const { data: weeks } = await supabase
      .from('training_plan_weeks')
      .select('id, week_number, training_plan_days(id, day_of_week, session_type, workout_title, estimated_duration_minutes, is_rest_day, is_completed)')
      .eq('training_plan_id', plan.id)
      .order('week_number', { ascending: true });

    const allDays = weeks?.flatMap((w) => w.training_plan_days ?? []) ?? [];
    const activeDays = allDays.filter((d) => !d.is_rest_day);
    const completedDays = activeDays.filter((d) => d.is_completed).length;
    const progressPct = activeDays.length > 0 ? Math.round((completedDays / activeDays.length) * 100) : 0;

    activePlan = {
      id: plan.id,
      plan_name: plan.plan_name,
      currentWeek: Math.min(currentWeek, totalWeeks),
      totalWeeks,
      progressPct,
    };

    // Find today's workout: current week + today's day_of_week (0=Mon, 6=Sun)
    const todayDow = (now.getDay() + 6) % 7; // JS Sunday=0 → our Monday=0
    if (weeks && currentWeek <= totalWeeks) {
      const currentWeekData = weeks.find((w) => w.week_number === currentWeek);
      if (currentWeekData) {
        const todayDay = currentWeekData.training_plan_days?.find(
          (d) => d.day_of_week === todayDow && !d.is_rest_day
        );
        if (todayDay) {
          todaysWorkout = {
            id: todayDay.id,
            session_type: todayDay.session_type,
            workout_title: todayDay.workout_title,
            estimated_duration_minutes: todayDay.estimated_duration_minutes,
            is_completed: todayDay.is_completed,
          };
        }
      }
    }
  }

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
    activePlan,
    todaysWorkout,
  });
}
