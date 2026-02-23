import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { computeReadinessScore } from '@/lib/ai/readiness';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('athlete_profiles').select('id').eq('user_id', user.id).single();
    if (!profile) return NextResponse.json({ score: 0, components: {}, weakest: '' });

    const result = await computeReadinessScore(profile.id, supabase);
    return NextResponse.json(result);
  } catch (err) {
    createLogger({}).error('GET /api/dashboard/readiness failed', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
