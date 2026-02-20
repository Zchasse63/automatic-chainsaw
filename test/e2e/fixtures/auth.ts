/**
 * Shared Auth Fixture for all E2E tests
 *
 * Provides authenticated page context + credential helpers.
 * All tests use the same E2E test user created by global-setup.
 */

import { test as base, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const CRED_PATH = path.resolve(__dirname, '../.e2e-credentials.json');

export interface E2ECredentials {
  email: string;
  password: string;
  userId: string;
  athleteId: string;
}

function loadCredentials(): E2ECredentials {
  if (!fs.existsSync(CRED_PATH)) {
    throw new Error('E2E credentials not found. Run global setup first.');
  }
  return JSON.parse(fs.readFileSync(CRED_PATH, 'utf-8'));
}

/** Login helper — fills form, submits, waits for dashboard */
async function login(page: Page, creds: E2ECredentials) {
  await page.goto('/login');
  await page.fill('input[name="email"], input[type="email"]', creds.email);
  await page.fill('input[name="password"], input[type="password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

/**
 * Extended test fixture that provides:
 * - `credentials`: E2E test user info
 * - `authedPage`: A page already logged in at /dashboard
 */
export const test = base.extend<{
  credentials: E2ECredentials;
  authedPage: Page;
}>({
  credentials: async ({}, use) => {
    await use(loadCredentials());
  },
  authedPage: async ({ page, credentials }, use) => {
    await login(page, credentials);
    await use(page);
  },
});

export { expect };
