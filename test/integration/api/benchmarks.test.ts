/**
 * Benchmarks API — Live Integration Tests
 *
 * Tests benchmark logging against REAL Supabase.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestAthlete, createOtherTestAthlete } from '../../utils/auth-helper';
import { getRecord } from '../../utils/db-helper';
import { cleanupAllTestData, trackTestRecord } from '../../setup/database';

// Fixed station IDs from seed data
const SKIERG_ID = '00000000-0000-0000-0000-000000000001';
const SLED_PUSH_ID = '00000000-0000-0000-0000-000000000002';
const WALL_BALLS_ID = '00000000-0000-0000-0000-000000000008';

describe('Benchmarks CRUD', () => {
  let athlete: Awaited<ReturnType<typeof createTestAthlete>>;
  let otherAthlete: Awaited<ReturnType<typeof createOtherTestAthlete>>;

  beforeAll(async () => {
    athlete = await createTestAthlete();
    otherAthlete = await createOtherTestAthlete();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  it('logs a SkiErg benchmark', async () => {
    const { data: benchmark, error } = await athlete.supabase
      .from('benchmark_tests')
      .insert({
        athlete_id: athlete.athleteId,
        test_type: 'station_time',
        station_id: SKIERG_ID,
        results: { time_seconds: 240, distance_meters: 1000 },
        test_date: '2026-02-17',
        notes: '[TEST] 1000m SkiErg benchmark',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(benchmark!.test_type).toBe('station_time');
    expect(benchmark!.station_id).toBe(SKIERG_ID);
    expect(benchmark!.results).toEqual({ time_seconds: 240, distance_meters: 1000 });
    trackTestRecord('benchmark_tests', benchmark!.id);
  });

  it('logs benchmarks for multiple stations', async () => {
    const stations = [
      { station_id: SLED_PUSH_ID, results: { time_seconds: 180 } },
      { station_id: WALL_BALLS_ID, results: { time_seconds: 300, reps: 75 } },
    ];

    for (const { station_id, results } of stations) {
      const { data: b } = await athlete.supabase
        .from('benchmark_tests')
        .insert({
          athlete_id: athlete.athleteId,
          test_type: 'station_time',
          station_id,
          results,
          test_date: '2026-02-17',
        })
        .select()
        .single();
      trackTestRecord('benchmark_tests', b!.id);
    }

    // Query all benchmarks
    const { data: all } = await athlete.supabase
      .from('benchmark_tests')
      .select('*')
      .eq('athlete_id', athlete.athleteId)
      .order('test_date', { ascending: false });

    expect(all!.length).toBeGreaterThanOrEqual(2);
  });

  it('filters benchmarks by type', async () => {
    const { data: b1 } = await athlete.supabase
      .from('benchmark_tests')
      .insert({
        athlete_id: athlete.athleteId,
        test_type: '1k_run',
        results: { time_seconds: 240 },
        test_date: '2026-02-17',
      })
      .select()
      .single();
    trackTestRecord('benchmark_tests', b1!.id);

    const { data: filtered } = await athlete.supabase
      .from('benchmark_tests')
      .select('*')
      .eq('athlete_id', athlete.athleteId)
      .eq('test_type', '1k_run');

    for (const b of filtered!) {
      expect(b.test_type).toBe('1k_run');
    }
  });

  it('other user cannot read my benchmarks (RLS)', async () => {
    const { data: b } = await athlete.supabase
      .from('benchmark_tests')
      .insert({
        athlete_id: athlete.athleteId,
        test_type: 'station_time',
        station_id: SKIERG_ID,
        results: { time_seconds: 250 },
        test_date: '2026-02-17',
      })
      .select()
      .single();
    trackTestRecord('benchmark_tests', b!.id);

    const { data: otherBenchmarks } = await otherAthlete.supabase
      .from('benchmark_tests')
      .select('*')
      .eq('athlete_id', athlete.athleteId);

    expect(otherBenchmarks).toEqual([]);
  });
});
