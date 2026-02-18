import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkAndAwardAchievements } from '@/lib/achievements';

export async function GET(request: NextRequest) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ workouts: workouts ?? [] });
}

export async function POST(request: Request) {
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

  const body = await request.json();

  const { data: workout, error } = await supabase
    .from('workout_logs')
    .insert({
      athlete_id: profile.id,
      date: body.date || new Date().toISOString().split('T')[0],
      session_type: body.session_type || 'general',
      duration_minutes: body.duration_minutes || null,
      rpe_pre: body.rpe_pre || null,
      rpe_post: body.rpe_post || null,
      notes: body.notes || null,
      completed_workout: body.completed_workout || null,
      prescribed_workout: body.prescribed_workout || null,
      training_plan_day_id: body.training_plan_day_id || null,
      heart_rate_avg: body.heart_rate_avg || null,
      completion_status: body.completion_status || 'completed',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-complete the training plan day and link the workout log
  if (body.training_plan_day_id && workout) {
    await supabase
      .from('training_plan_days')
      .update({
        is_completed: true,
        linked_workout_log_id: workout.id,
      })
      .eq('id', body.training_plan_day_id);
  }

  let newAchievements: string[] = [];
  try {
    newAchievements = await checkAndAwardAchievements(profile.id, supabase, 'workout');
  } catch {
    // non-blocking — workout already succeeded
  }

  return NextResponse.json({ workout, newAchievements }, { status: 201 });
}
