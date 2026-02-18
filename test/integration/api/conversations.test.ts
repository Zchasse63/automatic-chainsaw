/**
 * Conversations & Messages API — Live Integration Tests
 *
 * Tests conversation CRUD + message operations against REAL Supabase.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestAthlete, createOtherTestAthlete } from '../../utils/auth-helper';
import { getRecord, countRecords, verifyRecordExists } from '../../utils/db-helper';
import { adminClient, cleanupAllTestData, trackTestRecord } from '../../setup/database';

describe('Conversations & Messages', () => {
  let athlete: Awaited<ReturnType<typeof createTestAthlete>>;
  let otherAthlete: Awaited<ReturnType<typeof createOtherTestAthlete>>;

  beforeAll(async () => {
    athlete = await createTestAthlete();
    otherAthlete = await createOtherTestAthlete();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('Conversations CRUD', () => {
    it('creates a conversation', async () => {
      const { data: conv, error } = await athlete.supabase
        .from('conversations')
        .insert({
          athlete_id: athlete.athleteId,
          title: '[TEST] My First Chat',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(conv!.title).toBe('[TEST] My First Chat');
      expect(conv!.athlete_id).toBe(athlete.athleteId);
      trackTestRecord('conversations', conv!.id);
    });

    it('lists only own conversations (RLS)', async () => {
      // Create conversation for athlete
      const { data: c } = await athlete.supabase
        .from('conversations')
        .insert({ athlete_id: athlete.athleteId, title: '[TEST] Private' })
        .select()
        .single();
      trackTestRecord('conversations', c!.id);

      // Other athlete should not see it
      const { data: otherConvs } = await otherAthlete.supabase
        .from('conversations')
        .select('*')
        .eq('athlete_id', athlete.athleteId);

      expect(otherConvs).toEqual([]);
    });

    it('updates conversation title', async () => {
      const { data: c } = await athlete.supabase
        .from('conversations')
        .insert({ athlete_id: athlete.athleteId, title: '[TEST] Old Title' })
        .select()
        .single();
      trackTestRecord('conversations', c!.id);

      const { data: updated, error } = await athlete.supabase
        .from('conversations')
        .update({ title: '[TEST] New Title' })
        .eq('id', c!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated!.title).toBe('[TEST] New Title');
    });

    it('deletes conversation cascades to messages', async () => {
      // Create conv + message
      const { data: c } = await athlete.supabase
        .from('conversations')
        .insert({ athlete_id: athlete.athleteId, title: '[TEST] To Delete' })
        .select()
        .single();
      trackTestRecord('conversations', c!.id);

      const { data: msg } = await athlete.supabase
        .from('messages')
        .insert({
          conversation_id: c!.id,
          role: 'user',
          content: '[TEST] This will be cascaded',
        })
        .select()
        .single();
      trackTestRecord('messages', msg!.id);

      // Delete conversation
      await athlete.supabase.from('conversations').delete().eq('id', c!.id);

      // Verify message was cascade-deleted
      const exists = await verifyRecordExists('messages', { id: msg!.id });
      expect(exists).toBe(false);
    });
  });

  describe('Messages CRUD', () => {
    it('inserts user and assistant messages', async () => {
      const { data: c } = await athlete.supabase
        .from('conversations')
        .insert({ athlete_id: athlete.athleteId, title: '[TEST] Chat' })
        .select()
        .single();
      trackTestRecord('conversations', c!.id);

      // User message
      const { data: userMsg, error: userErr } = await athlete.supabase
        .from('messages')
        .insert({
          conversation_id: c!.id,
          role: 'user',
          content: 'What should I do today?',
        })
        .select()
        .single();

      expect(userErr).toBeNull();
      expect(userMsg!.role).toBe('user');
      trackTestRecord('messages', userMsg!.id);

      // Assistant message with metadata
      const { data: assistantMsg, error: assistantErr } = await athlete.supabase
        .from('messages')
        .insert({
          conversation_id: c!.id,
          role: 'assistant',
          content: 'Today is a tempo run day!',
          tokens_in: 150,
          tokens_out: 200,
          latency_ms: 1234,
          rag_chunks_used: ['chunk-1', 'chunk-2'],
        })
        .select()
        .single();

      expect(assistantErr).toBeNull();
      expect(assistantMsg!.tokens_in).toBe(150);
      expect(assistantMsg!.rag_chunks_used).toEqual(['chunk-1', 'chunk-2']);
      trackTestRecord('messages', assistantMsg!.id);
    });

    it('message feedback blocked by missing UPDATE RLS policy (real finding)', async () => {
      // BUG FOUND: The messages table has no UPDATE RLS policy.
      // This means /api/messages/[id]/feedback silently fails.
      // Fix: Add "Users can update own messages" policy.

      const { data: c } = await athlete.supabase
        .from('conversations')
        .insert({ athlete_id: athlete.athleteId, title: '[TEST] Feedback' })
        .select()
        .single();
      trackTestRecord('conversations', c!.id);

      const { data: msg } = await athlete.supabase
        .from('messages')
        .insert({
          conversation_id: c!.id,
          role: 'assistant',
          content: 'Great advice here.',
        })
        .select()
        .single();
      trackTestRecord('messages', msg!.id);

      // Update returns 0 rows — no UPDATE policy on messages table
      const { data: updated } = await athlete.supabase
        .from('messages')
        .update({ feedback: 'thumbs_up' })
        .eq('id', msg!.id)
        .select();

      // RLS blocks the update — 0 rows affected (silent failure)
      expect(updated).toEqual([]);

      // Verify via admin that feedback is still null
      const { data: dbMsg } = await adminClient
        .from('messages')
        .select('feedback')
        .eq('id', msg!.id)
        .single();
      expect(dbMsg!.feedback).toBeNull();
    });

    it('other user cannot read messages in my conversation (RLS)', async () => {
      const { data: c } = await athlete.supabase
        .from('conversations')
        .insert({ athlete_id: athlete.athleteId, title: '[TEST] Secret' })
        .select()
        .single();
      trackTestRecord('conversations', c!.id);

      const { data: msg } = await athlete.supabase
        .from('messages')
        .insert({
          conversation_id: c!.id,
          role: 'user',
          content: 'My private message',
        })
        .select()
        .single();
      trackTestRecord('messages', msg!.id);

      // Other athlete tries to read
      const { data: otherMessages } = await otherAthlete.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', c!.id);

      expect(otherMessages).toEqual([]);
    });
  });
});
