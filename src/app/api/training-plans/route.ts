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
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ plans: [] });
  }

  const { data: plans, error } = await supabase
    .from('training_plans')
    .select('id, plan_name, goal, status, start_date, end_date, duration_weeks, created_at')
    .eq('athlete_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plans: plans ?? [] });
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

  const { data: plan, error } = await supabase
    .from('training_plans')
    .insert({
      athlete_id: profile.id,
      plan_name: body.plan_name || body.name || 'New Plan',
      goal: body.goal || body.description || null,
      duration_weeks: body.duration_weeks || 1,
      status: 'active',
      start_date: body.start_date || null,
      end_date: body.end_date || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plan }, { status: 201 });
}
