import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';
import { planDayToDate, toISODateString } from '@/lib/calendar-utils';

/**
 * Unified calendar data endpoint — merges workout_logs with training_plan_days
 * so the calendar can show both logged and planned workouts.
 *
 * Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns: { items: CalendarItem[] }
 */

interface CalendarItem {
  id: string;
  date: string;
  session_type: string;
  title: string | null;
  description: string | null;
  duration_minutes: number | null;
  rpe_post: number | null;
  notes: string | null;
  completion_status: string | null;
  source: 'planned' | 'logged' | 'both';
  is_rest_day: boolean;
  training_plan_day_id: string | null;
  total_volume_kg: number | null;
  total_distance_km: number | null;
  training_load: number | null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { allowed } = apiLimiter.check(user.id);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { data: profile } = await supabase
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ items: [] });
    }

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing from/to params' },
        { status: 400 }
      );
    }

    // ── 1. Fetch workout_logs for the date range (no artificial cap) ──
    const { data: workoutLogs, error: logsErr } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('athlete_id', profile.id)
      .is('deleted_at', null)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: true });

    if (logsErr) {
      const log = createLogger({ route: 'GET /api/calendar-data', userId: user.id });
      log.error('Failed to fetch workout logs', { error: logsErr.message });
      return NextResponse.json({ error: logsErr.message }, { status: 500 });
    }

    // ── 2. Fetch active training plan with all weeks/days ──
    const { data: plan } = await supabase
      .from('training_plans')
      .select('id, start_date, duration_weeks, status')
      .eq('athlete_id', profile.id)
      .eq('status', 'active')
      .limit(1)
      .single();

    let planDaysInRange: Array<{
      id: string;
      date: string;
      day: {
        session_type: string | null;
        workout_title: string | null;
        workout_description: string | null;
        estimated_duration_minutes: number | null;
        is_rest_day: boolean | null;
        is_completed: boolean | null;
        linked_workout_log_id: string | null;
      };
    }> = [];

    if (plan?.start_date) {
      const { data: weeks } = await supabase
        .from('training_plan_weeks')
        .select(
          'id, week_number, training_plan_days(id, day_of_week, session_type, workout_title, workout_description, estimated_duration_minutes, is_rest_day, is_completed, linked_workout_log_id)'
        )
        .eq('training_plan_id', plan.id)
        .order('week_number', { ascending: true });

      if (weeks) {
        for (const week of weeks) {
          for (const day of week.training_plan_days ?? []) {
            const dayDate = planDayToDate(
              plan.start_date,
              week.week_number,
              day.day_of_week
            );
            const dateStr = toISODateString(dayDate);

            // Only include days within the requested range
            if (dateStr >= from && dateStr <= to) {
              planDaysInRange.push({ id: day.id, date: dateStr, day });
            }
          }
        }
      }
    }

    // ── 3. Merge plan days and workout logs ──
    // Build a set of plan_day_ids that have matching workout_logs
    const logsByPlanDayId = new Map<string, (typeof workoutLogs)[number]>();
    const logsWithoutPlan: (typeof workoutLogs)[number][] = [];

    for (const log of workoutLogs ?? []) {
      if (log.training_plan_day_id) {
        logsByPlanDayId.set(log.training_plan_day_id, log);
      } else {
        logsWithoutPlan.push(log);
      }
    }

    const items: CalendarItem[] = [];

    // Add plan days (merged with logs where linked)
    for (const pd of planDaysInRange) {
      const linkedLog = logsByPlanDayId.get(pd.id);

      if (linkedLog) {
        // Completed plan day with a logged workout — show logged data
        items.push({
          id: linkedLog.id,
          date: linkedLog.date.split('T')[0],
          session_type: linkedLog.session_type ?? pd.day.session_type ?? 'general',
          title: pd.day.workout_title ?? linkedLog.notes,
          description: pd.day.workout_description,
          duration_minutes: linkedLog.duration_minutes,
          rpe_post: linkedLog.rpe_post,
          notes: linkedLog.notes,
          completion_status: linkedLog.completion_status,
          source: 'both',
          is_rest_day: pd.day.is_rest_day ?? false,
          training_plan_day_id: pd.id,
          total_volume_kg: linkedLog.total_volume_kg,
          total_distance_km: linkedLog.total_distance_km,
          training_load: linkedLog.training_load,
        });
      } else if (!pd.day.is_rest_day) {
        // Planned but not yet logged (future or missed) — skip rest days
        items.push({
          id: pd.id,
          date: pd.date,
          session_type: pd.day.session_type ?? 'general',
          title: pd.day.workout_title,
          description: pd.day.workout_description,
          duration_minutes: pd.day.estimated_duration_minutes,
          rpe_post: null,
          notes: null,
          completion_status: pd.day.is_completed ? 'completed' : null,
          source: 'planned',
          is_rest_day: false,
          training_plan_day_id: pd.id,
          total_volume_kg: null,
          total_distance_km: null,
          training_load: null,
        });
      }
    }

    // Add logged workouts that are NOT linked to any plan day (ad-hoc)
    for (const log of logsWithoutPlan) {
      items.push({
        id: log.id,
        date: log.date.split('T')[0],
        session_type: log.session_type ?? 'general',
        title: log.notes,
        description: null,
        duration_minutes: log.duration_minutes,
        rpe_post: log.rpe_post,
        notes: log.notes,
        completion_status: log.completion_status,
        source: 'logged',
        is_rest_day: false,
        training_plan_day_id: null,
        total_volume_kg: log.total_volume_kg,
        total_distance_km: log.total_distance_km,
        training_load: log.training_load,
      });
    }

    // Also add logs that have training_plan_day_id but no matching plan day
    // in the current plan (orphaned links from old/deleted plans)
    if (workoutLogs) {
      const planDayIds = new Set(planDaysInRange.map((pd) => pd.id));
      for (const log of workoutLogs) {
        if (log.training_plan_day_id && !planDayIds.has(log.training_plan_day_id)) {
          items.push({
            id: log.id,
            date: log.date.split('T')[0],
            session_type: log.session_type ?? 'general',
            title: log.notes,
            description: null,
            duration_minutes: log.duration_minutes,
            rpe_post: log.rpe_post,
            notes: log.notes,
            completion_status: log.completion_status,
            source: 'logged',
            is_rest_day: false,
            training_plan_day_id: log.training_plan_day_id,
            total_volume_kg: log.total_volume_kg,
            total_distance_km: log.total_distance_km,
            training_load: log.training_load,
          });
        }
      }
    }

    // Sort by date
    items.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(
      { items },
      {
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
        },
      }
    );
  } catch (err) {
    const log = createLogger({ route: 'GET /api/calendar-data' });
    log.error('Calendar data fetch failed', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
