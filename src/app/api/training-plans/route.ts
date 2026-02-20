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
      return NextResponse.json({ plans: [] });
    }

    const { data: plans, error } = await supabase
      .from('training_plans')
      .select('id, plan_name, goal, status, start_date, end_date, duration_weeks, created_at')
      .eq('athlete_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plans: plans ?? [] });
  } catch (err) {
    console.error('GET /api/training-plans error:', err);
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

    // Deactivate any currently active plan
    await supabase
      .from('training_plans')
      .update({ status: 'archived' })
      .eq('athlete_id', profile.id)
      .eq('status', 'active');

    // Calculate end_date from start_date + duration_weeks if not provided
    let endDate = body.end_date || null;
    if (!endDate && body.start_date && body.duration_weeks) {
      const start = new Date(body.start_date);
      start.setDate(start.getDate() + body.duration_weeks * 7);
      endDate = start.toISOString().split('T')[0];
    }

    const { data: plan, error } = await supabase
      .from('training_plans')
      .insert({
        athlete_id: profile.id,
        plan_name: body.plan_name || body.name || 'New Plan',
        goal: body.goal || body.description || null,
        duration_weeks: body.duration_weeks || 1,
        status: 'active',
        start_date: body.start_date || null,
        end_date: endDate,
        difficulty: body.difficulty || null,
        is_ai_generated: body.is_ai_generated || false,
        source_conversation_id: body.source_conversation_id || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If nested weeks/days provided, insert them
    if (body.weeks && Array.isArray(body.weeks) && body.weeks.length > 0) {
      for (const week of body.weeks) {
        const { data: savedWeek, error: weekError } = await supabase
          .from('training_plan_weeks')
          .insert({
            training_plan_id: plan.id,
            week_number: week.week_number,
            focus: week.focus || null,
            notes: week.notes || null,
            target_volume_hours: week.target_volume_hours || null,
          })
          .select('id')
          .single();

        if (weekError || !savedWeek) {
          console.error('Failed to insert week:', weekError);
          continue;
        }

        if (week.days && Array.isArray(week.days)) {
          const daysToInsert = week.days.map(
            (day: {
              day_of_week: number;
              session_type?: string;
              workout_title?: string;
              workout_description?: string;
              workout_details?: Record<string, unknown>;
              estimated_duration_minutes?: number;
              is_rest_day?: boolean;
              notes?: string;
            }) => ({
              training_plan_week_id: savedWeek.id,
              day_of_week: day.day_of_week,
              session_type: day.session_type || null,
              workout_title: day.workout_title || null,
              workout_description: day.workout_description || null,
              workout_details: day.workout_details || null,
              estimated_duration_minutes: day.estimated_duration_minutes || null,
              is_rest_day: day.is_rest_day || false,
            })
          );

          const { error: daysError } = await supabase
            .from('training_plan_days')
            .insert(daysToInsert);

          if (daysError) {
            console.error('Failed to insert days:', daysError);
          }
        }
      }
    }

    return NextResponse.json({ plan }, { status: 201 });
  } catch (err) {
    console.error('POST /api/training-plans error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
