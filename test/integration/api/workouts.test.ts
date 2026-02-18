/**
 * Workouts API — Live Integration Tests
 *
 * Tests workout logging CRUD against REAL Supabase.
 * Creates real users, real workouts, verifies real database state.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestAthlete, createOtherTestAthlete } from '../../utils/auth-helper';
import { getRecord, countRecords, verifyRecordExists } from '../../utils/db-helper';
import { cleanupAllTestData, trackTestRecord } from '../../setup/database';

describe('Workouts CRUD', () => {
  let athlete: Awaited<ReturnType<typeof createTestAthlete>>;
  let otherAthlete: Awaited<ReturnType<typeof createOtherTestAthlete>>;

  beforeAll(async () => {
    athlete = await createTestAthlete();
    otherAthlete = await createOtherTestAthlete();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('Create workout (INSERT)', () => {
    it('creates a workout log with valid data', async () => {
      const { data: workout, error } = await athlete.supabase
        .from('workout_logs')
        .insert({
          athlete_id: athlete.athleteId,
          date: '2026-02-17',
          session_type: 'run',
          duration_minutes: 45,
          rpe_post: 7,
          completion_status: 'completed',
          notes: '[TEST] Easy run',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(workout).toBeDefined();
      expect(workout!.session_type).toBe('run');
      expect(workout!.duration_minutes).toBe(45);
      expect(workout!.rpe_post).toBe(7);
      expect(workout!.deleted_at).toBeNull();

      trackTestRecord('workout_logs', workout!.id);

      // Verify in real DB
      const dbRecord = await getRecord('workout_logs', { id: workout!.id });
      expect(dbRecord).not.toBeNull();
    });

    it('creates a HIIT workout with prescribed and completed data', async () => {
      const { data: workout, error } = await athlete.supabase
        .from('workout_logs')
        .insert({
          athlete_id: athlete.athleteId,
          date: '2026-02-17',
          session_type: 'hiit',
          duration_minutes: 30,
          rpe_pre: 5,
          rpe_post: 9,
          prescribed_workout: {
            sections: [
              { name: 'Warm Up', exercises: ['5 min jog', '10 air squats'] },
              { name: 'Main', exercises: ['10x SkiErg 200m, 30s rest'] },
            ],
          },
          completed_workout: {
            sections: [
              { name: 'Warm Up', completed: true },
              { name: 'Main', completed: true, notes: 'Completed 8 of 10' },
            ],
          },
          completion_status: 'partial',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(workout!.session_type).toBe('hiit');
      expect(workout!.completion_status).toBe('partial');
      expect(workout!.prescribed_workout).toBeDefined();
      expect(workout!.completed_workout).toBeDefined();

      trackTestRecord('workout_logs', workout!.id);
    });

    it('rejects invalid RPE value (constraint check)', async () => {
      const { error } = await athlete.supabase
        .from('workout_logs')
        .insert({
          athlete_id: athlete.athleteId,
          date: '2026-02-17',
          session_type: 'run',
          rpe_post: 15, // Invalid: must be 1-10
        })
        .select()
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('Read workouts (SELECT)', () => {
    it('lists only own workouts (RLS)', async () => {
      // Create workout for athlete
      const { data: w } = await athlete.supabase
        .from('workout_logs')
        .insert({
          athlete_id: athlete.athleteId,
          date: '2026-02-15',
          session_type: 'strength',
        })
        .select()
        .single();
      trackTestRecord('workout_logs', w!.id);

      // Other athlete should NOT see it
      const { data: otherWorkouts } = await otherAthlete.supabase
        .from('workout_logs')
        .select('*')
        .eq('athlete_id', athlete.athleteId);

      expect(otherWorkouts).toEqual([]);
    });

    it('filters by date range', async () => {
      // Create workouts on different dates
      for (const date of ['2026-01-01', '2026-01-15', '2026-02-01']) {
        const { data: w } = await athlete.supabase
          .from('workout_logs')
          .insert({
            athlete_id: athlete.athleteId,
            date,
            session_type: 'run',
          })
          .select()
          .single();
        trackTestRecord('workout_logs', w!.id);
      }

      const { data: filtered } = await athlete.supabase
        .from('workout_logs')
        .select('*')
        .eq('athlete_id', athlete.athleteId)
        .is('deleted_at', null)
        .gte('date', '2026-01-10')
        .lte('date', '2026-01-31');

      expect(filtered!.length).toBeGreaterThanOrEqual(1);
      for (const w of filtered!) {
        expect(new Date(w.date).getTime()).toBeGreaterThanOrEqual(
          new Date('2026-01-10').getTime(),
        );
        expect(new Date(w.date).getTime()).toBeLessThanOrEqual(
          new Date('2026-01-31').getTime(),
        );
      }
    });

    it('excludes soft-deleted workouts', async () => {
      const { data: w } = await athlete.supabase
        .from('workout_logs')
        .insert({
          athlete_id: athlete.athleteId,
          date: '2026-02-16',
          session_type: 'recovery',
        })
        .select()
        .single();
      trackTestRecord('workout_logs', w!.id);

      // Soft delete
      await athlete.supabase
        .from('workout_logs')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', w!.id);

      // Query with deleted_at filter
      const { data: active } = await athlete.supabase
        .from('workout_logs')
        .select('*')
        .eq('id', w!.id)
        .is('deleted_at', null);

      expect(active).toEqual([]);
    });
  });

  describe('Update workout (UPDATE)', () => {
    it('updates own workout', async () => {
      const { data: w } = await athlete.supabase
        .from('workout_logs')
        .insert({
          athlete_id: athlete.athleteId,
          date: '2026-02-17',
          session_type: 'run',
          duration_minutes: 30,
        })
        .select()
        .single();
      trackTestRecord('workout_logs', w!.id);

      const { data: updated, error } = await athlete.supabase
        .from('workout_logs')
        .update({ duration_minutes: 45, notes: '[TEST] Updated' })
        .eq('id', w!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated!.duration_minutes).toBe(45);
      expect(updated!.notes).toBe('[TEST] Updated');
    });

    it('other user cannot update my workout (RLS)', async () => {
      const { data: w } = await athlete.supabase
        .from('workout_logs')
        .insert({
          athlete_id: athlete.athleteId,
          date: '2026-02-17',
          session_type: 'run',
        })
        .select()
        .single();
      trackTestRecord('workout_logs', w!.id);

      // Other athlete tries to update
      await otherAthlete.supabase
        .from('workout_logs')
        .update({ notes: '[TEST] Hacked' })
        .eq('id', w!.id);

      // Verify unchanged
      const dbRecord = await getRecord('workout_logs', { id: w!.id });
      expect((dbRecord as Record<string, unknown>)?.notes).not.toBe('[TEST] Hacked');
    });
  });

  describe('Delete workout (soft delete)', () => {
    it('soft deletes own workout', async () => {
      const { data: w } = await athlete.supabase
        .from('workout_logs')
        .insert({
          athlete_id: athlete.athleteId,
          date: '2026-02-17',
          session_type: 'strength',
        })
        .select()
        .single();
      trackTestRecord('workout_logs', w!.id);

      const { error } = await athlete.supabase
        .from('workout_logs')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', w!.id);

      expect(error).toBeNull();

      // Record still exists but has deleted_at set
      const dbRecord = await getRecord('workout_logs', { id: w!.id });
      expect(dbRecord).not.toBeNull();
      expect((dbRecord as Record<string, unknown>)!.deleted_at).not.toBeNull();
    });
  });
});
