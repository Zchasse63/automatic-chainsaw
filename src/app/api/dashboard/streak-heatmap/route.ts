import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('athlete_profiles').select('id').eq('user_id', user.id).single();
    if (!profile) return NextResponse.json({ days: [] });

    const daysParam = Number(request.nextUrl.searchParams.get('days') || '90');
    const since = new Date(Date.now() - daysParam * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: workouts } = await supabase
      .from('workout_logs')
      .select('date, duration_minutes')
      .eq('athlete_id', profile.id)
      .is('deleted_at', null)
      .gte('date', since);

    const dayMap = new Map<string, { workoutCount: number; totalMinutes: number }>();
    for (const w of workouts ?? []) {
      if (!w.date) continue;
      const dateStr = w.date.split('T')[0];
      const existing = dayMap.get(dateStr) ?? { workoutCount: 0, totalMinutes: 0 };
      existing.workoutCount++;
      existing.totalMinutes += w.duration_minutes ?? 0;
      dayMap.set(dateStr, existing);
    }

    const days = Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    return NextResponse.json({ days });
  } catch (err) {
    createLogger({}).error('GET /api/dashboard/streak-heatmap failed', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
