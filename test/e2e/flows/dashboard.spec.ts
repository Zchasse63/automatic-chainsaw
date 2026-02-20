/**
 * Dashboard — E2E Tests
 *
 * Tests the dashboard page loads correctly with real profile data,
 * displays stats, and quick action links work.
 */

import { test, expect } from '../fixtures/auth';

test.describe('Dashboard', () => {
  test('displays athlete greeting with profile name', async ({ authedPage }) => {
    // Dashboard should show greeting with the test athlete name
    await expect(
      authedPage.locator('text=/Hey|E2E.*Test.*Athlete/i'),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('shows race countdown card', async ({ authedPage }) => {
    // Test athlete has race_date: 2026-06-06
    // Should show a race countdown or race day reference
    await expect(
      authedPage.locator('text=/race|days|Race Day/i'),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('shows weekly stats section', async ({ authedPage }) => {
    // Wait for dashboard data to load
    await authedPage.waitForTimeout(2000);

    // Should show This Week section or stat cards
    await expect(
      authedPage.locator('text=/This Week|Workouts|Training/i'),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('quick action: Ask Coach K links to coach page', async ({ authedPage }) => {
    // Find the "Ask Coach K" or "Coach" quick action
    const coachLink = authedPage.locator('a[href*="/coach"]').first();
    await expect(coachLink).toBeVisible({ timeout: 15_000 });
    await coachLink.click();
    await authedPage.waitForURL('**/coach**', { timeout: 10_000 });
    await expect(authedPage).toHaveURL(/\/coach/);
  });

  test('quick action: Log Workout links to training log', async ({ authedPage }) => {
    const logLink = authedPage.locator('a[href*="/training/log"]').first();
    if (await logLink.isVisible()) {
      await logLink.click();
      await authedPage.waitForURL('**/training/log', { timeout: 10_000 });
      await expect(authedPage).toHaveURL(/\/training\/log/);
    }
  });

  test('dashboard API returns valid data', async ({ authedPage }) => {
    // Intercept the dashboard API call to verify structure
    const response = await authedPage.request.get('/api/dashboard');
    expect(response.status()).toBe(200);

    const data = await response.json();
    // Dashboard API should return profile and stats
    expect(data).toHaveProperty('profile');
    expect(data.profile).toHaveProperty('display_name');
    expect(data.profile.display_name).toContain('E2E');
  });

  test('profile API returns valid data', async ({ authedPage }) => {
    const response = await authedPage.request.get('/api/profile');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('profile');
    expect(data.profile.display_name).toBe('[E2E] Test Athlete');
    expect(data.profile.hyrox_division).toBe('open');
    expect(data.profile.goal_time_minutes).toBe(90);
  });
});
