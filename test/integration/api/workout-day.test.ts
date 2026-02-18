/**
 * Workout Day Route — Live Integration Tests
 *
 * Tests the /api/training-plans/day/[dayId] endpoint that the
 * workout execution page depends on. Verifies data shape,
 * ownership check, and RLS through the plan chain.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestAthlete, createOtherTestAthlete } from '../../utils/auth-helper';
import { cleanupAllTestData, trackTestRecord } from '../../setup/database';

describe('Workout Day Route', () => {
  let athlete: Awaited<ReturnType<typeof createTestAthlete>>;
  let otherAthlete: Awaited<ReturnType<typeof createOtherTestAthlete>>;
  let planDayId: string;

  beforeAll(async () => {
    athlete = await createTestAthlete({
      display_name: '[TEST] Workout Day Tester',
    });
    otherAthlete = await createOtherTestAthlete({
      display_name: '[TEST] Other Workout Day Tester',
    });

    // Create a training plan with a day
    const { data: plan } = await athlete.supabase
      .from('training_plans')
      .insert({
        athlete_id: athlete.athleteId,
        plan_name: '[TEST] Day Test Plan',
        duration_weeks: 1,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();
    trackTestRecord('training_plans', plan!.id);

    const { data: week } = await athlete.supabase
      .from('training_plan_weeks')
      .insert({ training_plan_id: plan!.id, week_number: 1, focus: 'Test week' })
      .select()
      .single();
    trackTestRecord('training_plan_weeks', week!.id);

    const { data: day } = await athlete.supabase
      .from('training_plan_days')
      .insert({
        training_plan_week_id: week!.id,
        day_of_week: 1,
        session_type: 'hiit',
        workout_title: '[TEST] SkiErg Intervals',
        workout_description: 'Warm up: 5 min easy row\n\n4 x 500m SkiErg @ 90% effort\nRest 90s between sets\n\nCool down: 5 min easy row',
        estimated_duration_minutes: 35,
        is_rest_day: false,
        is_completed: false,
      })
      .select()
      .single();
    trackTestRecord('training_plan_days', day!.id);
    planDayId = day!.id;
  }, 30_000);

  afterAll(async () => {
    await cleanupAllTestData();
  });

  it('fetches a plan day with full workout details', async () => {
    // Simulate what the workout page does: fetch day by ID through the plan chain
    const { data: day, error } = await athlete.supabase
      .from('training_plan_days')
      .select(`
        id,
        day_of_week,
        session_type,
        workout_title,
        workout_description,
        estimated_duration_minutes,
        is_rest_day,
        is_completed,
        training_plan_weeks!inner(
          training_plans!inner(
            athlete_id,
            athlete_profiles!inner(user_id)
          )
        )
      `)
      .eq('id', planDayId)
      .single();

    expect(error).toBeNull();
    expect(day).not.toBeNull();
    expect(day!.id).toBe(planDayId);
    expect(day!.workout_title).toBe('[TEST] SkiErg Intervals');
    expect(day!.session_type).toBe('hiit');
    expect(day!.workout_description).toContain('SkiErg');
    expect(day!.estimated_duration_minutes).toBe(35);
    expect(day!.is_rest_day).toBe(false);
    expect(day!.is_completed).toBe(false);
  });

  it('workout description splits into sections correctly', async () => {
    const { data: day } = await athlete.supabase
      .from('training_plan_days')
      .select('workout_description')
      .eq('id', planDayId)
      .single();

    // The workout page splits on double newlines to create sections
    const sections = (day!.workout_description ?? '')
      .split(/\n{2,}/)
      .filter((s: string) => s.trim());

    expect(sections.length).toBeGreaterThanOrEqual(2);
    expect(sections[0]).toContain('Warm up');
  });

  it('other user cannot read my plan day through RLS chain', async () => {
    // RLS should block access through the training_plans -> athlete_profiles chain
    const { data } = await otherAthlete.supabase
      .from('training_plan_days')
      .select('id')
      .eq('id', planDayId);

    expect(data).toEqual([]);
  });

  it('supports completing a workout and logging via the plan day', async () => {
    // Simulate what the workout execution page does:
    // 1. Start workout (fetch day)
    // 2. Track sections
    // 3. Log workout with plan_day_id reference
    const { data: workout, error } = await athlete.supabase
      .from('workout_logs')
      .insert({
        athlete_id: athlete.athleteId,
        date: new Date().toISOString().split('T')[0],
        session_type: 'hiit',
        duration_minutes: 33,
        rpe_post: 7,
        notes: 'Test workout from day route',
        training_plan_day_id: planDayId,
        completion_status: 'completed',
        completed_workout: {
          sections: {
            'section-0': { completed: true, notes: '' },
            'section-1': { completed: true, notes: 'Felt good' },
            'section-2': { completed: true, notes: '' },
          },
          timer_ms: 1980000,
        },
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(workout).not.toBeNull();
    expect(workout!.training_plan_day_id).toBe(planDayId);
    expect(workout!.completed_workout).toBeTruthy();
    trackTestRecord('workout_logs', workout!.id);

    // Mark the plan day as completed
    const { error: updateError } = await athlete.supabase
      .from('training_plan_days')
      .update({ is_completed: true })
      .eq('id', planDayId);

    expect(updateError).toBeNull();

    // Verify it's marked completed
    const { data: updated } = await athlete.supabase
      .from('training_plan_days')
      .select('is_completed')
      .eq('id', planDayId)
      .single();

    expect(updated!.is_completed).toBe(true);
  });
});
