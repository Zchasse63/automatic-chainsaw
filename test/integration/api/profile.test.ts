/**
 * Profile API — Live Integration Tests
 *
 * Tests athlete profile CRUD against REAL Supabase.
 * Creates real users, real profiles, verifies real database state.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createTestUser,
  createTestAthlete,
  type TestUser,
} from '../../utils/auth-helper';
import { getRecord, verifyRecordExists } from '../../utils/db-helper';
import { cleanupAllTestData, trackTestRecord } from '../../setup/database';

describe('Profile CRUD', () => {
  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('Create profile (INSERT)', () => {
    it('creates an athlete profile for a new user', async () => {
      const user = await createTestUser();

      const { data: profile, error } = await user.supabase
        .from('athlete_profiles')
        .insert({
          user_id: user.id,
          display_name: '[TEST] New Athlete',
          hyrox_division: 'open',
          current_phase: 'general_prep',
          units_preference: 'metric',
          profile_complete: true,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(profile).toBeDefined();
      expect(profile!.display_name).toBe('[TEST] New Athlete');
      expect(profile!.hyrox_division).toBe('open');
      expect(profile!.user_id).toBe(user.id);

      trackTestRecord('athlete_profiles', profile!.id);

      // Verify in real DB via admin
      const dbRecord = await getRecord('athlete_profiles', { id: profile!.id });
      expect(dbRecord).not.toBeNull();
      expect((dbRecord as Record<string, unknown>)!.display_name).toBe('[TEST] New Athlete');
    });

    it('rejects duplicate profile for same user', async () => {
      const athlete = await createTestAthlete();

      // Try to create a second profile
      const { error } = await athlete.supabase
        .from('athlete_profiles')
        .insert({
          user_id: athlete.id,
          display_name: '[TEST] Duplicate',
          hyrox_division: 'open',
          current_phase: 'general_prep',
          units_preference: 'metric',
          profile_complete: true,
        })
        .select()
        .single();

      // Should fail due to UNIQUE constraint on user_id
      expect(error).not.toBeNull();
    });
  });

  describe('Read profile (SELECT)', () => {
    it('user can read their own profile', async () => {
      const athlete = await createTestAthlete({
        display_name: '[TEST] Reader',
        sex: 'male',
        weight_kg: 80,
      });

      const { data: profile, error } = await athlete.supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', athlete.id)
        .single();

      expect(error).toBeNull();
      expect(profile!.display_name).toBe('[TEST] Reader');
      expect(profile!.sex).toBe('male');
      expect(profile!.weight_kg).toBe(80);
    });

    it('user cannot read another user\'s profile (RLS)', async () => {
      const athlete1 = await createTestAthlete({ display_name: '[TEST] A1' });
      const athlete2 = await createTestAthlete({ display_name: '[TEST] A2' });

      // Athlete2 tries to read athlete1's profile
      const { data: profiles } = await athlete2.supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', athlete1.id);

      // RLS should return empty array (not the other user's profile)
      expect(profiles).toEqual([]);
    });
  });

  describe('Update profile (UPDATE)', () => {
    it('user can update their own profile', async () => {
      const athlete = await createTestAthlete({
        display_name: '[TEST] Before Update',
      });

      const { data: updated, error } = await athlete.supabase
        .from('athlete_profiles')
        .update({
          display_name: '[TEST] After Update',
          goal_time_minutes: 90,
          race_date: '2026-06-06',
        })
        .eq('user_id', athlete.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated!.display_name).toBe('[TEST] After Update');
      expect(updated!.goal_time_minutes).toBe(90);
      expect(updated!.race_date).toBe('2026-06-06');

      // Verify updated_at trigger fired
      expect(updated!.updated_at).not.toEqual(updated!.created_at);
    });

    it('user cannot update another user\'s profile (RLS)', async () => {
      const athlete1 = await createTestAthlete({ display_name: '[TEST] Target' });
      const athlete2 = await createTestAthlete();

      // Athlete2 tries to update athlete1's profile
      await athlete2.supabase
        .from('athlete_profiles')
        .update({ display_name: '[TEST] Hacked' })
        .eq('user_id', athlete1.id);

      // Verify original name unchanged
      const dbRecord = await getRecord('athlete_profiles', {
        user_id: athlete1.id,
      });
      expect((dbRecord as Record<string, unknown>)!.display_name).toBe('[TEST] Target');
    });
  });

  describe('Delete profile (DELETE)', () => {
    it('user can delete their own profile', async () => {
      const athlete = await createTestAthlete();

      const { error } = await athlete.supabase
        .from('athlete_profiles')
        .delete()
        .eq('user_id', athlete.id);

      expect(error).toBeNull();

      const exists = await verifyRecordExists('athlete_profiles', {
        user_id: athlete.id,
      });
      expect(exists).toBe(false);
    });
  });
});
