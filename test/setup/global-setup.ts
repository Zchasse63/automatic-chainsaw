/**
 * Vitest Global Setup
 *
 * Runs once before all test files.
 * Loads env, cleans up stale test data, verifies DB connection.
 */

import { config } from 'dotenv';
import path from 'node:path';

export default async function globalSetup() {
  // Load env
  config({ path: path.resolve(process.cwd(), '.env.test.local') });
  config({ path: path.resolve(process.cwd(), '.env.test') });

  // Dynamic import after env is loaded
  const { adminClient, cleanupTestUsersByPattern } = await import('./database');

  // Verify database connection
  const { error } = await adminClient.from('hyrox_stations').select('id').limit(1);
  if (error) {
    throw new Error(`Cannot connect to Supabase: ${error.message}`);
  }
  console.log('[setup] Connected to real Supabase database');

  // Clean up any stale test data from previous runs
  await cleanupTestUsersByPattern();
  console.log('[setup] Stale test data cleaned');
}
