import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkAndAwardAchievements } from '@/lib/achievements';
import { apiLimiter } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';
import { createWorkoutSchema } from '@/lib/validations/workout';
import type { Json } from '@/types/database';

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
      return NextResponse.json({ workouts: [] });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 50);
    const offset = Number(searchParams.get('offset') || '0');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = supabase
      .from('workout_logs')
      .select('*')
      .eq('athlete_id', profile.id)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);

    const { data: workouts, error } = await query;

    if (error) {
      const log = createLogger({ route: 'GET /api/workouts', userId: user.id });
      log.error('Failed to fetch workouts', { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { workouts: workouts ?? [] },
      {
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
        },
      }
    );
  } catch (err) {
    const log = createLogger({ route: 'GET /api/workouts' });
    log.error('Workouts fetch failed', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 400 }
      );
    }

    let rawBody;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = createWorkoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const body = parsed.data;

    const { data: workout, error } = await supabase
      .from('workout_logs')
      .insert({
        athlete_id: profile.id,
        date: body.date || new Date().toISOString().split('T')[0],
        session_type: body.session_type,
        duration_minutes: body.duration_minutes ?? null,
        rpe_pre: body.rpe_pre ?? null,
        rpe_post: body.rpe_post ?? null,
        notes: body.notes ?? null,
        completed_workout: (body.completed_workout ?? null) as Json,
        prescribed_workout: (body.prescribed_workout ?? null) as Json,
        training_plan_day_id: body.training_plan_day_id ?? null,
        heart_rate_avg: body.heart_rate_avg ?? null,
        completion_status: body.completion_status,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-complete the training plan day and link the workout log (with ownership check)
    if (body.training_plan_day_id && workout) {
      const { data: ownedDay } = await supabase
        .from('training_plan_days')
        .select('id, training_plan_weeks!inner(training_plans!inner(athlete_id))')
        .eq('id', body.training_plan_day_id)
        .single();

      const planData = ownedDay?.training_plan_weeks as unknown as { training_plans: { athlete_id: string } } | null;
      if (planData?.training_plans?.athlete_id === profile.id) {
        await supabase
          .from('training_plan_days')
          .update({
            is_completed: true,
            linked_workout_log_id: workout.id,
          })
          .eq('id', body.training_plan_day_id);
      }
    }

    let newAchievements: string[] = [];
    try {
      newAchievements = await checkAndAwardAchievements(profile.id, supabase, 'workout');
    } catch (err) {
      const log = createLogger({ route: 'POST /api/workouts', userId: user.id });
      log.warn('Achievement check failed', { error: String(err) });
    }

    return NextResponse.json({ workout, newAchievements }, { status: 201 });
  } catch (err) {
    const log = createLogger({ route: 'POST /api/workouts' });
    log.error('Workout creation failed', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
