/**
 * Training Plans API — Live Integration Tests
 *
 * Tests the full training plan hierarchy (plans → weeks → days)
 * against REAL Supabase. This is the most complex entity in the system.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestAthlete, createOtherTestAthlete } from '../../utils/auth-helper';
import { getRecord, getRecords, countRecords } from '../../utils/db-helper';
import { cleanupAllTestData, trackTestRecord } from '../../setup/database';

describe('Training Plans (plan → weeks → days)', () => {
  let athlete: Awaited<ReturnType<typeof createTestAthlete>>;
  let otherAthlete: Awaited<ReturnType<typeof createOtherTestAthlete>>;

  beforeAll(async () => {
    athlete = await createTestAthlete();
    otherAthlete = await createOtherTestAthlete();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('Plan CRUD', () => {
    it('creates a training plan', async () => {
      const { data: plan, error } = await athlete.supabase
        .from('training_plans')
        .insert({
          athlete_id: athlete.athleteId,
          plan_name: '[TEST] 16-Week Hyrox Prep',
          goal: 'Sub-90 at Hyrox NYC',
          duration_weeks: 16,
          status: 'active',
          start_date: '2026-02-17',
          difficulty: 'intermediate',
          is_ai_generated: true,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(plan!.plan_name).toBe('[TEST] 16-Week Hyrox Prep');
      expect(plan!.status).toBe('active');
      expect(plan!.duration_weeks).toBe(16);
      trackTestRecord('training_plans', plan!.id);
    });

    it('only one active plan per athlete (archive old)', async () => {
      // Create first plan (active)
      const { data: plan1 } = await athlete.supabase
        .from('training_plans')
        .insert({
          athlete_id: athlete.athleteId,
          plan_name: '[TEST] Plan A',
          duration_weeks: 4,
          status: 'active',
        })
        .select()
        .single();
      trackTestRecord('training_plans', plan1!.id);

      // Archive it manually (mimicking what the API route does)
      await athlete.supabase
        .from('training_plans')
        .update({ status: 'archived' })
        .eq('athlete_id', athlete.athleteId)
        .eq('status', 'active');

      // Create second plan (active)
      const { data: plan2 } = await athlete.supabase
        .from('training_plans')
        .insert({
          athlete_id: athlete.athleteId,
          plan_name: '[TEST] Plan B',
          duration_weeks: 8,
          status: 'active',
        })
        .select()
        .single();
      trackTestRecord('training_plans', plan2!.id);

      // Verify plan1 is archived
      const dbPlan1 = await getRecord('training_plans', { id: plan1!.id });
      expect((dbPlan1 as Record<string, unknown>)!.status).toBe('archived');

      // Verify plan2 is active
      const dbPlan2 = await getRecord('training_plans', { id: plan2!.id });
      expect((dbPlan2 as Record<string, unknown>)!.status).toBe('active');
    });

    it('other user cannot read my plans (RLS)', async () => {
      const { data: plan } = await athlete.supabase
        .from('training_plans')
        .insert({
          athlete_id: athlete.athleteId,
          plan_name: '[TEST] Private Plan',
          duration_weeks: 4,
          status: 'draft',
        })
        .select()
        .single();
      trackTestRecord('training_plans', plan!.id);

      const { data: otherPlans } = await otherAthlete.supabase
        .from('training_plans')
        .select('*')
        .eq('athlete_id', athlete.athleteId);

      expect(otherPlans).toEqual([]);
    });
  });

  describe('Weeks + Days hierarchy', () => {
    it('creates a plan with weeks and days', async () => {
      // Create plan
      const { data: plan } = await athlete.supabase
        .from('training_plans')
        .insert({
          athlete_id: athlete.athleteId,
          plan_name: '[TEST] Full Plan',
          duration_weeks: 2,
          status: 'active',
        })
        .select()
        .single();
      trackTestRecord('training_plans', plan!.id);

      // Create week 1
      const { data: week1 } = await athlete.supabase
        .from('training_plan_weeks')
        .insert({
          training_plan_id: plan!.id,
          week_number: 1,
          focus: 'Base building',
        })
        .select()
        .single();
      trackTestRecord('training_plan_weeks', week1!.id);

      // Create days for week 1
      const days = [
        {
          training_plan_week_id: week1!.id,
          day_of_week: 1, // Monday
          session_type: 'run',
          workout_title: '[TEST] Easy Run',
          estimated_duration_minutes: 45,
          is_rest_day: false,
        },
        {
          training_plan_week_id: week1!.id,
          day_of_week: 2, // Tuesday
          session_type: 'hiit',
          workout_title: '[TEST] SkiErg Intervals',
          estimated_duration_minutes: 30,
          is_rest_day: false,
        },
        {
          training_plan_week_id: week1!.id,
          day_of_week: 3, // Wednesday
          is_rest_day: true,
        },
      ];

      const { data: savedDays, error } = await athlete.supabase
        .from('training_plan_days')
        .insert(days)
        .select();

      expect(error).toBeNull();
      expect(savedDays).toHaveLength(3);
      for (const d of savedDays!) {
        trackTestRecord('training_plan_days', d.id);
      }

      // Verify nested query works
      const { data: fullPlan } = await athlete.supabase
        .from('training_plans')
        .select(`
          id, plan_name,
          training_plan_weeks (
            id, week_number, focus,
            training_plan_days (
              id, day_of_week, session_type, workout_title, is_rest_day
            )
          )
        `)
        .eq('id', plan!.id)
        .single();

      expect(fullPlan!.training_plan_weeks).toHaveLength(1);
      expect(fullPlan!.training_plan_weeks[0].training_plan_days).toHaveLength(3);
    });

    it('marks a day as completed', async () => {
      // Create plan → week → day
      const { data: plan } = await athlete.supabase
        .from('training_plans')
        .insert({
          athlete_id: athlete.athleteId,
          plan_name: '[TEST] Completion Test',
          duration_weeks: 1,
          status: 'active',
        })
        .select()
        .single();
      trackTestRecord('training_plans', plan!.id);

      const { data: week } = await athlete.supabase
        .from('training_plan_weeks')
        .insert({ training_plan_id: plan!.id, week_number: 1 })
        .select()
        .single();
      trackTestRecord('training_plan_weeks', week!.id);

      const { data: day } = await athlete.supabase
        .from('training_plan_days')
        .insert({
          training_plan_week_id: week!.id,
          day_of_week: 1,
          session_type: 'run',
          workout_title: '[TEST] To Complete',
          is_rest_day: false,
        })
        .select()
        .single();
      trackTestRecord('training_plan_days', day!.id);

      // Mark as completed
      const { data: updated, error } = await athlete.supabase
        .from('training_plan_days')
        .update({ is_completed: true })
        .eq('id', day!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated!.is_completed).toBe(true);
    });

    it('cascade deletes weeks and days when plan is deleted', async () => {
      const { data: plan } = await athlete.supabase
        .from('training_plans')
        .insert({
          athlete_id: athlete.athleteId,
          plan_name: '[TEST] Cascade Delete',
          duration_weeks: 1,
          status: 'draft',
        })
        .select()
        .single();
      trackTestRecord('training_plans', plan!.id);

      const { data: week } = await athlete.supabase
        .from('training_plan_weeks')
        .insert({ training_plan_id: plan!.id, week_number: 1 })
        .select()
        .single();
      trackTestRecord('training_plan_weeks', week!.id);

      const { data: day } = await athlete.supabase
        .from('training_plan_days')
        .insert({
          training_plan_week_id: week!.id,
          day_of_week: 1,
          is_rest_day: true,
        })
        .select()
        .single();
      trackTestRecord('training_plan_days', day!.id);

      // Delete plan
      await athlete.supabase.from('training_plans').delete().eq('id', plan!.id);

      // Verify cascade
      const weekCount = await countRecords('training_plan_weeks', {
        training_plan_id: plan!.id,
      });
      const dayCount = await countRecords('training_plan_days', {
        training_plan_week_id: week!.id,
      });

      expect(weekCount).toBe(0);
      expect(dayCount).toBe(0);
    });

    it('enforces day_of_week range (1-7)', async () => {
      const { data: plan } = await athlete.supabase
        .from('training_plans')
        .insert({
          athlete_id: athlete.athleteId,
          plan_name: '[TEST] Constraint Test',
          duration_weeks: 1,
          status: 'draft',
        })
        .select()
        .single();
      trackTestRecord('training_plans', plan!.id);

      const { data: week } = await athlete.supabase
        .from('training_plan_weeks')
        .insert({ training_plan_id: plan!.id, week_number: 1 })
        .select()
        .single();
      trackTestRecord('training_plan_weeks', week!.id);

      const { error } = await athlete.supabase
        .from('training_plan_days')
        .insert({
          training_plan_week_id: week!.id,
          day_of_week: 8, // Invalid
          is_rest_day: true,
        });

      expect(error).not.toBeNull();
    });
  });

  describe('Deep RLS (3-table chain)', () => {
    it('other user cannot read my plan days (deep RLS chain)', async () => {
      const { data: plan } = await athlete.supabase
        .from('training_plans')
        .insert({
          athlete_id: athlete.athleteId,
          plan_name: '[TEST] Deep RLS',
          duration_weeks: 1,
          status: 'active',
        })
        .select()
        .single();
      trackTestRecord('training_plans', plan!.id);

      const { data: week } = await athlete.supabase
        .from('training_plan_weeks')
        .insert({ training_plan_id: plan!.id, week_number: 1 })
        .select()
        .single();
      trackTestRecord('training_plan_weeks', week!.id);

      const { data: day } = await athlete.supabase
        .from('training_plan_days')
        .insert({
          training_plan_week_id: week!.id,
          day_of_week: 1,
          workout_title: '[TEST] Secret Workout',
          is_rest_day: false,
        })
        .select()
        .single();
      trackTestRecord('training_plan_days', day!.id);

      // Other athlete tries to read the day directly
      const { data: otherDays } = await otherAthlete.supabase
        .from('training_plan_days')
        .select('*')
        .eq('id', day!.id);

      expect(otherDays).toEqual([]);
    });

    it('other user cannot update my plan days (deep RLS chain)', async () => {
      const { data: plan } = await athlete.supabase
        .from('training_plans')
        .insert({
          athlete_id: athlete.athleteId,
          plan_name: '[TEST] Deep RLS Update',
          duration_weeks: 1,
          status: 'active',
        })
        .select()
        .single();
      trackTestRecord('training_plans', plan!.id);

      const { data: week } = await athlete.supabase
        .from('training_plan_weeks')
        .insert({ training_plan_id: plan!.id, week_number: 1 })
        .select()
        .single();
      trackTestRecord('training_plan_weeks', week!.id);

      const { data: day } = await athlete.supabase
        .from('training_plan_days')
        .insert({
          training_plan_week_id: week!.id,
          day_of_week: 1,
          workout_title: '[TEST] Protected Day',
          is_rest_day: false,
        })
        .select()
        .single();
      trackTestRecord('training_plan_days', day!.id);

      // Other athlete tries to mark as completed
      await otherAthlete.supabase
        .from('training_plan_days')
        .update({ is_completed: true })
        .eq('id', day!.id);

      // Verify unchanged
      const dbDay = await getRecord('training_plan_days', { id: day!.id });
      expect((dbDay as Record<string, unknown>)!.is_completed).toBe(false);
    });
  });
});
