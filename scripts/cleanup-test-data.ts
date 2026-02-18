/**
 * Cleanup Test Data — Safety net script
 *
 * Removes stale test users and their data from the real Supabase instance.
 * Run periodically or after CI to catch anything missed by test teardown.
 *
 * Usage: bun run test:cleanup
 */

import { config } from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Load env
config({ path: path.resolve(process.cwd(), '.env.test.local') });
config({ path: path.resolve(process.cwd(), '.env.test') });
config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.',
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Cleaning up test data from real Supabase...\n');

  // Find test users by email pattern
  const { data } = await admin.auth.admin.listUsers();
  const testUsers =
    data?.users.filter(
      (u) =>
        u.email?.includes('@test.hyrox') ||
        u.email?.startsWith('test-') ||
        u.email?.startsWith('e2e-'),
    ) ?? [];

  if (testUsers.length === 0) {
    console.log('No stale test users found. Database is clean.');
    return;
  }

  console.log(`Found ${testUsers.length} test user(s) to clean up:`);
  for (const user of testUsers) {
    console.log(`  - ${user.email} (${user.id})`);
  }
  console.log();

  // Delete each test user (cascade deletes their data via FK constraints)
  let deleted = 0;
  let failed = 0;

  for (const user of testUsers) {
    try {
      // Delete athlete profile first (cascade to all user data)
      await admin
        .from('athlete_profiles')
        .delete()
        .eq('user_id', user.id);

      // Delete auth user
      await admin.auth.admin.deleteUser(user.id);
      deleted++;
    } catch (err) {
      console.error(`  Failed to delete ${user.email}:`, err);
      failed++;
    }
  }

  console.log(`Cleanup complete: ${deleted} deleted, ${failed} failed.`);
}

main().catch((err) => {
  console.error('Cleanup script failed:', err);
  process.exit(1);
});
