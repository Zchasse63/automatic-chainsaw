/**
 * Training Plan Creation & Acceptance — E2E Tests
 *
 * Tests the full plan flow: Coach generates plan → extraction →
 * review modal → save to DB. This was previously broken
 * (day_of_week constraints, session_type mismatches) and has been fixed.
 *
 * Also tests the training page, calendar, and plan display.
 */

import { test, expect } from '../fixtures/auth';

test.describe('Training Page', () => {
  test('training page loads', async ({ authedPage }) => {
    await authedPage.goto('/training');
    await authedPage.waitForURL('**/training', { timeout: 10_000 });
    await expect(authedPage.locator('h1:has-text("Training")')).toBeVisible({ timeout: 10_000 });
  });

  test('training page shows Log Workout button', async ({ authedPage }) => {
    await authedPage.goto('/training');
    await authedPage.waitForURL('**/training', { timeout: 10_000 });
    await expect(authedPage.locator('text=Log Workout')).toBeVisible({ timeout: 10_000 });
  });

  test('log workout link navigates to workout log form', async ({ authedPage }) => {
    await authedPage.goto('/training');
    await authedPage.waitForURL('**/training', { timeout: 10_000 });

    const logBtn = authedPage.locator('a[href*="/training/log"]');
    await expect(logBtn).toBeVisible({ timeout: 10_000 });
    await logBtn.click();
    await authedPage.waitForURL('**/training/log', { timeout: 10_000 });
    await expect(authedPage).toHaveURL(/\/training\/log/);
  });
});

test.describe('Training Plan API', () => {
  test('GET /api/training-plans returns array', async ({ authedPage }) => {
    const response = await authedPage.request.get('/api/training-plans');
    expect(response.status()).toBe(200);

    const data = await response.json();
    // Should return an array (may be empty if no plans yet)
    expect(Array.isArray(data.plans || data)).toBe(true);
  });

  test('POST /api/training-plans/extract processes plan text', async ({ authedPage }) => {
    test.setTimeout(90_000);

    const planText = `
Here's your 4-week training plan:

**Week 1: Foundation Building**
- Monday (Day 1): Easy Run — 5km at conversational pace, 30 min
- Tuesday (Day 2): HIIT — 4 rounds of 400m run + 15 burpees, 45 min
- Wednesday (Day 3): Strength — Upper body focus: bench press 4x8, rows 4x10, 50 min
- Thursday (Day 4): Rest Day
- Friday (Day 5): Run — Tempo run 6km, 35 min
- Saturday (Day 6): Simulation — Full Hyrox simulation practice, 60 min
- Sunday (Day 7): Recovery — Light yoga and mobility, 30 min

**Week 2: Build Phase**
- Monday: Easy Run — 5km at conversational pace, 30 min
- Tuesday: HIIT — 5 rounds of 200m sprint + 20 wall balls, 50 min
- Wednesday: Strength — Lower body focus: squats 4x8, lunges 3x12, 50 min
- Thursday: Rest Day
- Friday: Run — Interval 8x400m, 40 min
- Saturday: Station Practice — SkiErg + Sled focus, 55 min
- Sunday: Recovery — Foam rolling and stretching, 25 min

**Week 3: Intensity**
- Monday: Easy Run — 6km, 35 min
- Tuesday: HIIT — EMOM 20 min: 10 cal SkiErg + 10 burpees
- Wednesday: Strength — Full body compound movements, 55 min
- Thursday: Rest Day
- Friday: Run — 8km progressive run, 45 min
- Saturday: Simulation — Race pace through all 8 stations, 70 min
- Sunday: Recovery — Active recovery swim or walk, 30 min

**Week 4: Taper**
- Monday: Easy Run — 4km, 25 min
- Tuesday: HIIT — Light 3 rounds of 200m + 10 wall balls, 30 min
- Wednesday: Strength — Deload: 50% volume, 35 min
- Thursday: Rest Day
- Friday: Run — Easy 3km shakeout, 20 min
- Saturday: Rest Day
- Sunday: Rest Day

Click the **Review & Accept** button below this message to save the plan to your training calendar.
`;

    const response = await authedPage.request.post('/api/training-plans/extract', {
      data: { messageContent: planText },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('plan');
    expect(data.plan).toHaveProperty('plan_name');
    expect(data.plan).toHaveProperty('weeks');
    expect(data.plan.weeks.length).toBe(4);

    // Each week should have days
    for (const week of data.plan.weeks) {
      expect(week).toHaveProperty('week_number');
      expect(week).toHaveProperty('days');
      expect(week.days.length).toBeGreaterThanOrEqual(5);

      // Validate day structure
      for (const day of week.days) {
        expect(day).toHaveProperty('day_of_week');
        expect(day.day_of_week).toBeGreaterThanOrEqual(0);
        expect(day.day_of_week).toBeLessThanOrEqual(6);

        if (!day.is_rest_day) {
          expect(day).toHaveProperty('session_type');
          expect([
            'run', 'hiit', 'strength', 'simulation', 'recovery',
            'rest', 'station_practice', 'general',
          ]).toContain(day.session_type);
        }
      }
    }
  });

  test('POST /api/training-plans creates a plan with days (0-indexed day_of_week)', async ({
    authedPage,
    credentials,
  }) => {
    test.setTimeout(60_000);

    // Create a minimal training plan via API
    const planPayload = {
      plan_name: 'E2E Test Plan',
      goal: 'Test plan creation with correct constraints',
      duration_weeks: 2,
      start_date: '2026-03-01',
      is_ai_generated: false,
      weeks: [
        {
          week_number: 1,
          focus: 'Test Week 1',
          days: [
            { day_of_week: 0, session_type: 'run', workout_title: 'Monday Run', workout_description: 'Easy 5k', estimated_duration_minutes: 30, is_rest_day: false },
            { day_of_week: 1, session_type: 'hiit', workout_title: 'Tuesday HIIT', workout_description: 'Intervals', estimated_duration_minutes: 45, is_rest_day: false },
            { day_of_week: 2, session_type: 'strength', workout_title: 'Wednesday Strength', workout_description: 'Upper body', estimated_duration_minutes: 50, is_rest_day: false },
            { day_of_week: 3, session_type: 'rest', workout_title: 'Rest Day', workout_description: '', estimated_duration_minutes: 0, is_rest_day: true },
            { day_of_week: 4, session_type: 'run', workout_title: 'Friday Tempo', workout_description: 'Tempo run', estimated_duration_minutes: 35, is_rest_day: false },
            { day_of_week: 5, session_type: 'simulation', workout_title: 'Saturday Sim', workout_description: 'Full sim', estimated_duration_minutes: 60, is_rest_day: false },
            { day_of_week: 6, session_type: 'recovery', workout_title: 'Sunday Recovery', workout_description: 'Yoga', estimated_duration_minutes: 30, is_rest_day: false },
          ],
        },
        {
          week_number: 2,
          focus: 'Test Week 2',
          days: [
            { day_of_week: 0, session_type: 'run', workout_title: 'Monday Run', workout_description: 'Easy 5k', estimated_duration_minutes: 30, is_rest_day: false },
            { day_of_week: 1, session_type: 'station_practice', workout_title: 'Station Work', workout_description: 'SkiErg + Sled', estimated_duration_minutes: 50, is_rest_day: false },
            { day_of_week: 2, session_type: 'general', workout_title: 'General Fitness', workout_description: 'Cross training', estimated_duration_minutes: 40, is_rest_day: false },
            { day_of_week: 3, session_type: 'rest', workout_title: 'Rest', workout_description: '', estimated_duration_minutes: 0, is_rest_day: true },
            { day_of_week: 4, session_type: 'hiit', workout_title: 'Friday HIIT', workout_description: 'EMOM', estimated_duration_minutes: 40, is_rest_day: false },
            { day_of_week: 5, session_type: 'rest', workout_title: 'Rest', workout_description: '', estimated_duration_minutes: 0, is_rest_day: true },
            { day_of_week: 6, session_type: 'rest', workout_title: 'Rest', workout_description: '', estimated_duration_minutes: 0, is_rest_day: true },
          ],
        },
      ],
    };

    const response = await authedPage.request.post('/api/training-plans', {
      data: planPayload,
    });

    // Should succeed (201)
    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('plan');
    expect(data.plan).toHaveProperty('id');
    expect(data.plan.plan_name).toBe('E2E Test Plan');

    // Verify the plan was saved with days by fetching it
    const getResponse = await authedPage.request.get(`/api/training-plans/${data.plan.id}`);
    expect(getResponse.status()).toBe(200);

    const planData = await getResponse.json();
    const plan = planData.plan || planData;
    expect(plan.training_plan_weeks?.length || plan.weeks?.length).toBe(2);

    // Verify days exist in the plan
    const weeks = plan.training_plan_weeks || plan.weeks || [];
    for (const week of weeks) {
      const days = week.training_plan_days || week.days || [];
      expect(days.length).toBe(7);

      for (const day of days) {
        // day_of_week should be 0-6 (the constraint we fixed)
        expect(day.day_of_week).toBeGreaterThanOrEqual(0);
        expect(day.day_of_week).toBeLessThanOrEqual(6);
      }
    }
  });

  test('POST /api/training-plans returns 500 on invalid data (error propagation)', async ({
    authedPage,
  }) => {
    // Send a plan with invalid session_type to verify error handling works
    const badPayload = {
      plan_name: 'Bad Plan',
      duration_weeks: 1,
      start_date: '2026-03-01',
      weeks: [
        {
          week_number: 1,
          days: [
            { day_of_week: 0, session_type: 'INVALID_TYPE', workout_title: 'Bad', is_rest_day: false },
          ],
        },
      ],
    };

    const response = await authedPage.request.post('/api/training-plans', {
      data: badPayload,
    });

    // Should fail with 500 (not silently succeed with 201)
    expect(response.status()).toBe(500);
  });
});

test.describe('Calendar Page', () => {
  test('calendar page loads', async ({ authedPage }) => {
    await authedPage.goto('/calendar');
    await authedPage.waitForURL('**/calendar', { timeout: 10_000 });
    // Calendar should render with navigation
    await expect(authedPage.locator('text=/calendar|week|month/i').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
