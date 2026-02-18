/**
 * Personal Records API — Live Integration Tests
 *
 * Tests PR tracking against REAL Supabase.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestAthlete, createOtherTestAthlete } from '../../utils/auth-helper';
import { cleanupAllTestData, trackTestRecord } from '../../setup/database';

const SKIERG_ID = '00000000-0000-0000-0000-000000000001';
const ROWING_ID = '00000000-0000-0000-0000-000000000005';

describe('Personal Records CRUD', () => {
  let athlete: Awaited<ReturnType<typeof createTestAthlete>>;
  let otherAthlete: Awaited<ReturnType<typeof createOtherTestAthlete>>;

  beforeAll(async () => {
    athlete = await createTestAthlete();
    otherAthlete = await createOtherTestAthlete();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  it('logs a station time PR', async () => {
    const { data: pr, error } = await athlete.supabase
      .from('personal_records')
      .insert({
        athlete_id: athlete.athleteId,
        record_type: 'station_time',
        station_id: SKIERG_ID,
        exercise_name: 'SkiErg 1000m',
        value: 235,
        value_unit: 'seconds',
        date_achieved: '2026-02-17',
        context: 'benchmark',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(pr!.record_type).toBe('station_time');
    expect(pr!.value).toBe(235);
    expect(pr!.value_unit).toBe('seconds');
    trackTestRecord('personal_records', pr!.id);
  });

  it('logs a weight PR with previous value', async () => {
    const { data: pr, error } = await athlete.supabase
      .from('personal_records')
      .insert({
        athlete_id: athlete.athleteId,
        record_type: 'exercise_weight',
        exercise_name: 'Back Squat',
        value: 140,
        value_unit: 'kg',
        previous_value: 135,
        date_achieved: '2026-02-17',
        context: 'training',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(pr!.previous_value).toBe(135);
    trackTestRecord('personal_records', pr!.id);
  });

  it('logs a running pace PR', async () => {
    const { data: pr, error } = await athlete.supabase
      .from('personal_records')
      .insert({
        athlete_id: athlete.athleteId,
        record_type: 'running_pace',
        exercise_name: '5K Run',
        value: 4.5,
        value_unit: 'min_per_km',
        date_achieved: '2026-02-17',
        context: 'race',
      })
      .select()
      .single();

    expect(error).toBeNull();
    trackTestRecord('personal_records', pr!.id);
  });

  it('filters PRs by record type', async () => {
    const { data: stationPRs } = await athlete.supabase
      .from('personal_records')
      .select('*')
      .eq('athlete_id', athlete.athleteId)
      .eq('record_type', 'station_time');

    for (const pr of stationPRs!) {
      expect(pr.record_type).toBe('station_time');
    }
  });

  it('filters PRs by station', async () => {
    // Add a rowing PR
    const { data: pr } = await athlete.supabase
      .from('personal_records')
      .insert({
        athlete_id: athlete.athleteId,
        record_type: 'station_time',
        station_id: ROWING_ID,
        exercise_name: 'Rowing 1000m',
        value: 210,
        value_unit: 'seconds',
        date_achieved: '2026-02-17',
        context: 'benchmark',
      })
      .select()
      .single();
    trackTestRecord('personal_records', pr!.id);

    const { data: rowingPRs } = await athlete.supabase
      .from('personal_records')
      .select('*')
      .eq('athlete_id', athlete.athleteId)
      .eq('station_id', ROWING_ID);

    expect(rowingPRs!.length).toBeGreaterThanOrEqual(1);
    for (const p of rowingPRs!) {
      expect(p.station_id).toBe(ROWING_ID);
    }
  });

  it('other user cannot read my PRs (RLS)', async () => {
    const { data: otherPRs } = await otherAthlete.supabase
      .from('personal_records')
      .select('*')
      .eq('athlete_id', athlete.athleteId);

    expect(otherPRs).toEqual([]);
  });
});
