import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

// POST /api/training-plans/:id/days/:dayId/complete — Mark day complete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  try {
    const { id: planId, dayId } = await params;
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
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 });
    }

    const { data: plan } = await supabase
      .from('training_plans')
      .select('id')
      .eq('id', planId)
      .eq('athlete_id', profile.id)
      .single();

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));

    const updateData: Record<string, unknown> = { is_completed: true };
    if (body.linked_workout_log_id) {
      updateData.linked_workout_log_id = body.linked_workout_log_id;
    }

    const { data: updated, error } = await supabase
      .from('training_plan_days')
      .update(updateData)
      .eq('id', dayId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ day: updated });
  } catch (err) {
    createLogger({}).error('POST /api/training-plans/[id]/days/[dayId]/complete failed', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
