/**
 * Achievements API — Live Integration Tests
 *
 * Tests achievement definitions, athlete achievements (earned status),
 * and RLS isolation against REAL Supabase data.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestAthlete, createOtherTestAthlete } from '../../utils/auth-helper';
import { cleanupAllTestData, adminClient, trackTestRecord } from '../../setup/database';

describe('Achievements', () => {
  let athlete: Awaited<ReturnType<typeof createTestAthlete>>;
  let otherAthlete: Awaited<ReturnType<typeof createOtherTestAthlete>>;
  let achievementDefId: string;

  beforeAll(async () => {
    athlete = await createTestAthlete({
      display_name: '[TEST] Achievement Tester',
    });
    otherAthlete = await createOtherTestAthlete({
      display_name: '[TEST] Other Achievement Tester',
    });

    // Get a real achievement definition from the seeded data
    const { data: defs } = await adminClient
      .from('achievement_definitions')
      .select('id, name')
      .limit(1)
      .single();

    expect(defs).not.toBeNull();
    achievementDefId = defs!.id;
  }, 30_000);

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('Achievement Definitions', () => {
    it('can read achievement definitions (public access)', async () => {
      const { data: defs, error } = await athlete.supabase
        .from('achievement_definitions')
        .select('id, name, description, icon_name, category, tier');

      expect(error).toBeNull();
      expect(defs).not.toBeNull();
      expect(defs!.length).toBeGreaterThanOrEqual(5); // Seeded data has 23 achievements
    });

    it('achievement definitions have required fields', async () => {
      const { data: defs } = await athlete.supabase
        .from('achievement_definitions')
        .select('*')
        .limit(3);

      for (const def of defs ?? []) {
        expect(def.name).toBeTruthy();
        expect(def.description).toBeTruthy();
        expect(def.icon_name).toBeTruthy();
        expect(['getting_started', 'consistency', 'performance', 'racing']).toContain(def.category);
        expect(['common', 'uncommon', 'rare', 'epic', 'legendary']).toContain(def.tier);
      }
    });
  });

  describe('Athlete Achievements', () => {
    it('can earn an achievement', async () => {
      const { data, error } = await athlete.supabase
        .from('athlete_achievements')
        .insert({
          athlete_id: athlete.athleteId,
          achievement_id: achievementDefId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.athlete_id).toBe(athlete.athleteId);
      expect(data!.achievement_id).toBe(achievementDefId);
      expect(data!.earned_at).toBeTruthy();
      trackTestRecord('athlete_achievements', data!.id);
    });

    it('prevents duplicate achievement for same athlete', async () => {
      const { error } = await athlete.supabase
        .from('athlete_achievements')
        .insert({
          athlete_id: athlete.athleteId,
          achievement_id: achievementDefId,
        });

      expect(error).not.toBeNull();
      expect(error!.code).toBe('23505'); // unique_violation
    });

    it('can read own achievements', async () => {
      const { data, error } = await athlete.supabase
        .from('athlete_achievements')
        .select('id, achievement_id, earned_at')
        .eq('athlete_id', athlete.athleteId);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(1);
    });

    it('other user cannot see my achievements (RLS)', async () => {
      const { data } = await otherAthlete.supabase
        .from('athlete_achievements')
        .select('id')
        .eq('athlete_id', athlete.athleteId);

      expect(data).toEqual([]);
    });

    it('combined view: definitions + earned status', async () => {
      // This mirrors what /api/achievements does
      const { data: defs } = await athlete.supabase
        .from('achievement_definitions')
        .select('id, name, description, icon_name, category, tier');

      const { data: earned } = await athlete.supabase
        .from('athlete_achievements')
        .select('achievement_id, earned_at')
        .eq('athlete_id', athlete.athleteId);

      const earnedMap = new Map(
        (earned ?? []).map((e) => [e.achievement_id, e.earned_at]),
      );

      const achievements = (defs ?? []).map((def) => ({
        ...def,
        is_unlocked: earnedMap.has(def.id),
        unlocked_at: earnedMap.get(def.id) ?? null,
      }));

      // At least one should be unlocked
      const unlocked = achievements.filter((a) => a.is_unlocked);
      expect(unlocked.length).toBeGreaterThanOrEqual(1);
      expect(unlocked[0].unlocked_at).toBeTruthy();

      // Many should still be locked
      const locked = achievements.filter((a) => !a.is_unlocked);
      expect(locked.length).toBeGreaterThan(0);
    });
  });
});
