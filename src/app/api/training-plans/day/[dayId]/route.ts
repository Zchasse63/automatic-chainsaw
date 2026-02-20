import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dayId: string }> }
) {
  try {
    const { dayId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the plan day and verify ownership through the plan chain
    const { data: day, error } = await supabase
      .from('training_plan_days')
      .select(
        `
      id,
      day_of_week,
      session_type,
      workout_title,
      workout_description,
      workout_details,
      estimated_duration_minutes,
      is_rest_day,
      is_completed,
      training_plan_weeks!inner(
        training_plans!inner(
          athlete_id,
          athlete_profiles!inner(user_id)
        )
      )
    `
      )
      .eq('id', dayId)
      .single();

    if (error || !day) {
      return NextResponse.json({ error: 'Day not found' }, { status: 404 });
    }

    // Verify ownership
    const week = day.training_plan_weeks as unknown as {
      training_plans: { athlete_id: string; athlete_profiles: { user_id: string } };
    };
    if (week.training_plans.athlete_profiles.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      day: {
        id: day.id,
        day_of_week: day.day_of_week,
        session_type: day.session_type,
        workout_title: day.workout_title,
        workout_description: day.workout_description,
        workout_details: day.workout_details,
        estimated_duration_minutes: day.estimated_duration_minutes,
        is_rest_day: day.is_rest_day,
        is_completed: day.is_completed,
      },
    });
  } catch (err) {
    console.error('GET /api/training-plans/day/[dayId] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
