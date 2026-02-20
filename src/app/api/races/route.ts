import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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
      return NextResponse.json({ races: [] });
    }

    const { data: races, error } = await supabase
      .from('race_results')
      .select('*')
      .eq('athlete_id', profile.id)
      .order('race_date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ races: races ?? [] });
  } catch (err) {
    console.error('GET /api/races error:', err);
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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { data: race, error } = await supabase
      .from('race_results')
      .insert({
        athlete_id: profile.id,
        race_date: body.race_date,
        race_name: body.race_name || null,
        location: body.location || null,
        division: body.division || null,
        format: body.format || null,
        total_time_seconds: body.total_time_seconds,
        is_simulation: body.is_simulation || false,
        conditions: body.conditions || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Insert splits if provided
    if (body.splits && Array.isArray(body.splits) && race) {
      const splits = body.splits.map((s: Record<string, unknown>) => ({
        race_result_id: race.id,
        split_number: s.split_number as number,
        split_type: s.split_type as string,
        time_seconds: s.time_seconds as number,
        station_id: (s.station_id as string) || null,
        transition_time_seconds: (s.transition_time_seconds as number) || null,
      }));

      const { error: splitsError } = await supabase.from('race_splits').insert(splits);
      if (splitsError) console.error('Failed to insert race splits:', splitsError);
    }

    return NextResponse.json({ race }, { status: 201 });
  } catch (err) {
    console.error('POST /api/races error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
