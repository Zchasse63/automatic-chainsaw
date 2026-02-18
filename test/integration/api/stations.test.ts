/**
 * Stations API — Live Integration Tests
 *
 * Tests reference data access against REAL Supabase.
 * Stations are public read-only data, no auth required for DB access.
 */

import { describe, it, expect } from 'vitest';
import { anonClient } from '../../setup/database';

describe('Stations (reference data)', () => {
  it('returns all 8 Hyrox stations', async () => {
    const { data: stations, error } = await anonClient
      .from('hyrox_stations')
      .select('*')
      .order('station_number', { ascending: true });

    expect(error).toBeNull();
    expect(stations).toHaveLength(8);
  });

  it('has correct station names in order', async () => {
    const { data: stations } = await anonClient
      .from('hyrox_stations')
      .select('station_number, station_name')
      .order('station_number', { ascending: true });

    const names = stations!.map((s) => s.station_name);
    expect(names).toEqual([
      'SkiErg',
      'Sled Push',
      'Sled Pull',
      'Burpee Broad Jumps',
      'Rowing',
      'Farmers Carry',
      'Sandbag Lunges',
      'Wall Balls',
    ]);
  });

  it('each station has weights_by_division JSONB', async () => {
    const { data: stations } = await anonClient
      .from('hyrox_stations')
      .select('station_name, weights_by_division');

    for (const station of stations!) {
      expect(station.weights_by_division).toBeDefined();
      expect(typeof station.weights_by_division).toBe('object');
    }
  });

  it('exercise library has entries for all categories', async () => {
    const { data: exercises } = await anonClient
      .from('exercise_library')
      .select('category')
      .eq('is_active', true);

    const categories = new Set(exercises!.map((e) => e.category));
    expect(categories).toContain('station_specific');
    expect(categories).toContain('running');
    expect(categories).toContain('strength');
    expect(categories).toContain('conditioning');
    expect(categories).toContain('recovery');
  });

  it('skill level benchmarks cover all stations and genders', async () => {
    const { data: benchmarks } = await anonClient
      .from('skill_level_benchmarks')
      .select('station_id, gender, skill_level')
      .not('station_id', 'is', null);

    expect(benchmarks!.length).toBeGreaterThan(0);

    const genders = new Set(benchmarks!.map((b) => b.gender));
    expect(genders).toContain('male');
    expect(genders).toContain('female');

    const levels = new Set(benchmarks!.map((b) => b.skill_level));
    expect(levels).toContain('elite');
    expect(levels).toContain('advanced');
    expect(levels).toContain('intermediate');
    expect(levels).toContain('beginner');
  });

  it('achievement definitions exist for all categories', async () => {
    const { data: achievements } = await anonClient
      .from('achievement_definitions')
      .select('category');

    const categories = new Set(achievements!.map((a) => a.category));
    expect(categories).toContain('getting_started');
    expect(categories).toContain('consistency');
    expect(categories).toContain('performance');
    expect(categories).toContain('racing');
  });

  it('knowledge chunks are accessible (RAG data)', async () => {
    const { data: chunks, count } = await anonClient
      .from('knowledge_chunks')
      .select('id', { count: 'exact' })
      .limit(1);

    expect(chunks).not.toBeNull();
    expect(count).toBeGreaterThan(200); // 239 expected
  });
});
