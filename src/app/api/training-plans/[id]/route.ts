import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { data: plan, error } = await supabase
      .from('training_plans')
      .select(
        `*, training_plan_weeks(*, training_plan_days(*))`
      )
      .eq('id', id)
      .eq('athlete_id', profile.id)
      .single();

    if (error || !plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ plan });
  } catch (err) {
    createLogger({}).error('GET /api/training-plans/[id] failed', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { plan_name, goal, status, difficulty_level, start_date, duration_weeks } = body;
    const allowed: Record<string, unknown> = {};
    if (plan_name !== undefined) allowed.plan_name = plan_name;
    if (goal !== undefined) allowed.goal = goal;
    if (status !== undefined) allowed.status = status;
    if (difficulty_level !== undefined) allowed.difficulty_level = difficulty_level;
    if (start_date !== undefined) allowed.start_date = start_date;
    if (duration_weeks !== undefined) allowed.duration_weeks = duration_weeks;

    const { data: plan, error } = await supabase
      .from('training_plans')
      .update(allowed)
      .eq('id', id)
      .eq('athlete_id', profile.id)
      .select()
      .single();

    if (error || !plan) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch (err) {
    createLogger({}).error('PUT /api/training-plans/[id] failed', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { error } = await supabase
      .from('training_plans')
      .update({ status: 'archived' })
      .eq('id', id)
      .eq('athlete_id', profile.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    createLogger({}).error('DELETE /api/training-plans/[id] failed', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
