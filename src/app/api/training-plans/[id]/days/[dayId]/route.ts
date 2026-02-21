import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

// PATCH /api/training-plans/:id/days/:dayId — Update a training plan day
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  try {
    const { id: planId, dayId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the plan belongs to the user
    const { data: profile } = await supabase
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: plan } = await supabase
      .from('training_plans')
      .select('id')
      .eq('id', planId)
      .eq('athlete_id', profile.id)
      .single();

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { workout_title, workout_description, session_type, estimated_duration_minutes, is_rest_day, is_completed, workout_details } = body;
    const allowed: Record<string, unknown> = {};
    if (workout_title !== undefined) allowed.workout_title = workout_title;
    if (workout_description !== undefined) allowed.workout_description = workout_description;
    if (session_type !== undefined) allowed.session_type = session_type;
    if (estimated_duration_minutes !== undefined) allowed.estimated_duration_minutes = estimated_duration_minutes;
    if (is_rest_day !== undefined) allowed.is_rest_day = is_rest_day;
    if (is_completed !== undefined) allowed.is_completed = is_completed;
    if (workout_details !== undefined) allowed.workout_details = workout_details;

    // Verify day belongs to a week within the verified plan (prevent IDOR via cross-plan dayId)
    const { data: day } = await supabase
      .from('training_plan_days')
      .select('id, training_plan_weeks!inner(training_plan_id)')
      .eq('id', dayId)
      .single();

    if (!day || (day.training_plan_weeks as { training_plan_id: string }).training_plan_id !== planId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: updated, error } = await supabase
      .from('training_plan_days')
      .update(allowed)
      .eq('id', dayId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ day: updated });
  } catch (err) {
    createLogger({}).error('PATCH /api/training-plans/[id]/days/[dayId] failed', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
