import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/training-plans/:id/days/:dayId — Update a training plan day
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  const { id: planId, dayId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the plan belongs to the user
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

  const body = await request.json();

  const { data: updated, error } = await supabase
    .from('training_plan_days')
    .update(body)
    .eq('id', dayId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ day: updated });
}
