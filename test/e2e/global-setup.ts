/**
 * Playwright Global Setup
 *
 * Creates test user, athlete profile, and seed data for E2E tests
 * before the test suite runs. Stores credentials in a temp file.
 *
 * Seed data includes:
 * - Athlete profile (complete)
 * - Sample workout logs (for dashboard stats)
 * - A conversation (for conversation list tests)
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

  const userId = user.user.id;

  // Create athlete profile via admin (bypass RLS)
  const { data: profile } = await admin
    .from('athlete_profiles')
    .insert({
      user_id: userId,
      display_name: '[E2E] Test Athlete',
      hyrox_division: 'open',
      current_phase: 'specific_prep',
      units_preference: 'metric',
      race_date: '2026-06-06',
      goal_time_minutes: 90,
      profile_complete: true,
      weight_kg: 80,
      height_cm: 178,
      weekly_availability_hours: 10,
    })
    .select('id')
    .single();

  const athleteId = profile?.id;

  if (!athleteId) {
    throw new Error('Failed to create athlete profile');
  }

  // Seed workout logs for dashboard stats
  const today = new Date();
  const workoutLogs = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const sessionTypes = ['run', 'hiit', 'strength', 'simulation', 'recovery'] as const;
    workoutLogs.push({
      athlete_id: athleteId,
      date: dateStr,
      session_type: sessionTypes[i % sessionTypes.length],
      duration_minutes: 30 + (i * 10),
      rpe_post: 5 + (i % 4),
      notes: `E2E seed workout ${i + 1}`,
      completion_status: 'completed',
    });
  }

  const { error: workoutError } = await admin
    .from('workout_logs')
    .insert(workoutLogs);

  if (workoutError) {
    console.warn(`[e2e setup] Failed to seed workouts: ${workoutError.message}`);
  } else {
    console.log(`[e2e setup] Seeded ${workoutLogs.length} workout logs`);
  }

  // Seed a conversation so conversation list isn't empty
  const { data: conv, error: convError } = await admin
    .from('conversations')
    .insert({
      athlete_id: athleteId,
      title: 'E2E Seed Conversation',
    })
    .select('id')
    .single();

  if (convError) {
    console.warn(`[e2e setup] Failed to seed conversation: ${convError.message}`);
  } else if (conv) {
    // Add a sample message
    await admin.from('messages').insert({
      conversation_id: conv.id,
      role: 'user',
      content: 'Hello Coach K, this is a seeded test message.',
    });
    await admin.from('messages').insert({
      conversation_id: conv.id,
      role: 'assistant',
      content: 'Hey there, athlete! Welcome to your E2E test session. Ready to get after it?',
    });
    console.log(`[e2e setup] Seeded conversation with messages`);
  }

  // Save credentials for test files
  const credentials = {
    userId,
    athleteId,
    email,
    password,
  };

  fs.writeFileSync(E2E_CREDENTIALS_FILE, JSON.stringify(credentials, null, 2));
  console.log(`[e2e setup] Created test user: ${email}`);
}

export default globalSetup;
