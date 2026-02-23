import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { apiLimiter } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';
import { createDailyMetricsSchema } from '@/lib/validations/daily-metrics';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { allowed } = apiLimiter.check(user.id);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get('limit') || '30'), 90);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(limit);

    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);

    const { data: metrics, error } = await query;

    if (error) {
      const log = createLogger({ route: 'GET /api/daily-metrics', userId: user.id });
      log.error('Failed to fetch daily metrics', { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { metrics: metrics ?? [] },
      {
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
        },
      }
    );
  } catch (err) {
    const log = createLogger({ route: 'GET /api/daily-metrics' });
    log.error('Daily metrics fetch failed', { error: String(err) });
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

    // Rate limit POST
    const { allowed } = apiLimiter.check(user.id);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    let rawBody;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = createDailyMetricsSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const body = parsed.data;

    const { data: metric, error } = await supabase
      .from('daily_metrics')
      .upsert(
        {
          user_id: user.id,
          date: body.date,
          hrv_ms: body.hrv_ms ?? null,
          rhr_bpm: body.rhr_bpm ?? null,
          sleep_hours: body.sleep_hours ?? null,
          stress_score: body.stress_score ?? null,
          recovery_score: body.recovery_score ?? null,
          readiness_score: body.readiness_score ?? null,
          notes: body.notes ?? null,
          source: body.source ?? null,
        },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single();

    if (error) {
      const log = createLogger({ route: 'POST /api/daily-metrics', userId: user.id });
      log.error('Failed to upsert daily metric', { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ metric }, { status: 201 });
  } catch (err) {
    const log = createLogger({ route: 'POST /api/daily-metrics' });
    log.error('Daily metric upsert failed', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
