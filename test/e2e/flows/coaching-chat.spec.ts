/**
 * Coaching Chat Flow — E2E Test
 *
 * Tests the full chat interaction against REAL AI coach.
 * Real Supabase, real Nebius model, real streaming response.
 *
 * Note: This test has a longer timeout due to cold start latency.
 */

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const credPath = path.resolve(__dirname, '../.e2e-credentials.json');

test.describe('Coaching Chat', () => {
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

  // Helper: login and navigate to coach page
  async function loginAndGoToCoach(page: import('@playwright/test').Page) {
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', credentials.email);
    await page.fill(
      'input[name="password"], input[type="password"]',
      credentials.password,
    );
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await page.goto('/coach');
    await page.waitForURL('**/coach', { timeout: 10_000 });
  }

  test('coach page loads and shows input', async ({ page }) => {
    await loginAndGoToCoach(page);

    // Chat input should be visible
    await expect(
      page.locator('textarea, input[placeholder*="message" i], [data-testid="chat-input"]'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test(
    'can send a message and receive a streamed response',
    async ({ page }) => {
      test.setTimeout(90_000); // Allow for cold start

      await loginAndGoToCoach(page);

      // Type and send a message
      const input = page.locator(
        'textarea, input[placeholder*="message" i], [data-testid="chat-input"]',
      );
      await input.fill('What is Hyrox?');

      // Press Enter or click send button
      await input.press('Enter');

      // Wait for assistant response to appear (real model, may have cold start)
      await expect(
        page.locator('[data-role="assistant"], .assistant-message, [class*="assistant"]'),
      ).toBeVisible({ timeout: 60_000 });

      // Response should contain Hyrox-related content
      const responseText = await page
        .locator('[data-role="assistant"], .assistant-message, [class*="assistant"]')
        .first()
        .textContent();

      expect(responseText?.toLowerCase()).toContain('hyrox');
    },
  );
});
