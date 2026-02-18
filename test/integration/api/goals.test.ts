/**
 * Goals API — Live Integration Tests
 *
 * Tests goal CRUD against REAL Supabase.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestAthlete, createOtherTestAthlete } from '../../utils/auth-helper';
import { getRecord, verifyRecordExists } from '../../utils/db-helper';
import { cleanupAllTestData, trackTestRecord } from '../../setup/database';

describe('Goals CRUD', () => {
  let athlete: Awaited<ReturnType<typeof createTestAthlete>>;
  let otherAthlete: Awaited<ReturnType<typeof createOtherTestAthlete>>;

  beforeAll(async () => {
    athlete = await createTestAthlete();
    otherAthlete = await createOtherTestAthlete();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  it('creates a goal with valid data', async () => {
    const { data: goal, error } = await athlete.supabase
      .from('goals')
      .insert({
        athlete_id: athlete.athleteId,
        title: '[TEST] Sub-90 Hyrox',
        description: 'Break 90 minutes at next race',
        goal_type: 'race_time',
        target_value: '90',
        current_value: '95',
        target_date: '2026-06-06',
        status: 'active',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(goal!.title).toBe('[TEST] Sub-90 Hyrox');
    expect(goal!.goal_type).toBe('race_time');
    expect(goal!.status).toBe('active');
    trackTestRecord('goals', goal!.id);
  });

  it('lists only own goals (RLS)', async () => {
    const { data: g } = await athlete.supabase
      .from('goals')
      .insert({
        athlete_id: athlete.athleteId,
        title: '[TEST] Private Goal',
        goal_type: 'custom',
        status: 'active',
      })
      .select()
      .single();
    trackTestRecord('goals', g!.id);

    const { data: otherGoals } = await otherAthlete.supabase
      .from('goals')
      .select('*')
      .eq('athlete_id', athlete.athleteId);

    expect(otherGoals).toEqual([]);
  });

  it('updates goal progress', async () => {
    const { data: g } = await athlete.supabase
      .from('goals')
      .insert({
        athlete_id: athlete.athleteId,
        title: '[TEST] Progress Goal',
        goal_type: 'consistency',
        target_value: '30',
        current_value: '10',
        status: 'active',
      })
      .select()
      .single();
    trackTestRecord('goals', g!.id);

    const { data: updated, error } = await athlete.supabase
      .from('goals')
      .update({ current_value: '25' })
      .eq('id', g!.id)
      .select()
      .single();

    expect(error).toBeNull();
    // current_value is stored as numeric in the DB
    expect(Number(updated!.current_value)).toBe(25);
  });

  it('marks goal as completed', async () => {
    const { data: g } = await athlete.supabase
      .from('goals')
      .insert({
        athlete_id: athlete.athleteId,
        title: '[TEST] Almost Done',
        goal_type: 'custom',
        status: 'active',
      })
      .select()
      .single();
    trackTestRecord('goals', g!.id);

    const now = new Date().toISOString();
    const { data: completed, error } = await athlete.supabase
      .from('goals')
      .update({ status: 'completed', completed_at: now })
      .eq('id', g!.id)
      .select()
      .single();

    expect(error).toBeNull();
    expect(completed!.status).toBe('completed');
    expect(completed!.completed_at).not.toBeNull();
  });

  it('soft deletes a goal', async () => {
    const { data: g } = await athlete.supabase
      .from('goals')
      .insert({
        athlete_id: athlete.athleteId,
        title: '[TEST] To Delete',
        goal_type: 'custom',
        status: 'active',
      })
      .select()
      .single();
    trackTestRecord('goals', g!.id);

    await athlete.supabase
      .from('goals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', g!.id);

    // Verify soft deleted (still exists but has deleted_at)
    const dbRecord = await getRecord('goals', { id: g!.id });
    expect((dbRecord as Record<string, unknown>)!.deleted_at).not.toBeNull();
  });

  it('other user cannot update my goal (RLS)', async () => {
    const { data: g } = await athlete.supabase
      .from('goals')
      .insert({
        athlete_id: athlete.athleteId,
        title: '[TEST] Protected Goal',
        goal_type: 'custom',
        status: 'active',
      })
      .select()
      .single();
    trackTestRecord('goals', g!.id);

    // Other athlete tries to update
    await otherAthlete.supabase
      .from('goals')
      .update({ title: '[TEST] Hacked' })
      .eq('id', g!.id);

    const dbRecord = await getRecord('goals', { id: g!.id });
    expect((dbRecord as Record<string, unknown>)!.title).toBe('[TEST] Protected Goal');
  });
});
