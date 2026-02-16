import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('athlete_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const { data: profile, error } = await supabase
    .from('athlete_profiles')
    .insert({
      user_id: user.id,
      display_name: body.display_name,
      date_of_birth: body.date_of_birth || null,
      sex: body.sex || null,
      weight_kg: body.weight_kg || null,
      height_cm: body.height_cm || null,
      hyrox_division: body.hyrox_division || 'open',
      hyrox_race_count: body.hyrox_race_count || 0,
      training_history: body.training_history || null,
      current_phase: body.current_phase || 'general_prep',
      race_date: body.race_date || null,
      goal_time_minutes: body.goal_time_minutes || null,
      weekly_availability_hours: body.weekly_availability_hours || null,
      equipment_available: body.equipment_available || [],
      injuries_limitations: body.injuries_limitations || [],
      preferences: body.preferences || {},
      units_preference: body.units_preference || 'metric',
      profile_complete: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile }, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const { data: profile, error } = await supabase
    .from('athlete_profiles')
    .update(body)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}
