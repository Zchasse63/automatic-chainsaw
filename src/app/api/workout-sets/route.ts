import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

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

    const searchParams = request.nextUrl.searchParams;
    const workoutLogId = searchParams.get('workout_log_id');

    if (!workoutLogId) {
      return NextResponse.json(
        { error: 'workout_log_id is required' },
        { status: 400 }
      );
    }

    // Verify the workout log belongs to this user via athlete_profiles
    const { data: profile } = await supabase
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ sets: [] });
    }

    const { data: workoutLog } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('id', workoutLogId)
      .eq('athlete_id', profile.id)
      .single();

    if (!workoutLog) {
      return NextResponse.json(
        { error: 'Workout log not found' },
        { status: 404 }
      );
    }

    const { data: sets, error } = await supabase
      .from('workout_sets')
      .select('*')
      .eq('workout_log_id', workoutLogId)
      .order('set_number', { ascending: true });

    if (error) {
      const log = createLogger({ route: 'GET /api/workout-sets', userId: user.id });
      log.error('Failed to fetch workout sets', { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { sets: sets ?? [] },
      {
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
        },
      }
    );
  } catch (err) {
    const log = createLogger({ route: 'GET /api/workout-sets' });
    log.error('Workout sets fetch failed', { error: String(err) });
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

    // Critical #4: Rate limit POST
    const { allowed } = apiLimiter.check(user.id);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!body.workout_log_id || !body.exercise_name || body.set_number == null) {
      return NextResponse.json(
        { error: 'workout_log_id, exercise_name, and set_number are required' },
        { status: 400 }
      );
    }

    // Verify the workout log belongs to this user
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

    const { data: workoutLog } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('id', body.workout_log_id)
      .eq('athlete_id', profile.id)
      .single();

    if (!workoutLog) {
      return NextResponse.json(
        { error: 'Workout log not found' },
        { status: 404 }
      );
    }

    const { data: set, error } = await supabase
      .from('workout_sets')
      .insert({
        workout_log_id: body.workout_log_id,
        exercise_name: body.exercise_name,
        exercise_category: body.exercise_category ?? null,
        set_number: body.set_number,
        reps: body.reps ?? null,
        weight_kg: body.weight_kg ?? null,
        distance_meters: body.distance_meters ?? null,
        duration_seconds: body.duration_seconds ?? null,
        pace: body.pace ?? null,
        status: body.status ?? null,
        rpe: body.rpe ?? null,
        notes: body.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      const log = createLogger({ route: 'POST /api/workout-sets', userId: user.id });
      log.error('Failed to create workout set', { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ set }, { status: 201 });
  } catch (err) {
    const log = createLogger({ route: 'POST /api/workout-sets' });
    log.error('Workout set creation failed', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Critical #4: Rate limit PATCH
    const { allowed } = apiLimiter.check(user.id);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!body.id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Critical #3: Verify ownership BEFORE revealing set existence.
    // Get user's profile first, then join through workout_logs to verify the set belongs to them.
    const { data: profile } = await supabase
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Set not found' },
        { status: 404 }
      );
    }

    // Single query: find the set only if it belongs to a workout_log owned by this user
    const { data: ownedSet } = await supabase
      .from('workout_sets')
      .select('id, workout_log_id, workout_logs!inner(athlete_id)')
      .eq('id', body.id)
      .eq('workout_logs.athlete_id', profile.id)
      .single();

    if (!ownedSet) {
      // Uniform 404 whether the set doesn't exist or isn't theirs
      return NextResponse.json(
        { error: 'Set not found' },
        { status: 404 }
      );
    }

    // Build update object from allowed fields only
    const { id, ...updates } = body;
    const allowedFields = [
      'exercise_name',
      'exercise_category',
      'set_number',
      'reps',
      'weight_kg',
      'distance_meters',
      'duration_seconds',
      'pace',
      'status',
      'rpe',
      'notes',
    ];

    const sanitizedUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: set, error } = await supabase
      .from('workout_sets')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const log = createLogger({ route: 'PATCH /api/workout-sets', userId: user.id });
      log.error('Failed to update workout set', { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ set });
  } catch (err) {
    const log = createLogger({ route: 'PATCH /api/workout-sets' });
    log.error('Workout set update failed', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
