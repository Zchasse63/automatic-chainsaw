/**
 * Auth & Navigation — E2E Tests
 *
 * Tests authentication flows, route guards, and navigation
 * against REAL Supabase auth + running dev server.
 */

import { test, expect } from '../fixtures/auth';

/**
 * Helper: Click a nav link via the desktop sidebar.
 * The app has duplicate nav links in both the desktop `aside` sidebar
 * and the mobile bottom `nav`. We scope to `aside` to avoid strict mode
 * violations / clicking hidden mobile elements.
 */
async function clickSidebarLink(page: import('@playwright/test').Page, href: string) {
  await page.locator(`aside a[href="${href}"]`).click();
}

test.describe('Authentication', () => {
  test('login with valid credentials reaches dashboard', async ({ page, credentials }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    await page.fill('input[type="email"]', credentials.email);
    await page.fill('input[type="password"]', credentials.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'fake@doesnotexist.test');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should remain on login page and show error
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('unauthenticated user redirected from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('unauthenticated user redirected from coach to login', async ({ page }) => {
    await page.goto('/coach');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('unauthenticated user redirected from training to login', async ({ page }) => {
    await page.goto('/training');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('unauthenticated user redirected from performance to login', async ({ page }) => {
    await page.goto('/performance');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('unauthenticated user redirected from profile to login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});

test.describe('Navigation — Desktop', () => {
  test('dashboard loads after login', async ({ authedPage }) => {
    await expect(authedPage).toHaveURL(/\/dashboard/);

    // Dashboard should show greeting or dashboard content
    await expect(
      authedPage.locator('text=/E2E.*Test.*Athlete|Hey|Dashboard/i').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('navigate to Coach via sidebar', async ({ authedPage }) => {
    await clickSidebarLink(authedPage, '/coach');
    await authedPage.waitForURL('**/coach', { timeout: 10_000 });
    await expect(authedPage).toHaveURL(/\/coach/);
    await expect(authedPage.locator('text=Coach K').first()).toBeVisible();
  });

  test('navigate to Calendar via sidebar', async ({ authedPage }) => {
    await clickSidebarLink(authedPage, '/calendar');
    await authedPage.waitForURL('**/calendar', { timeout: 10_000 });
    await expect(authedPage).toHaveURL(/\/calendar/);
  });

  test('navigate to Performance via sidebar', async ({ authedPage }) => {
    await clickSidebarLink(authedPage, '/performance');
    await authedPage.waitForURL('**/performance', { timeout: 10_000 });
    await expect(authedPage).toHaveURL(/\/performance/);
    await expect(authedPage.locator('text=Performance').first()).toBeVisible();
  });

  test('navigate to Profile via sidebar', async ({ authedPage }) => {
    await clickSidebarLink(authedPage, '/profile');
    await authedPage.waitForURL('**/profile', { timeout: 10_000 });
    await expect(authedPage).toHaveURL(/\/profile/);
    await expect(authedPage.locator('text=/E2E.*Test.*Athlete/i').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('full navigation cycle visits all main sections', async ({ authedPage }) => {
    const routes = ['/coach', '/calendar', '/performance', '/profile', '/dashboard'];

    for (const route of routes) {
      await clickSidebarLink(authedPage, route);
      await authedPage.waitForURL(`**${route}`, { timeout: 10_000 });
      await expect(authedPage).toHaveURL(new RegExp(route.replace('/', '\\/')));
    }
  });
});

test.describe('Sign Out', () => {
  test('sign out redirects to login', async ({ authedPage }) => {
    // Navigate to profile where sign out button is
    await clickSidebarLink(authedPage, '/profile');
    await authedPage.waitForURL('**/profile', { timeout: 10_000 });

    // Wait for profile to load, then click sign out
    await expect(authedPage.locator('text=Sign Out')).toBeVisible({ timeout: 10_000 });
    await authedPage.click('text=Sign Out');

    // Should redirect to login
    await authedPage.waitForURL('**/login', { timeout: 10_000 });
    await expect(authedPage).toHaveURL(/\/login/);
  });
});
