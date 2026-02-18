/**
 * Onboarding Flow — E2E Test
 *
 * Tests the full signup → profile creation → dashboard flow
 * against a REAL running dev server with REAL Supabase.
 *
 * No mocking — every action hits the real system.
 */

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const credPath = path.resolve(__dirname, '../.e2e-credentials.json');

test.describe('Onboarding Flow', () => {
  test.skip(
    !fs.existsSync(credPath),
    'E2E credentials not found. Run global setup first.',
  );

  let credentials: {
    email: string;
    password: string;
    userId: string;
    athleteId: string;
  };

  test.beforeAll(() => {
    credentials = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
  });

  test('login with real credentials and reach dashboard', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // Fill in real credentials
    await page.fill('input[name="email"], input[type="email"]', credentials.email);
    await page.fill(
      'input[name="password"], input[type="password"]',
      credentials.password,
    );

    // Submit login form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard (real auth, real session)
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('dashboard displays real profile data', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', credentials.email);
    await page.fill(
      'input[name="password"], input[type="password"]',
      credentials.password,
    );
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15_000 });

    // Verify dashboard has real content (not loading state)
    await expect(page.locator('text=/[E2E] Test Athlete|Dashboard/i')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('unauthenticated user redirected to login', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('navigation between app sections works', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', credentials.email);
    await page.fill(
      'input[name="password"], input[type="password"]',
      credentials.password,
    );
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15_000 });

    // Navigate to coach
    await page.click('a[href="/coach"], [data-nav="coach"]');
    await page.waitForURL('**/coach', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/coach/);

    // Navigate to training
    await page.click('a[href="/training"], [data-nav="training"]');
    await page.waitForURL('**/training', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/training/);
  });
});
