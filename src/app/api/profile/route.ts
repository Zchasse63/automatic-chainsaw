import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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
  } catch (err) {
    console.error('GET /api/profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

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
  } catch (err) {
    console.error('POST /api/profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const {
      display_name, date_of_birth, sex, weight_kg, height_cm, hyrox_division,
      hyrox_race_count, race_date, goal_time_minutes, weekly_availability_hours,
      current_phase, equipment_available, injuries_limitations, training_history,
      preferences, units_preference,
    } = body;

    const allowed: Record<string, unknown> = {};
    if (display_name !== undefined) allowed.display_name = display_name;
    if (date_of_birth !== undefined) allowed.date_of_birth = date_of_birth;
    if (sex !== undefined) allowed.sex = sex;
    if (weight_kg !== undefined) allowed.weight_kg = weight_kg;
    if (height_cm !== undefined) allowed.height_cm = height_cm;
    if (hyrox_division !== undefined) allowed.hyrox_division = hyrox_division;
    if (hyrox_race_count !== undefined) allowed.hyrox_race_count = hyrox_race_count;
    if (race_date !== undefined) allowed.race_date = race_date;
    if (goal_time_minutes !== undefined) allowed.goal_time_minutes = goal_time_minutes;
    if (weekly_availability_hours !== undefined) allowed.weekly_availability_hours = weekly_availability_hours;
    if (current_phase !== undefined) allowed.current_phase = current_phase;
    if (equipment_available !== undefined) allowed.equipment_available = equipment_available;
    if (injuries_limitations !== undefined) allowed.injuries_limitations = injuries_limitations;
    if (training_history !== undefined) allowed.training_history = training_history;
    if (preferences !== undefined) allowed.preferences = preferences;
    if (units_preference !== undefined) allowed.units_preference = units_preference;

    const { data: profile, error } = await supabase
      .from('athlete_profiles')
      .update(allowed)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error('PATCH /api/profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
