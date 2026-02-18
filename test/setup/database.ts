/**
 * REAL Database Configuration
 *
 * Connects to your actual Supabase instance.
 * Uses test data markers for isolation and cleanup.
 * Tests run against production schema with real RLS.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.test to .env.test.local and fill in the values.',
  );
}

if (!supabaseServiceKey) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY. Required for test user creation/cleanup. ' +
      'Get it from: https://supabase.com/dashboard/project/txwkfaygckwxddxjlsun/settings/api',
  );
}

// Admin client — bypasses RLS for test setup/teardown
export const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Anon client — for testing public access and signing in
export const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create an authenticated client using a real user's access token
export function createAuthenticatedClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ---------------------------------------------------------------------------
// Test data tracking — tracks everything created during tests for cleanup
// ---------------------------------------------------------------------------

interface TestDataRegistry {
  userIds: Set<string>;
  records: Map<string, Set<string>>; // table name -> set of IDs
}

const registry: TestDataRegistry = {
  userIds: new Set(),
  records: new Map(),
};

export function trackTestUser(userId: string) {
  registry.userIds.add(userId);
}

export function trackTestRecord(table: string, id: string) {
  if (!registry.records.has(table)) {
    registry.records.set(table, new Set());
  }
  registry.records.get(table)!.add(id);
}

/**
 * Clean up ALL tracked test data from the REAL database.
 * Order matters: delete child records before parents.
 */
export async function cleanupAllTestData() {
  // Delete tracked non-user records first (order: children before parents)
  const orderedTables = [
    'race_splits',
    'training_plan_days',
    'training_plan_weeks',
    'messages',
    'athlete_achievements',
    'personal_records',
    'benchmark_tests',
    'race_results',
    'workout_logs',
    'goals',
    'conversations',
    'training_plans',
    'athlete_profiles',
  ];

  for (const table of orderedTables) {
    const ids = registry.records.get(table);
    if (ids && ids.size > 0) {
      await adminClient.from(table).delete().in('id', Array.from(ids));
    }
  }

  // Delete test users via auth admin (cascades user-owned data)
  for (const userId of registry.userIds) {
    try {
      await adminClient.auth.admin.deleteUser(userId);
    } catch {
      // User may already be deleted by cascade
    }
  }

  // Clear registry
  registry.userIds.clear();
  registry.records.clear();
}

/**
 * Fallback cleanup: delete test users by email pattern.
 * Catches anything missed by the registry (e.g., after a test crash).
 */
export async function cleanupTestUsersByPattern() {
  const { data } = await adminClient.auth.admin.listUsers();
  const testUsers =
    data?.users.filter(
      (u) => u.email?.includes('@test.hyrox') || u.email?.startsWith('test-'),
    ) ?? [];

  for (const user of testUsers) {
    try {
      await adminClient.auth.admin.deleteUser(user.id);
    } catch {
      // Ignore errors during cleanup
    }
  }

  console.log(`[cleanup] Removed ${testUsers.length} stale test users`);
}

// Generate a unique test email that's easy to identify
export function generateTestEmail(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `test-${ts}-${rand}@test.hyrox`;
}
