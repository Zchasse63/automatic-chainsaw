/**
 * Playwright Global Setup
 *
 * Creates test users for E2E tests before the test suite runs.
 * Stores credentials in a temp file for test files to use.
 */

import { config } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const E2E_CREDENTIALS_FILE = path.resolve(__dirname, '.e2e-credentials.json');

async function globalSetup() {
  // Load env
  config({ path: path.resolve(process.cwd(), '.env.test.local') });
  config({ path: path.resolve(process.cwd(), '.env.test') });
  config({ path: path.resolve(process.cwd(), '.env.local') });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    console.warn(
      '[e2e setup] SUPABASE_SERVICE_ROLE_KEY not found. ' +
        'E2E tests will use existing test credentials if available.',
    );
    return;
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = `e2e-${Date.now()}@test.hyrox`;
  const password = 'E2ETestHyrox2026!';

  // Create E2E test user
  const { data: user, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    throw new Error(`Failed to create E2E test user: ${error.message}`);
  }

  // Create athlete profile via admin (bypass RLS)
  const { data: profile } = await admin
    .from('athlete_profiles')
    .insert({
      user_id: user.user.id,
      display_name: '[E2E] Test Athlete',
      hyrox_division: 'open',
      current_phase: 'specific_prep',
      units_preference: 'metric',
      race_date: '2026-06-06',
      goal_time_minutes: 90,
      profile_complete: true,
    })
    .select('id')
    .single();

  // Save credentials for test files
  const credentials = {
    userId: user.user.id,
    athleteId: profile?.id,
    email,
    password,
  };

  fs.writeFileSync(E2E_CREDENTIALS_FILE, JSON.stringify(credentials, null, 2));
  console.log(`[e2e setup] Created test user: ${email}`);
}

export default globalSetup;
