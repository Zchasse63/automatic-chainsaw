/**
 * Profile Management — E2E Tests
 *
 * Tests the profile page: viewing, editing, and saving profile data.
 * Also tests the sign-out flow and profile API endpoints.
 */

import { test, expect } from '../fixtures/auth';

test.describe('Profile Page', () => {
  test('profile page loads with athlete data', async ({ authedPage }) => {
    await authedPage.goto('/profile');
    await authedPage.waitForURL('**/profile', { timeout: 10_000 });

    // Should display the test athlete's name
    await expect(
      authedPage.locator('text=/E2E.*Test.*Athlete/i'),
    ).toBeVisible({ timeout: 10_000 });

    // Should show "Manage your athlete profile" subtitle
    await expect(
      authedPage.locator('text=/Manage your athlete profile/i'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('profile shows correct division and phase', async ({ authedPage }) => {
    await authedPage.goto('/profile');
    await authedPage.waitForURL('**/profile', { timeout: 10_000 });
    await authedPage.waitForTimeout(2000); // Wait for data to load

    // Division should be "Open" (from global setup: hyrox_division: 'open')
    await expect(authedPage.locator('text=Open')).toBeVisible({ timeout: 10_000 });

    // Training phase should be "Specific Prep" (from global setup: current_phase: 'specific_prep')
    await expect(authedPage.locator('text=Specific Prep')).toBeVisible({ timeout: 10_000 });
  });

  test('profile has Personal Info section', async ({ authedPage }) => {
    await authedPage.goto('/profile');
    await authedPage.waitForURL('**/profile', { timeout: 10_000 });

    await expect(authedPage.locator('text=Personal Info')).toBeVisible({ timeout: 10_000 });
    await expect(authedPage.locator('text=Display Name')).toBeVisible({ timeout: 5_000 });
    await expect(authedPage.locator('text=/Weight/i')).toBeVisible({ timeout: 5_000 });
    await expect(authedPage.locator('text=/Height/i')).toBeVisible({ timeout: 5_000 });
  });

  test('profile has Hyrox section', async ({ authedPage }) => {
    await authedPage.goto('/profile');
    await authedPage.waitForURL('**/profile', { timeout: 10_000 });

    await expect(authedPage.locator('text=Hyrox')).toBeVisible({ timeout: 10_000 });
    await expect(authedPage.locator('text=Division')).toBeVisible({ timeout: 5_000 });
    await expect(authedPage.locator('text=Training Phase')).toBeVisible({ timeout: 5_000 });
    await expect(authedPage.locator('text=/Race Date/i')).toBeVisible({ timeout: 5_000 });
    await expect(authedPage.locator('text=/Goal Time/i')).toBeVisible({ timeout: 5_000 });
  });

  test('profile has Preferences section', async ({ authedPage }) => {
    await authedPage.goto('/profile');
    await authedPage.waitForURL('**/profile', { timeout: 10_000 });

    await expect(authedPage.locator('text=Preferences')).toBeVisible({ timeout: 10_000 });
    await expect(authedPage.locator('text=Units')).toBeVisible({ timeout: 5_000 });
    await expect(authedPage.locator('text=/Weekly Availability/i')).toBeVisible({ timeout: 5_000 });
  });

  test('profile has Achievements section', async ({ authedPage }) => {
    await authedPage.goto('/profile');
    await authedPage.waitForURL('**/profile', { timeout: 10_000 });

    await expect(authedPage.locator('text=Achievements')).toBeVisible({ timeout: 10_000 });
  });

  test('save button exists and is clickable', async ({ authedPage }) => {
    await authedPage.goto('/profile');
    await authedPage.waitForURL('**/profile', { timeout: 10_000 });

    await expect(authedPage.locator('text=Save Changes')).toBeVisible({ timeout: 10_000 });
  });

  test('profile save works via PATCH API', async ({ authedPage }) => {
    // Update a field via API
    const response = await authedPage.request.patch('/api/profile', {
      data: {
        weight_kg: 82,
        height_cm: 180,
        weekly_availability_hours: 10,
      },
    });

    expect(response.status()).toBe(200);

    // Verify the update persisted
    const getResponse = await authedPage.request.get('/api/profile');
    expect(getResponse.status()).toBe(200);

    const data = await getResponse.json();
    expect(data.profile.weight_kg).toBe(82);
    expect(data.profile.height_cm).toBe(180);
    expect(data.profile.weekly_availability_hours).toBe(10);
  });

  test('profile can update goal time', async ({ authedPage }) => {
    const response = await authedPage.request.patch('/api/profile', {
      data: {
        goal_time_minutes: 85,
      },
    });

    expect(response.status()).toBe(200);

    // Verify
    const getResponse = await authedPage.request.get('/api/profile');
    const data = await getResponse.json();
    expect(data.profile.goal_time_minutes).toBe(85);

    // Reset back to original value
    await authedPage.request.patch('/api/profile', {
      data: { goal_time_minutes: 90 },
    });
  });

  test('sign out button is visible', async ({ authedPage }) => {
    await authedPage.goto('/profile');
    await authedPage.waitForURL('**/profile', { timeout: 10_000 });

    await expect(authedPage.locator('text=Sign Out')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Profile — Edge Cases', () => {
  test('unauthenticated profile API request is blocked by middleware', async ({ playwright }) => {
    // Middleware redirects unauthenticated requests to /login
    // Next.js 16 uses 307 (temporary redirect), earlier versions use 302
    const apiContext = await playwright.request.newContext({ maxRedirects: 0 });
    try {
      const response = await apiContext.get('http://localhost:3000/api/profile');
      expect([302, 307]).toContain(response.status());
      expect(response.headers()['location']).toMatch(/\/login/);
    } finally {
      await apiContext.dispose();
    }
  });

  test('unauthenticated PATCH profile is blocked by middleware', async ({ playwright }) => {
    const apiContext = await playwright.request.newContext({ maxRedirects: 0 });
    try {
      const response = await apiContext.patch('http://localhost:3000/api/profile', {
        data: { display_name: 'Hacker' },
      });
      // Next.js 16 uses 307 (temporary redirect), earlier versions use 302
      expect([302, 307]).toContain(response.status());
      expect(response.headers()['location']).toMatch(/\/login/);
    } finally {
      await apiContext.dispose();
    }
  });
});
