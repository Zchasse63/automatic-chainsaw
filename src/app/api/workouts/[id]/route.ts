import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: workout, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('id', id)
    .eq('athlete_id', profile.id)
    .is('deleted_at', null)
    .single();

  if (error || !workout) {
    return NextResponse.json(
      { error: 'Workout not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ workout });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const { date, session_type, duration_minutes, rpe_pre, rpe_post, notes, heart_rate_avg, completion_status, completed_workout } = body;
  const allowed: Record<string, unknown> = {};
  if (date !== undefined) allowed.date = date;
  if (session_type !== undefined) allowed.session_type = session_type;
  if (duration_minutes !== undefined) allowed.duration_minutes = duration_minutes;
  if (rpe_pre !== undefined) allowed.rpe_pre = rpe_pre;
  if (rpe_post !== undefined) allowed.rpe_post = rpe_post;
  if (notes !== undefined) allowed.notes = notes;
  if (heart_rate_avg !== undefined) allowed.heart_rate_avg = heart_rate_avg;
  if (completion_status !== undefined) allowed.completion_status = completion_status;
  if (completed_workout !== undefined) allowed.completed_workout = completed_workout;

  const { data: workout, error } = await supabase
    .from('workout_logs')
    .update(allowed)
    .eq('id', id)
    .eq('athlete_id', profile.id)
    .select()
    .single();

  if (error || !workout) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ workout });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Soft delete — verify ownership first
  const { error } = await supabase
    .from('workout_logs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('athlete_id', profile.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
