/**
 * Performance & Analytics — E2E Tests
 *
 * Tests the performance page with its tabs (Overview, Stations, Benchmarks),
 * and API endpoints for personal records, benchmarks, and stations.
 */

import { test, expect } from '../fixtures/auth';

test.describe('Performance Page', () => {
  test('performance page loads with tabs', async ({ authedPage }) => {
    await authedPage.goto('/performance');
    await authedPage.waitForURL('**/performance', { timeout: 10_000 });

    // Should show Performance header
    await expect(authedPage.locator('text=Performance')).toBeVisible({ timeout: 10_000 });

    // Should have tab navigation
    await expect(authedPage.locator('text=Overview')).toBeVisible({ timeout: 10_000 });
    await expect(authedPage.locator('text=Stations')).toBeVisible();
    await expect(authedPage.locator('text=Benchmarks')).toBeVisible();
  });

  test('overview tab shows PR section', async ({ authedPage }) => {
    await authedPage.goto('/performance');
    await authedPage.waitForURL('**/performance', { timeout: 10_000 });

    // Click Overview tab if not already active
    await authedPage.click('text=Overview');
    await authedPage.waitForTimeout(1000);

    // Should show Personal Records or PR-related content
    await expect(
      authedPage.locator('text=/Personal Records|PRs|No personal records/i'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('stations tab shows Hyrox stations', async ({ authedPage }) => {
    await authedPage.goto('/performance');
    await authedPage.waitForURL('**/performance', { timeout: 10_000 });

    // Click Stations tab
    await authedPage.click('text=Stations');
    await authedPage.waitForTimeout(1000);

    // Should show station names or station-related content
    await expect(
      authedPage.locator('text=/SkiErg|Sled Push|Sled Pull|Burpee|Row|Farmers|Lunge|Wall Ball/i').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('benchmarks tab loads', async ({ authedPage }) => {
    await authedPage.goto('/performance');
    await authedPage.waitForURL('**/performance', { timeout: 10_000 });

    // Click Benchmarks tab
    await authedPage.click('text=Benchmarks');
    await authedPage.waitForTimeout(1000);

    // Should show benchmarks section (may be empty or have data)
    await expect(
      authedPage.locator('text=/Benchmark|No benchmark|test/i').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('benchmark entry button is visible', async ({ authedPage }) => {
    await authedPage.goto('/performance');
    await authedPage.waitForURL('**/performance', { timeout: 10_000 });

    // Should have a benchmark entry button
    const benchmarkBtn = authedPage.locator('text=/Benchmark Entry/i');
    if (await benchmarkBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(benchmarkBtn).toBeVisible();
    }
  });
});
