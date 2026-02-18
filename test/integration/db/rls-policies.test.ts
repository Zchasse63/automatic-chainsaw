/**
 * RLS Policy Verification — Live Integration Tests
 *
 * Systematically verifies that Row Level Security policies
 * correctly enforce data isolation between users.
 *
 * Tests against the REAL Supabase instance with REAL RLS policies.
 * This is the most important test file in the project.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestAthlete } from '../../utils/auth-helper';
import { adminClient, cleanupAllTestData, trackTestRecord } from '../../setup/database';
import { insertTestRecord } from '../../utils/db-helper';

describe('RLS Policy Enforcement', () => {
  let alice: Awaited<ReturnType<typeof createTestAthlete>>;
  let bob: Awaited<ReturnType<typeof createTestAthlete>>;

  beforeAll(async () => {
    alice = await createTestAthlete({ display_name: '[TEST] Alice' });
    bob = await createTestAthlete({ display_name: '[TEST] Bob' });
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  // =========================================================================
  // Reference tables — Public SELECT, no INSERT/UPDATE/DELETE
  // =========================================================================
  describe('Reference tables (public read-only)', () => {
    it('anon can SELECT from hyrox_stations', async () => {
      const { data, error } = await alice.supabase
        .from('hyrox_stations')
        .select('station_name')
        .limit(1);

      expect(error).toBeNull();
      expect(data!.length).toBe(1);
    });

    it('anon can SELECT from exercise_library', async () => {
      const { data, error } = await alice.supabase
        .from('exercise_library')
        .select('name')
        .limit(1);

      expect(error).toBeNull();
      expect(data!.length).toBe(1);
    });

    it('anon can SELECT from knowledge_chunks', async () => {
      const { data, error } = await alice.supabase
        .from('knowledge_chunks')
        .select('id, content')
        .limit(1);

      expect(error).toBeNull();
      expect(data!.length).toBe(1);
    });

    it('authenticated user CANNOT insert into hyrox_stations', async () => {
      const { error } = await alice.supabase.from('hyrox_stations').insert({
        station_number: 9,
        station_name: 'Fake Station',
        exercise_type: 'fake',
      });

      expect(error).not.toBeNull();
    });

    it('authenticated user CANNOT insert into exercise_library', async () => {
      const { error } = await alice.supabase.from('exercise_library').insert({
        name: 'Fake Exercise',
        category: 'running',
      });

      expect(error).not.toBeNull();
    });
  });

  // =========================================================================
  // User-owned tables — CRUD restricted to own data
  // =========================================================================
  describe('athlete_profiles isolation', () => {
    it('Alice can only see her own profile', async () => {
      const { data } = await alice.supabase
        .from('athlete_profiles')
        .select('display_name');

      expect(data).toHaveLength(1);
      expect(data![0].display_name).toBe('[TEST] Alice');
    });

    it('Bob cannot see Alice\'s profile', async () => {
      const { data } = await bob.supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', alice.id);

      expect(data).toEqual([]);
    });

    it('Bob cannot update Alice\'s profile', async () => {
      await bob.supabase
        .from('athlete_profiles')
        .update({ display_name: 'Hacked by Bob' })
        .eq('user_id', alice.id);

      // Verify via admin that Alice's name is unchanged
      const { data } = await adminClient
        .from('athlete_profiles')
        .select('display_name')
        .eq('user_id', alice.id)
        .single();

      expect(data!.display_name).toBe('[TEST] Alice');
    });

    it('Bob cannot delete Alice\'s profile', async () => {
      await bob.supabase
        .from('athlete_profiles')
        .delete()
        .eq('user_id', alice.id);

      // Verify via admin that Alice's profile still exists
      const { data } = await adminClient
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', alice.id)
        .single();

      expect(data).not.toBeNull();
    });
  });

  // =========================================================================
  // Workout isolation
  // =========================================================================
  describe('workout_logs isolation', () => {
    let aliceWorkoutId: string;

    beforeAll(async () => {
      const { data } = await alice.supabase
        .from('workout_logs')
        .insert({
          athlete_id: alice.athleteId,
          date: '2026-02-17',
          session_type: 'run',
          duration_minutes: 60,
          notes: 'Alice private workout',
        })
        .select()
        .single();
      aliceWorkoutId = data!.id;
      trackTestRecord('workout_logs', aliceWorkoutId);
    });

    it('Bob cannot SELECT Alice\'s workouts', async () => {
      const { data } = await bob.supabase
        .from('workout_logs')
        .select('*')
        .eq('id', aliceWorkoutId);

      expect(data).toEqual([]);
    });

    it('Bob cannot UPDATE Alice\'s workouts', async () => {
      await bob.supabase
        .from('workout_logs')
        .update({ notes: 'Hacked by Bob' })
        .eq('id', aliceWorkoutId);

      const { data } = await adminClient
        .from('workout_logs')
        .select('notes')
        .eq('id', aliceWorkoutId)
        .single();

      expect(data!.notes).toBe('Alice private workout');
    });

    it('Bob cannot DELETE Alice\'s workouts', async () => {
      await bob.supabase
        .from('workout_logs')
        .delete()
        .eq('id', aliceWorkoutId);

      const { data } = await adminClient
        .from('workout_logs')
        .select('id')
        .eq('id', aliceWorkoutId)
        .single();

      expect(data).not.toBeNull();
    });

    it('Bob cannot INSERT workouts for Alice\'s athlete_id', async () => {
      const { error } = await bob.supabase
        .from('workout_logs')
        .insert({
          athlete_id: alice.athleteId, // Alice's ID!
          date: '2026-02-17',
          session_type: 'run',
        });

      // RLS should reject this
      expect(error).not.toBeNull();
    });
  });

  // =========================================================================
  // Conversation + message isolation (nested RLS)
  // =========================================================================
  describe('conversations + messages isolation', () => {
    let aliceConvId: string;
    let aliceMsgId: string;

    beforeAll(async () => {
      const { data: conv } = await alice.supabase
        .from('conversations')
        .insert({ athlete_id: alice.athleteId, title: 'Alice Secret Chat' })
        .select()
        .single();
      aliceConvId = conv!.id;
      trackTestRecord('conversations', aliceConvId);

      const { data: msg } = await alice.supabase
        .from('messages')
        .insert({
          conversation_id: aliceConvId,
          role: 'user',
          content: 'This is Alice\'s private message',
        })
        .select()
        .single();
      aliceMsgId = msg!.id;
      trackTestRecord('messages', aliceMsgId);
    });

    it('Bob cannot read Alice\'s conversations', async () => {
      const { data } = await bob.supabase
        .from('conversations')
        .select('*')
        .eq('id', aliceConvId);

      expect(data).toEqual([]);
    });

    it('Bob cannot read messages in Alice\'s conversation', async () => {
      const { data } = await bob.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', aliceConvId);

      expect(data).toEqual([]);
    });

    it('Bob cannot insert messages into Alice\'s conversation', async () => {
      const { error } = await bob.supabase
        .from('messages')
        .insert({
          conversation_id: aliceConvId,
          role: 'user',
          content: 'Injected by Bob',
        });

      expect(error).not.toBeNull();
    });
  });

  // =========================================================================
  // Training plan deep chain (plan → weeks → days)
  // =========================================================================
  describe('training_plans deep chain isolation', () => {
    let alicePlanId: string;
    let aliceWeekId: string;
    let aliceDayId: string;

    beforeAll(async () => {
      const { data: plan } = await alice.supabase
        .from('training_plans')
        .insert({
          athlete_id: alice.athleteId,
          plan_name: 'Alice Private Plan',
          duration_weeks: 1,
          status: 'active',
        })
        .select()
        .single();
      alicePlanId = plan!.id;
      trackTestRecord('training_plans', alicePlanId);

      const { data: week } = await alice.supabase
        .from('training_plan_weeks')
        .insert({ training_plan_id: alicePlanId, week_number: 1 })
        .select()
        .single();
      aliceWeekId = week!.id;
      trackTestRecord('training_plan_weeks', aliceWeekId);

      const { data: day } = await alice.supabase
        .from('training_plan_days')
        .insert({
          training_plan_week_id: aliceWeekId,
          day_of_week: 1,
          workout_title: 'Alice Monday Run',
          is_rest_day: false,
        })
        .select()
        .single();
      aliceDayId = day!.id;
      trackTestRecord('training_plan_days', aliceDayId);
    });

    it('Bob cannot read Alice\'s plan', async () => {
      const { data } = await bob.supabase
        .from('training_plans')
        .select('*')
        .eq('id', alicePlanId);
      expect(data).toEqual([]);
    });

    it('Bob cannot read Alice\'s plan weeks', async () => {
      const { data } = await bob.supabase
        .from('training_plan_weeks')
        .select('*')
        .eq('id', aliceWeekId);
      expect(data).toEqual([]);
    });

    it('Bob cannot read Alice\'s plan days (3-table chain)', async () => {
      const { data } = await bob.supabase
        .from('training_plan_days')
        .select('*')
        .eq('id', aliceDayId);
      expect(data).toEqual([]);
    });

    it('Bob cannot mark Alice\'s day as completed', async () => {
      await bob.supabase
        .from('training_plan_days')
        .update({ is_completed: true })
        .eq('id', aliceDayId);

      const { data } = await adminClient
        .from('training_plan_days')
        .select('is_completed')
        .eq('id', aliceDayId)
        .single();

      expect(data!.is_completed).toBe(false);
    });
  });

  // =========================================================================
  // Goals, PRs, Benchmarks, Races, Achievements
  // =========================================================================
  describe('remaining table isolation', () => {
    it('Bob cannot read Alice\'s goals', async () => {
      const { data: g } = await alice.supabase
        .from('goals')
        .insert({
          athlete_id: alice.athleteId,
          title: 'Alice Goal',
          goal_type: 'custom',
          status: 'active',
        })
        .select()
        .single();
      trackTestRecord('goals', g!.id);

      const { data } = await bob.supabase
        .from('goals')
        .select('*')
        .eq('id', g!.id);
      expect(data).toEqual([]);
    });

    it('Bob cannot read Alice\'s personal records', async () => {
      const { data: pr } = await alice.supabase
        .from('personal_records')
        .insert({
          athlete_id: alice.athleteId,
          record_type: 'exercise_weight',
          exercise_name: 'Deadlift',
          value: 180,
          value_unit: 'kg',
          date_achieved: '2026-02-17',
          context: 'training',
        })
        .select()
        .single();
      trackTestRecord('personal_records', pr!.id);

      const { data } = await bob.supabase
        .from('personal_records')
        .select('*')
        .eq('id', pr!.id);
      expect(data).toEqual([]);
    });

    it('Bob cannot read Alice\'s benchmark tests', async () => {
      const { data: b } = await alice.supabase
        .from('benchmark_tests')
        .insert({
          athlete_id: alice.athleteId,
          test_type: 'station_time',
          station_id: '00000000-0000-0000-0000-000000000001',
          results: { time_seconds: 240 },
          test_date: '2026-02-17',
        })
        .select()
        .single();
      trackTestRecord('benchmark_tests', b!.id);

      const { data } = await bob.supabase
        .from('benchmark_tests')
        .select('*')
        .eq('id', b!.id);
      expect(data).toEqual([]);
    });

    it('Bob cannot read Alice\'s race results', async () => {
      const { data: r } = await alice.supabase
        .from('race_results')
        .insert({
          athlete_id: alice.athleteId,
          race_date: '2026-02-01',
          total_time_seconds: 5400,
        })
        .select()
        .single();
      trackTestRecord('race_results', r!.id);

      const { data } = await bob.supabase
        .from('race_results')
        .select('*')
        .eq('id', r!.id);
      expect(data).toEqual([]);
    });
  });
});
