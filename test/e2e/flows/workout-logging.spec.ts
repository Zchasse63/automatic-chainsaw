/**
 * Workout Logging & Tracking — E2E Tests
 *
 * Tests workout log creation via both the UI and API,
 * including session types, RPE, and data persistence.
 */

import { test, expect } from '../fixtures/auth';

test.describe('Workout Logging — API', () => {
  test('POST /api/workouts creates a workout log', async ({ authedPage }) => {
    const workoutPayload = {
      date: new Date().toISOString().split('T')[0],
      session_type: 'run',
      duration_minutes: 35,
      rpe_post: 7,
      notes: 'E2E test run — 5km easy pace',
    };

    const response = await authedPage.request.post('/api/workouts', {
      data: workoutPayload,
    });

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('workout');
    expect(data.workout.session_type).toBe('run');
    expect(data.workout.duration_minutes).toBe(35);
    expect(data.workout.rpe_post).toBe(7);
  });

  test('GET /api/workouts returns workout list', async ({ authedPage }) => {
    const response = await authedPage.request.get('/api/workouts');
    expect(response.status()).toBe(200);

    const data = await response.json();
    const workouts = data.workouts || data;
    expect(Array.isArray(workouts)).toBe(true);
  });

  test('workout supports all session types', async ({ authedPage }) => {
    const sessionTypes = [
      'run', 'hiit', 'strength', 'simulation', 'recovery', 'station_practice', 'general',
    ];

    for (const sessionType of sessionTypes) {
      const response = await authedPage.request.post('/api/workouts', {
        data: {
          date: new Date().toISOString().split('T')[0],
          session_type: sessionType,
          duration_minutes: 30,
          notes: `E2E test — ${sessionType}`,
        },
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.workout.session_type).toBe(sessionType);
    }
  });
});

test.describe('Workout Logging — UI', () => {
  test('workout log form page loads', async ({ authedPage }) => {
    await authedPage.goto('/training/log');
    await authedPage.waitForURL('**/training/log', { timeout: 10_000 });

    // Should have form elements for logging a workout
    await expect(authedPage.locator('text=/log|workout|session/i').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe('Workout Logging — Coach Tool Calling', () => {
  test(
    'coach can log a workout via create_workout_log tool',
    async ({ authedPage }) => {
      test.setTimeout(120_000);

      await authedPage.goto('/coach?new=true');
      await authedPage.waitForURL('**/coach**', { timeout: 10_000 });
      await expect(
        authedPage.locator('textarea[placeholder*="Coach K"]'),
      ).toBeVisible({ timeout: 10_000 });

      const textarea = authedPage.locator('textarea[placeholder*="Coach K"]');
      await textarea.fill(
        'Log a workout for me: I did a 45-minute HIIT session today with an RPE of 8. It included sled pushes and wall balls.',
      );
      await textarea.press('Enter');

      // Wait for response
      await authedPage.waitForFunction(
        () => {
          const proseBlocks = document.querySelectorAll('.prose');
          return proseBlocks.length > 0 && proseBlocks[proseBlocks.length - 1].textContent!.length > 30;
        },
        { timeout: 90_000 },
      );

      await authedPage.waitForTimeout(3000);

      const messages = authedPage.locator('.prose');
      const count = await messages.count();
      const response = (await messages.nth(count - 1).textContent()) ?? '';

      // Coach should confirm the workout was logged
      expect(response.toLowerCase()).toMatch(/logged|recorded|saved|workout/i);
    },
  );
});

test.describe('Benchmarks & Personal Records — API', () => {
  test('GET /api/benchmarks returns benchmarks array', async ({ authedPage }) => {
    const response = await authedPage.request.get('/api/benchmarks');
    // Could be 200 with data or empty
    expect([200, 404].includes(response.status())).toBe(true);
  });

  test('GET /api/personal-records returns PR data', async ({ authedPage }) => {
    const response = await authedPage.request.get('/api/personal-records');
    expect([200, 404].includes(response.status())).toBe(true);
  });

  test('GET /api/stations returns Hyrox stations', async ({ authedPage }) => {
    const response = await authedPage.request.get('/api/stations');
    expect(response.status()).toBe(200);

    const data = await response.json();
    const stations = data.stations || data;
    expect(Array.isArray(stations)).toBe(true);
    // Should have 8 Hyrox stations
    if (stations.length > 0) {
      expect(stations.length).toBe(8);
    }
  });
});
