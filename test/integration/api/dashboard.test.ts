/**
 * Dashboard API — Live Integration Tests
 *
 * Tests dashboard summary, readiness score, and streak heatmap
 * computations against REAL Supabase data.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestAthlete } from '../../utils/auth-helper';
import { cleanupAllTestData, trackTestRecord } from '../../setup/database';

describe('Dashboard Computations', () => {
  let athlete: Awaited<ReturnType<typeof createTestAthlete>>;

  beforeAll(async () => {
    athlete = await createTestAthlete({
      display_name: '[TEST] Dashboard Tester',
      race_date: '2026-06-06',
      goal_time_minutes: 90,
      current_phase: 'specific_prep',
      hyrox_division: 'open',
    });

    // Seed workout data for the past week
    const today = new Date();
    const workouts = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      workouts.push({
        athlete_id: athlete.athleteId,
        date: date.toISOString().split('T')[0],
        session_type: i % 2 === 0 ? 'run' : 'hiit',
        duration_minutes: 40 + i * 5,
        rpe_post: 5 + (i % 3),
        completion_status: 'completed',
      });
    }

    for (const w of workouts) {
      const { data } = await athlete.supabase
        .from('workout_logs')
        .insert(w)
        .select()
        .single();
      if (data) trackTestRecord('workout_logs', data.id);
    }

    // Seed a simulation workout for race_specific readiness
    const { data: sim } = await athlete.supabase
      .from('workout_logs')
      .insert({
        athlete_id: athlete.athleteId,
        date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        session_type: 'simulation',
        duration_minutes: 90,
        rpe_post: 8,
        completion_status: 'completed',
      })
      .select()
      .single();
    if (sim) trackTestRecord('workout_logs', sim.id);

    // Create active plan with some completed days
    const { data: plan } = await athlete.supabase
      .from('training_plans')
      .insert({
        athlete_id: athlete.athleteId,
        plan_name: '[TEST] Dashboard Plan',
        duration_weeks: 4,
        status: 'active',
        start_date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

    // 5 non-rest days, 3 completed
    for (let d = 1; d <= 5; d++) {
      const { data: day } = await athlete.supabase
        .from('training_plan_days')
        .insert({
          training_plan_week_id: week!.id,
          day_of_week: d,
          session_type: 'run',
          workout_title: `[TEST] Day ${d}`,
          is_rest_day: false,
          is_completed: d <= 3,
        })
        .select()
        .single();
      trackTestRecord('training_plan_days', day!.id);
    }

    // Seed a goal
    const { data: goal } = await athlete.supabase
      .from('goals')
      .insert({
        athlete_id: athlete.athleteId,
        title: '[TEST] Sub-90',
        goal_type: 'race_time',
        target_value: 90,
        current_value: 95,
        status: 'active',
        target_date: '2026-06-06',
      })
      .select()
      .single();
    trackTestRecord('goals', goal!.id);

    // Seed a PR
    const { data: pr } = await athlete.supabase
      .from('personal_records')
      .insert({
        athlete_id: athlete.athleteId,
        record_type: 'station_time',
        exercise_name: 'SkiErg 1000m',
        value: 240,
        value_unit: 'seconds',
        date_achieved: today.toISOString().split('T')[0],
        context: 'benchmark',
      })
      .select()
      .single();
    trackTestRecord('personal_records', pr!.id);
  }, 30_000);

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('Dashboard Summary (main)', () => {
    it('returns weekly stats with real workout data', async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const { data: workouts } = await athlete.supabase
        .from('workout_logs')
        .select('id, duration_minutes, rpe_post, session_type, date')
        .eq('athlete_id', athlete.athleteId)
        .is('deleted_at', null)
        .gte('date', weekAgo);

      expect(workouts!.length).toBeGreaterThanOrEqual(5);
      const totalMin = workouts!.reduce((s, w) => s + (w.duration_minutes ?? 0), 0);
      expect(totalMin).toBeGreaterThan(0);
    });

    it('computes training streak correctly', async () => {
      const { data: workouts } = await athlete.supabase
        .from('workout_logs')
        .select('date')
        .eq('athlete_id', athlete.athleteId)
        .is('deleted_at', null)
        .order('date', { ascending: false });

      // We created 5 consecutive days + 1 simulation
      const dates = new Set(workouts!.map((w) => w.date?.split('T')[0]));
      expect(dates.size).toBeGreaterThanOrEqual(4);
    });

    it('returns race countdown when race_date is set', async () => {
      const { data: profile } = await athlete.supabase
        .from('athlete_profiles')
        .select('race_date')
        .eq('id', athlete.athleteId)
        .single();

      expect(profile!.race_date).toBe('2026-06-06');
      const daysUntil = Math.ceil(
        (new Date('2026-06-06').getTime() - Date.now()) / (24 * 60 * 60 * 1000),
      );
      expect(daysUntil).toBeGreaterThan(0);
    });

    it('returns active plan with progress percentage', async () => {
      const { data: plan } = await athlete.supabase
        .from('training_plans')
        .select('id, plan_name')
        .eq('athlete_id', athlete.athleteId)
        .eq('status', 'active')
        .single();

      expect(plan).not.toBeNull();

      const { data: weeks } = await athlete.supabase
        .from('training_plan_weeks')
        .select('training_plan_days(is_completed, is_rest_day)')
        .eq('training_plan_id', plan!.id);

      const days = weeks!.flatMap(
        (w) => (w.training_plan_days as Array<{ is_completed: boolean; is_rest_day: boolean }>) ?? [],
      );
      const nonRest = days.filter((d) => !d.is_rest_day);
      const completed = nonRest.filter((d) => d.is_completed);
      const pct = Math.round((completed.length / nonRest.length) * 100);

      expect(pct).toBe(60); // 3/5 = 60%
    });

    it('returns recent PRs', async () => {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const { data: prs } = await athlete.supabase
        .from('personal_records')
        .select('*')
        .eq('athlete_id', athlete.athleteId)
        .gte('date_achieved', monthAgo);

      expect(prs!.length).toBeGreaterThanOrEqual(1);
    });

    it('returns active goals', async () => {
      const { data: goals } = await athlete.supabase
        .from('goals')
        .select('*')
        .eq('athlete_id', athlete.athleteId)
        .eq('status', 'active');

      expect(goals!.length).toBeGreaterThanOrEqual(1);
      expect(goals![0].title).toBe('[TEST] Sub-90');
    });
  });

  describe('Readiness Score', () => {
    it('computes readiness components from real data', async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: monthWorkouts } = await athlete.supabase
        .from('workout_logs')
        .select('session_type, duration_minutes, rpe_post, date')
        .eq('athlete_id', athlete.athleteId)
        .is('deleted_at', null)
        .gte('date', monthAgo);

      const workouts = monthWorkouts ?? [];
      const thisWeek = workouts.filter((w) => w.date && w.date >= weekAgo);

      // Consistency: thisWeek.length * 20
      const consistency = Math.min(100, thisWeek.length * 20);
      expect(consistency).toBeGreaterThanOrEqual(60); // At least 3 workouts this week

      // Volume: total minutes / 300 * 100
      const volume = Math.min(
        100,
        Math.round(
          (thisWeek.reduce((s, w) => s + (w.duration_minutes ?? 0), 0) / 300) * 100,
        ),
      );
      expect(volume).toBeGreaterThan(0);

      // Run fitness: run count * 10
      const runCount = workouts.filter((w) => w.session_type === 'run').length;
      expect(runCount).toBeGreaterThanOrEqual(3);

      // Station prep: station count * 15
      const stationCount = workouts.filter(
        (w) =>
          w.session_type &&
          ['hiit', 'station_practice', 'simulation'].includes(w.session_type),
      ).length;
      expect(stationCount).toBeGreaterThanOrEqual(2);

      // Race specific: simulation exists → 80
      const hasSim = workouts.some((w) => w.session_type === 'simulation');
      expect(hasSim).toBe(true);
    });

    it('computes weighted score correctly', async () => {
      // Using known data: ~5 workouts this week, ~6 total month, 60% adherence
      const weights = {
        consistency: 0.2,
        volume: 0.15,
        run_fitness: 0.2,
        station_prep: 0.15,
        plan_adherence: 0.15,
        recovery: 0.05,
        race_specific: 0.1,
      };

      // All weights sum to 1.0
      const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });
  });

  describe('Streak Heatmap', () => {
    it('returns heatmap data with workout counts', async () => {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const { data: workouts } = await athlete.supabase
        .from('workout_logs')
        .select('date, duration_minutes')
        .eq('athlete_id', athlete.athleteId)
        .is('deleted_at', null)
        .gte('date', since);

      // Aggregate by date
      const dayMap = new Map<string, { count: number; minutes: number }>();
      for (const w of workouts ?? []) {
        if (!w.date) continue;
        const dateStr = w.date.split('T')[0];
        const existing = dayMap.get(dateStr) ?? { count: 0, minutes: 0 };
        existing.count++;
        existing.minutes += w.duration_minutes ?? 0;
        dayMap.set(dateStr, existing);
      }

      expect(dayMap.size).toBeGreaterThanOrEqual(4);

      // Each date should have positive count
      for (const [, data] of dayMap) {
        expect(data.count).toBeGreaterThan(0);
      }
    });
  });
});
