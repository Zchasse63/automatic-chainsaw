/**
 * Races API — Live Integration Tests
 *
 * Tests race results + splits against REAL Supabase.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestAthlete, createOtherTestAthlete } from '../../utils/auth-helper';
import { getRecords, verifyRecordExists } from '../../utils/db-helper';
import { cleanupAllTestData, trackTestRecord } from '../../setup/database';

const SKIERG_ID = '00000000-0000-0000-0000-000000000001';
const SLED_PUSH_ID = '00000000-0000-0000-0000-000000000002';

describe('Races & Splits', () => {
  let athlete: Awaited<ReturnType<typeof createTestAthlete>>;
  let otherAthlete: Awaited<ReturnType<typeof createOtherTestAthlete>>;

  beforeAll(async () => {
    athlete = await createTestAthlete();
    otherAthlete = await createOtherTestAthlete();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  it('logs a race result', async () => {
    const { data: race, error } = await athlete.supabase
      .from('race_results')
      .insert({
        athlete_id: athlete.athleteId,
        race_date: '2026-02-01',
        race_name: '[TEST] Hyrox NYC',
        location: 'New York',
        division: 'open',
        format: 'singles',
        total_time_seconds: 5400, // 90 minutes
        is_simulation: false,
        notes: '[TEST] First race',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(race!.total_time_seconds).toBe(5400);
    expect(race!.race_name).toBe('[TEST] Hyrox NYC');
    trackTestRecord('race_results', race!.id);
  });

  it('logs race with splits (cascade insert)', async () => {
    // Create race
    const { data: race } = await athlete.supabase
      .from('race_results')
      .insert({
        athlete_id: athlete.athleteId,
        race_date: '2026-01-15',
        race_name: '[TEST] Hyrox Dallas',
        total_time_seconds: 6000,
        division: 'open',
        format: 'singles',
      })
      .select()
      .single();
    trackTestRecord('race_results', race!.id);

    // Add splits
    const splits = [
      { race_result_id: race!.id, split_number: 1, split_type: 'run', time_seconds: 300 },
      { race_result_id: race!.id, split_number: 2, split_type: 'station', station_id: SKIERG_ID, time_seconds: 240 },
      { race_result_id: race!.id, split_number: 3, split_type: 'run', time_seconds: 310 },
      { race_result_id: race!.id, split_number: 4, split_type: 'station', station_id: SLED_PUSH_ID, time_seconds: 200 },
    ];

    const { error: splitErr } = await athlete.supabase
      .from('race_splits')
      .insert(splits);

    expect(splitErr).toBeNull();

    // Verify splits exist
    const dbSplits = await getRecords('race_splits', {
      race_result_id: race!.id,
    });
    expect(dbSplits.length).toBe(4);

    // Track for cleanup
    for (const s of dbSplits) {
      trackTestRecord('race_splits', (s as Record<string, unknown>).id as string);
    }
  });

  it('cascade deletes splits when race is deleted', async () => {
    const { data: race } = await athlete.supabase
      .from('race_results')
      .insert({
        athlete_id: athlete.athleteId,
        race_date: '2026-01-10',
        race_name: '[TEST] To Delete',
        total_time_seconds: 5000,
      })
      .select()
      .single();
    trackTestRecord('race_results', race!.id);

    // Add a split
    const { data: split } = await athlete.supabase
      .from('race_splits')
      .insert({
        race_result_id: race!.id,
        split_number: 1,
        split_type: 'run',
        time_seconds: 300,
      })
      .select()
      .single();
    trackTestRecord('race_splits', split!.id);

    // Delete race
    await athlete.supabase.from('race_results').delete().eq('id', race!.id);

    // Verify split was cascade-deleted
    const exists = await verifyRecordExists('race_splits', { id: split!.id });
    expect(exists).toBe(false);
  });

  it('other user cannot read my races (RLS)', async () => {
    const { data: race } = await athlete.supabase
      .from('race_results')
      .insert({
        athlete_id: athlete.athleteId,
        race_date: '2026-02-01',
        race_name: '[TEST] Private Race',
        total_time_seconds: 5400,
      })
      .select()
      .single();
    trackTestRecord('race_results', race!.id);

    const { data: otherRaces } = await otherAthlete.supabase
      .from('race_results')
      .select('*')
      .eq('athlete_id', athlete.athleteId);

    expect(otherRaces).toEqual([]);
  });

  it('enforces split_number range (1-16)', async () => {
    const { data: race } = await athlete.supabase
      .from('race_results')
      .insert({
        athlete_id: athlete.athleteId,
        race_date: '2026-02-01',
        total_time_seconds: 5400,
      })
      .select()
      .single();
    trackTestRecord('race_results', race!.id);

    const { error } = await athlete.supabase.from('race_splits').insert({
      race_result_id: race!.id,
      split_number: 17, // Invalid: max is 16
      split_type: 'run',
      time_seconds: 300,
    });

    expect(error).not.toBeNull();
  });
});
