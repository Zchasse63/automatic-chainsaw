/**
 * Onboarding Flow — E2E Tests
 *
 * Tests login page accessibility, signup page visibility,
 * and the onboarding redirect guard.
 *
 * Note: Full auth/navigation tests are in auth-navigation.spec.ts.
 * This file focuses specifically on the login/signup pages and onboarding UX.
 */

import { test, expect } from '../fixtures/auth';

test.describe('Login Page', () => {
  test('login page renders with email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // Email input
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 });

    // Password input
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login page has link to signup', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=/sign up|create.*account|register/i')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('login page has Google OAuth button', async ({ page }) => {
    await page.goto('/login');
    // Google OAuth button should be visible
    await expect(
      page.locator('button:has-text("Google"), text=/Continue with Google|Sign in with Google/i'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('root URL redirects to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});

test.describe('Signup Page', () => {
  test('signup page renders with form fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL(/\/signup/);

    // Email input
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 });

    // Password inputs (password + confirm)
    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Submit button
    await expect(
      page.locator('button[type="submit"], button:has-text("Create Account")'),
    ).toBeVisible();
  });

  test('signup page has link to login', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('text=/sign in|already.*account|log in/i')).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe('Login — Real Auth', () => {
  test('successful login with E2E credentials', async ({ page, credentials }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', credentials.email);
    await page.fill('input[type="password"]', credentials.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
