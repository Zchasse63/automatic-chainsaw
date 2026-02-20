import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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

    const { data: goal, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .eq('athlete_id', profile.id)
      .single();

    if (error || !goal) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ goal });
  } catch (err) {
    console.error('GET /api/goals/[id] error:', err);
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

    const { title, description, goal_type, target_value, current_value, target_date, status } = body;
    const allowed: Record<string, unknown> = {};
    if (title !== undefined) allowed.title = title;
    if (description !== undefined) allowed.description = description;
    if (goal_type !== undefined) allowed.goal_type = goal_type;
    if (target_value !== undefined) allowed.target_value = target_value;
    if (current_value !== undefined) allowed.current_value = current_value;
    if (target_date !== undefined) allowed.target_date = target_date;
    if (status !== undefined) allowed.status = status;

    const { data: goal, error } = await supabase
      .from('goals')
      .update(allowed)
      .eq('id', id)
      .eq('athlete_id', profile.id)
      .select()
      .single();

    if (error || !goal) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ goal });
  } catch (err) {
    console.error('PUT /api/goals/[id] error:', err);
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
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('athlete_id', profile.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/goals/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
