/**
 * REAL Authentication Helpers
 *
 * Creates REAL users in Supabase Auth.
 * Test users are tracked and cleaned up after tests.
 * Uses @test.hyrox email domain for easy identification.
 */

import {
  adminClient,
  anonClient,
  createAuthenticatedClient,
  trackTestUser,
  trackTestRecord,
  generateTestEmail,
  type SupabaseClient,
} from '../setup/database';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
  supabase: SupabaseClient; // Authenticated client for this user
}

const TEST_PASSWORD = 'TestHyrox2026!';

/**
 * Create a real test user with a real session.
 * The user is tracked for automatic cleanup.
 */
export async function createTestUser(
  email = generateTestEmail(),
  password = TEST_PASSWORD,
): Promise<TestUser> {
  // Create user in REAL Supabase Auth
  const { data: created, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification for tests
    });

  if (createError) {
    throw new Error(`Failed to create test user: ${createError.message}`);
  }

  // Track for cleanup
  trackTestUser(created.user.id);

  // Sign in via anon client to get real tokens
  const { data: session, error: signInError } =
    await anonClient.auth.signInWithPassword({ email, password });

  if (signInError || !session.session) {
    throw new Error(
      `Failed to sign in test user: ${signInError?.message ?? 'No session returned'}`,
    );
  }

  return {
    id: created.user.id,
    email,
    password,
    accessToken: session.session.access_token,
    refreshToken: session.session.refresh_token,
    supabase: createAuthenticatedClient(session.session.access_token),
  };
}

/**
 * Create a test user AND an athlete profile (required by most API routes).
 * Returns the test user plus the athlete profile ID.
 */
export async function createTestAthlete(
  profileData: Record<string, unknown> = {},
): Promise<TestUser & { athleteId: string }> {
  const user = await createTestUser();

  // Create athlete profile using the user's authenticated client
  // This respects RLS — user can only create their own profile
  const { data: profile, error } = await user.supabase
    .from('athlete_profiles')
    .insert({
      user_id: user.id,
      display_name: `[TEST] Athlete ${user.email.split('@')[0]}`,
      hyrox_division: 'open',
      current_phase: 'general_prep',
      units_preference: 'metric',
      profile_complete: true,
      ...profileData,
    })
    .select('id')
    .single();

  if (error || !profile) {
    throw new Error(
      `Failed to create athlete profile: ${error?.message ?? 'No data returned'}`,
    );
  }

  trackTestRecord('athlete_profiles', profile.id);

  return { ...user, athleteId: profile.id };
}

/**
 * Create a second test user for cross-user isolation tests.
 * Useful for verifying RLS blocks access to other users' data.
 */
export async function createOtherTestAthlete(
  profileData: Record<string, unknown> = {},
) {
  return createTestAthlete(profileData);
}
