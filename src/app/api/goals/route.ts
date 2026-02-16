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
    return NextResponse.json({ goals: [] });
  }

  const { data: goals, error } = await supabase
    .from('goals')
    .select('*')
    .eq('athlete_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ goals: goals ?? [] });
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

  const { data: goal, error } = await supabase
    .from('goals')
    .insert({
      athlete_id: profile.id,
      title: body.title,
      description: body.description || null,
      goal_type: body.goal_type || 'custom',
      target_value: body.target_value || null,
      current_value: body.current_value || 0,
      target_date: body.target_date || null,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ goal }, { status: 201 });
}
