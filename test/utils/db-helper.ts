/**
 * Direct Database Verification Utilities
 *
 * After API calls or DB operations, verify actual database state.
 * Uses admin client to bypass RLS for verification.
 */

import { adminClient, trackTestRecord } from '../setup/database';

/**
 * Verify a record exists in the database.
 */
export async function verifyRecordExists(
  table: string,
  conditions: Record<string, unknown>,
): Promise<boolean> {
  let query = adminClient.from(table).select('id');

  for (const [key, value] of Object.entries(conditions)) {
    if (value === null) {
      query = query.is(key, null);
    } else {
      query = query.eq(key, value);
    }
  }

  const { data, error } = await query.maybeSingle();
  return !error && data !== null;
}

/**
 * Get a single record from the database (bypasses RLS).
 */
export async function getRecord<T extends Record<string, unknown>>(
  table: string,
  conditions: Record<string, unknown>,
): Promise<T | null> {
  let query = adminClient.from(table).select('*');

  for (const [key, value] of Object.entries(conditions)) {
    if (value === null) {
      query = query.is(key, null);
    } else {
      query = query.eq(key, value);
    }
  }

  const { data } = await query.maybeSingle();
  return data as T | null;
}

/**
 * Get multiple records from the database (bypasses RLS).
 */
export async function getRecords<T extends Record<string, unknown>>(
  table: string,
  conditions: Record<string, unknown>,
): Promise<T[]> {
  let query = adminClient.from(table).select('*');

  for (const [key, value] of Object.entries(conditions)) {
    if (value === null) {
      query = query.is(key, null);
    } else {
      query = query.eq(key, value);
    }
  }

  const { data } = await query;
  return (data as T[]) ?? [];
}

/**
 * Count records matching conditions.
 */
export async function countRecords(
  table: string,
  conditions: Record<string, unknown>,
): Promise<number> {
  let query = adminClient.from(table).select('id', { count: 'exact' });

  for (const [key, value] of Object.entries(conditions)) {
    if (value === null) {
      query = query.is(key, null);
    } else {
      query = query.eq(key, value);
    }
  }

  const { count } = await query;
  return count ?? 0;
}

/**
 * Insert a test record directly using admin client (bypasses RLS).
 * Automatically tracked for cleanup.
 */
export async function insertTestRecord<T extends Record<string, unknown>>(
  table: string,
  data: Record<string, unknown>,
): Promise<T> {
  const { data: record, error } = await adminClient
    .from(table)
    .insert(data)
    .select()
    .single();

  if (error || !record) {
    throw new Error(
      `Failed to insert test record into ${table}: ${error?.message ?? 'No data'}`,
    );
  }

  trackTestRecord(table, record.id as string);
  return record as T;
}

/**
 * Delete a test record directly (bypasses RLS).
 */
export async function deleteRecord(
  table: string,
  id: string,
): Promise<void> {
  await adminClient.from(table).delete().eq('id', id);
}
