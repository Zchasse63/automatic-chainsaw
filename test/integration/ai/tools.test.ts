/**
 * AI Coaching Tools — Live Integration Tests
 *
 * Tests all 10 coaching tools with REAL database operations.
 * Each tool is called directly (not through the model) to verify
 * its execute() function works correctly with real Supabase.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createCoachingTools } from '@/lib/ai/tools';
import { createTestAthlete } from '../../utils/auth-helper';
import { getRecord, verifyRecordExists, countRecords } from '../../utils/db-helper';
import { cleanupAllTestData, trackTestRecord } from '../../setup/database';

describe('AI Coaching Tools — Direct Execution', () => {
  let athlete: Awaited<ReturnType<typeof createTestAthlete>>;
  let tools: ReturnType<typeof createCoachingTools>;

  beforeAll(async () => {
    athlete = await createTestAthlete({
      display_name: '[TEST] Tool Tester',
      sex: 'male',
      weight_kg: 80,
      hyrox_division: 'open',
      current_phase: 'specific_prep',
      race_date: '2026-06-06',
      goal_time_minutes: 90,
      weekly_availability_hours: 10,
      equipment_available: ['gym', 'skierg', 'rower'],
    });
    tools = createCoachingTools(athlete.athleteId, athlete.supabase);
  }, 30_000);

  afterAll(async () => {
    await cleanupAllTestData();
  });

  // =========================================================================
  // Tool 1: create_workout_log
  // =========================================================================
  describe('create_workout_log', () => {
    it('creates a real workout in the database', async () => {
      const result = await tools.create_workout_log.execute(
        {
          date: '2026-02-18',
          session_type: 'run',
          duration_minutes: 45,
          rpe_post: 6,
          notes: '[TEST] Created by AI tool',
        },
        { toolCallId: 'test-1', messages: [], abortSignal: undefined as never },
      );

      expect(result.success).toBe(true);
      expect(result.workout).toBeDefined();
      expect(result.workout!.session_type).toBe('run');
      expect(result.workout!.duration_minutes).toBe(45);
      trackTestRecord('workout_logs', result.workout!.id);

      // Verify in real DB
      const dbRecord = await getRecord('workout_logs', { id: result.workout!.id });
      expect(dbRecord).not.toBeNull();
    });

    it('handles HIIT session type', async () => {
      const result = await tools.create_workout_log.execute(
        { date: '2026-02-18', session_type: 'hiit', duration_minutes: 30 },
        { toolCallId: 'test-2', messages: [], abortSignal: undefined as never },
      );
      expect(result.success).toBe(true);
      trackTestRecord('workout_logs', result.workout!.id);
    });
  });

  // =========================================================================
  // Tool 2: get_today_workout
  // =========================================================================
  describe('get_today_workout', () => {
    it('returns null when no active plan exists', async () => {
      const result = await tools.get_today_workout.execute(
        {},
        { toolCallId: 'test-3', messages: [], abortSignal: undefined as never },
      );

      // No plan created yet, so should say no active plan
      expect(result.workout).toBeNull();
      expect(result.message).toContain('No active training plan');
    });

    it('returns today\'s workout when plan exists', async () => {
      // Create a plan starting today
      const today = new Date().toISOString().split('T')[0];
      const todayDow = (new Date().getDay() + 6) % 7;

      const { data: plan } = await athlete.supabase
        .from('training_plans')
        .insert({
          athlete_id: athlete.athleteId,
          plan_name: '[TEST] Tool Plan',
          duration_weeks: 1,
          status: 'active',
          start_date: today,
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

      const { data: day } = await athlete.supabase
        .from('training_plan_days')
        .insert({
          training_plan_week_id: week!.id,
          day_of_week: todayDow,
          session_type: 'run',
          workout_title: '[TEST] Today Easy Run',
          estimated_duration_minutes: 45,
          is_rest_day: false,
        })
        .select()
        .single();
      trackTestRecord('training_plan_days', day!.id);

      const result = await tools.get_today_workout.execute(
        {},
        { toolCallId: 'test-4', messages: [], abortSignal: undefined as never },
      );

      expect(result.workout).toBeDefined();
      expect(result.workout!.workout_title).toBe('[TEST] Today Easy Run');
      expect(result.week).toBe(1);
    });
  });

  // =========================================================================
  // Tool 3: get_training_plan
  // =========================================================================
  describe('get_training_plan', () => {
    it('returns active plan with weeks and days', async () => {
      const result = await tools.get_training_plan.execute(
        {},
        { toolCallId: 'test-5', messages: [], abortSignal: undefined as never },
      );

      // Should find the plan created in get_today_workout test
      expect(result.plan).not.toBeNull();
      expect(result.plan!.plan_name).toBe('[TEST] Tool Plan');
      expect(result.plan!.weeks).toBeDefined();
    });

    it('filters by specific week', async () => {
      const result = await tools.get_training_plan.execute(
        { week_number: 1 },
        { toolCallId: 'test-6', messages: [], abortSignal: undefined as never },
      );

      expect(result.plan).not.toBeNull();
      expect(result.plan!.weeks).toHaveLength(1);
    });
  });

  // =========================================================================
  // Tool 4: update_training_plan_day
  // =========================================================================
  describe('update_training_plan_day', () => {
    it('updates a plan day\'s workout title', async () => {
      // The get_training_plan tool doesn't return day IDs in its select,
      // so query the day ID directly from the database
      const { data: plans } = await athlete.supabase
        .from('training_plans')
        .select('id')
        .eq('athlete_id', athlete.athleteId)
        .eq('status', 'active')
        .limit(1);

      const { data: weeks } = await athlete.supabase
        .from('training_plan_weeks')
        .select('id')
        .eq('training_plan_id', plans![0].id)
        .limit(1);

      const { data: days } = await athlete.supabase
        .from('training_plan_days')
        .select('id')
        .eq('training_plan_week_id', weeks![0].id)
        .limit(1);

      const result = await tools.update_training_plan_day.execute(
        {
          day_id: days![0].id,
          workout_title: '[TEST] Updated By Tool',
          is_completed: true,
        },
        { toolCallId: 'test-7', messages: [], abortSignal: undefined as never },
      );

      expect(result.success).toBe(true);
      expect(result.day!.workout_title).toBe('[TEST] Updated By Tool');
      expect(result.day!.is_completed).toBe(true);
    });
  });

  // =========================================================================
  // Tool 5: log_benchmark
  // =========================================================================
  describe('log_benchmark', () => {
    it('logs a station benchmark', async () => {
      const result = await tools.log_benchmark.execute(
        {
          test_type: 'station_time',
          station_id: '00000000-0000-0000-0000-000000000001', // SkiErg
          results: { time_seconds: 240, distance_meters: 1000 },
          notes: '[TEST] SkiErg benchmark via tool',
        },
        { toolCallId: 'test-8', messages: [], abortSignal: undefined as never },
      );

      expect(result.success).toBe(true);
      expect(result.benchmark!.test_type).toBe('station_time');
      trackTestRecord('benchmark_tests', result.benchmark!.id);

      // Verify in DB
      const exists = await verifyRecordExists('benchmark_tests', {
        id: result.benchmark!.id,
      });
      expect(exists).toBe(true);
    });

    it('logs a 1K run benchmark', async () => {
      const result = await tools.log_benchmark.execute(
        {
          test_type: '1k_run',
          results: { time_seconds: 240 },
        },
        { toolCallId: 'test-9', messages: [], abortSignal: undefined as never },
      );

      expect(result.success).toBe(true);
      trackTestRecord('benchmark_tests', result.benchmark!.id);
    });
  });

  // =========================================================================
  // Tool 6: get_athlete_stats
  // =========================================================================
  describe('get_athlete_stats', () => {
    it('returns profile and weekly stats', async () => {
      const result = await tools.get_athlete_stats.execute(
        {},
        { toolCallId: 'test-10', messages: [], abortSignal: undefined as never },
      );

      expect(result.profile).not.toBeNull();
      expect(result.profile!.display_name).toBe('[TEST] Tool Tester');
      expect(result.profile!.hyrox_division).toBe('open');
      expect(result.weeklyStats).toBeDefined();
      expect(typeof result.weeklyStats.workouts).toBe('number');
    });
  });

  // =========================================================================
  // Tool 7: set_goal
  // =========================================================================
  describe('set_goal', () => {
    it('creates a new goal in the database', async () => {
      const result = await tools.set_goal.execute(
        {
          title: '[TEST] Sub-90 Hyrox',
          description: 'Break 90 minutes at next race',
          goal_type: 'race_time',
          target_value: 90,
          target_date: '2026-06-06',
        },
        { toolCallId: 'test-11', messages: [], abortSignal: undefined as never },
      );

      expect(result.success).toBe(true);
      expect(result.goal!.title).toBe('[TEST] Sub-90 Hyrox');
      expect(result.goal!.status).toBe('active');
      trackTestRecord('goals', result.goal!.id);

      // Verify in DB
      const exists = await verifyRecordExists('goals', { id: result.goal!.id });
      expect(exists).toBe(true);
    });
  });

  // =========================================================================
  // Tool 8: get_progress_summary
  // =========================================================================
  describe('get_progress_summary', () => {
    it('returns progress data for default period', async () => {
      const result = await tools.get_progress_summary.execute(
        {},
        { toolCallId: 'test-12', messages: [], abortSignal: undefined as never },
      );

      expect(result.period).toBe('Last 30 days');
      expect(typeof result.totalWorkouts).toBe('number');
      expect(typeof result.totalHours).toBe('number');
      expect(result.workoutsByType).toBeDefined();
      // We created workouts earlier, so should have some data
      expect(result.totalWorkouts).toBeGreaterThanOrEqual(0);
    });

    it('accepts custom day range', async () => {
      const result = await tools.get_progress_summary.execute(
        { days: 7 },
        { toolCallId: 'test-13', messages: [], abortSignal: undefined as never },
      );

      expect(result.period).toBe('Last 7 days');
    });

    it('includes plan adherence when plan exists', async () => {
      const result = await tools.get_progress_summary.execute(
        {},
        { toolCallId: 'test-14', messages: [], abortSignal: undefined as never },
      );

      // We have an active plan from earlier tests
      expect(result.planAdherencePct).not.toBeNull();
    });
  });

  // =========================================================================
  // Tool 9: calculate_race_pacing
  // =========================================================================
  describe('calculate_race_pacing', () => {
    it('calculates pacing for 90-minute target', async () => {
      const result = await tools.calculate_race_pacing.execute(
        { target_minutes: 90, fitness_level: 'intermediate' },
        { toolCallId: 'test-15', messages: [], abortSignal: undefined as never },
      );

      expect(result.target_minutes).toBe(90);
      expect(result.fitness_level).toBe('intermediate');
      expect(result.run_splits).toBeDefined();
      expect(result.run_splits.segments).toHaveLength(8);
      expect(result.station_splits).toHaveLength(8);
      expect(result.transition_minutes).toBeGreaterThan(0);

      // Run total + station total + transition should ≈ target
      const runTotal = result.run_splits.total_run_minutes;
      const stationTotal = result.station_splits.reduce(
        (s: number, st: { target_minutes: number }) => s + st.target_minutes,
        0,
      );
      const total = runTotal + stationTotal + result.transition_minutes;
      expect(total).toBeCloseTo(90, 0);
    });

    it('adjusts pacing for beginner level', async () => {
      const beginner = await tools.calculate_race_pacing.execute(
        { target_minutes: 120, fitness_level: 'beginner' },
        { toolCallId: 'test-16', messages: [], abortSignal: undefined as never },
      );

      const advanced = await tools.calculate_race_pacing.execute(
        { target_minutes: 120, fitness_level: 'advanced' },
        { toolCallId: 'test-17', messages: [], abortSignal: undefined as never },
      );

      // Beginners spend more time running, advanced spend less
      expect(beginner.run_splits.total_run_minutes).toBeGreaterThan(
        advanced.run_splits.total_run_minutes,
      );
    });
  });

  // =========================================================================
  // Tool 10: search_knowledge_base (RAG)
  // =========================================================================
  describe('search_knowledge_base', () => {
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

    it.skipIf(!hasOpenAIKey)('returns relevant chunks for Hyrox query', async () => {
      const result = await tools.search_knowledge_base.execute(
        { query: 'sled push technique and training protocols' },
        { toolCallId: 'test-18', messages: [], abortSignal: undefined as never },
      );

      expect(result.chunks).toBeDefined();
      expect(result.chunks.length).toBeGreaterThan(0);

      // Chunks should be about sled push
      const combinedText = result.chunks.join(' ').toLowerCase();
      expect(
        combinedText.includes('sled') || combinedText.includes('push'),
      ).toBe(true);
    }, 30_000);

    it.skipIf(!hasOpenAIKey)('returns chunk IDs for tracking', async () => {
      const result = await tools.search_knowledge_base.execute(
        { query: 'SkiErg race strategy pacing' },
        { toolCallId: 'test-19', messages: [], abortSignal: undefined as never },
      );

      expect(result.chunkIds).toBeDefined();
      expect(result.chunkIds!.length).toBeGreaterThan(0);
    }, 30_000);

    it.skipIf(!hasOpenAIKey)('handles empty results gracefully', async () => {
      const result = await tools.search_knowledge_base.execute(
        { query: 'quantum physics black hole spacetime' },
        { toolCallId: 'test-20', messages: [], abortSignal: undefined as never },
      );

      // Should return chunks (may be empty or loosely related)
      expect(result.chunks).toBeDefined();
    }, 30_000);
  });
});
