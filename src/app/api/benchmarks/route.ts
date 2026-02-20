import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkAndAwardAchievements } from '@/lib/achievements';

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ benchmarks: [] });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    let query = supabase
      .from('benchmark_tests')
      .select('*')
      .eq('athlete_id', profile.id)
      .order('test_date', { ascending: false });

    if (type) query = query.eq('test_type', type);

    const { data: benchmarks, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ benchmarks: benchmarks ?? [] });
  } catch (err) {
    console.error('GET /api/benchmarks error:', err);
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

    const { data: benchmark, error } = await supabase
      .from('benchmark_tests')
      .insert({
        athlete_id: profile.id,
        test_type: body.test_type,
        station_id: body.station_id || null,
        results: body.results || {},
        notes: body.notes || null,
        test_date: body.test_date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let newAchievements: string[] = [];
    try {
      newAchievements = await checkAndAwardAchievements(profile.id, supabase, 'benchmark');
    } catch (err) {
      console.error('Achievement check failed:', err);
      // non-blocking — benchmark already succeeded
    }

    return NextResponse.json({ benchmark, newAchievements }, { status: 201 });
  } catch (err) {
    console.error('POST /api/benchmarks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
