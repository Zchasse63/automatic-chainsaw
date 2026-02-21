import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { COACH_K_MODEL } from '@/lib/ai/xai';
import { createCoachingTools } from '@/lib/ai/tools';
import { buildAthleteProfileMessage, buildAthleteStatsMessage } from '@/lib/ai/athlete-context';
import { retrieveKnowledge } from '@/lib/ai/rag';
import { SYSTEM_PROMPT } from '@/lib/coach/system-prompt';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { Json } from '@/types/database';

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { messages: UIMessage[]; conversationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { messages, conversationId } = body;

  if (!messages?.length) {
    return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
  }

  // Get athlete profile
  const { data: profile } = await supabase
    .from('athlete_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: 'Profile not found. Complete onboarding first.' },
      { status: 400 }
    );
  }

  // Extract latest user message text (needed for conversation title, RAG query, persistence)
  const lastUserMsg = messages.filter((m) => m.role === 'user').pop();
  const lastUserText = lastUserMsg?.parts
    ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('') ?? '';

  // Get or create conversation
  let convId = conversationId;

  if (!convId) {
    const title = lastUserText.slice(0, 100) || 'New conversation';

    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({ athlete_id: profile.id, title })
      .select('id')
      .single();

    if (convError) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }
    convId = conv.id;
  }

  // Run ALL pre-model setup in parallel:
  // 1. Athlete profile (sync — just string building)
  // 2. Athlete stats (3 parallel DB queries)
  // 3. RAG retrieval (embed user query + hybrid search)
  // 4. Persist user message
  const [athleteMessage, statsMessage, ragResult] = await Promise.all([
    Promise.resolve(
      buildAthleteProfileMessage(
        profile as unknown as Parameters<typeof buildAthleteProfileMessage>[0]
      )
    ),
    buildAthleteStatsMessage(profile.id, supabase),
    lastUserText
      ? retrieveKnowledge(lastUserText, supabase)
      : Promise.resolve(null),
    // Fire-and-forget: persist user message (don't block on it)
    lastUserText
      ? supabase.from('messages').insert({
          conversation_id: convId,
          role: 'user',
          content: lastUserText,
        })
      : Promise.resolve(null),
  ]);

  // Track pre-fetched RAG chunk IDs for logging
  const prefetchedChunkIds = ragResult?.chunkIds ?? [];

  // Assemble system prompt: base + athlete profile + stats + retrieved knowledge
  const systemParts = [SYSTEM_PROMPT];
  if (athleteMessage) systemParts.push(athleteMessage);
  if (statsMessage) systemParts.push(statsMessage);
  if (ragResult && ragResult.formatted) {
    systemParts.push(
      `## Retrieved Knowledge\n\nThe following knowledge base excerpts are relevant to the athlete's current question. Use this information to ground your response:\n\n${ragResult.formatted}`
    );
  }
  const system = systemParts.join('\n\n');

  // Only send last 16 messages for context window management
  const recentMessages = messages.slice(-16);

  const startTime = Date.now();

  try {
    const result = streamText({
      model: COACH_K_MODEL,
      system,
      messages: await convertToModelMessages(recentMessages),
      tools: createCoachingTools(profile.id, supabase),
      temperature: 0.7,
      maxOutputTokens: 16384,
      stopWhen: stepCountIs(10),
      onFinish: async ({ text, usage, steps }) => {
        const latencyMs = Date.now() - startTime;
        try {
          // Extract tool call info from all steps
          const allToolCalls = steps?.flatMap((s) => s.toolCalls ?? []) ?? [];
          const allToolResults = steps?.flatMap((s) => s.toolResults ?? []) ?? [];

          // Build suggested_actions JSON: tool names + brief result summary
          let suggestedActionsJson: Json | null = null;
          if (allToolCalls.length > 0) {
            suggestedActionsJson = JSON.parse(JSON.stringify({
              tools_used: allToolCalls.map((tc) => ({
                tool: tc.toolName,
              })),
              tool_results: allToolResults.map((tr) => ({
                tool: tr.toolName,
                result_keys: tr.output && typeof tr.output === 'object' ? Object.keys(tr.output as Record<string, unknown>) : [],
              })),
            })) as Json;
          }

          // Combine pre-fetched chunk IDs with any from tool calls
          const ragChunkIds: string[] = [...prefetchedChunkIds];
          for (const tr of allToolResults) {
            if (tr.toolName === 'search_knowledge_base' && tr.output && typeof tr.output === 'object') {
              const output = tr.output as { chunkIds?: string[] };
              if (Array.isArray(output.chunkIds)) {
                ragChunkIds.push(...output.chunkIds);
              }
            }
          }

          await supabase.from('messages').insert({
            conversation_id: convId,
            role: 'assistant',
            content: text,
            tokens_in: usage?.inputTokens ?? null,
            tokens_out: usage?.outputTokens ?? null,
            latency_ms: latencyMs,
            suggested_actions: suggestedActionsJson,
            rag_chunks_used: ragChunkIds.length > 0 ? ragChunkIds : null,
          });

          await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', convId);
        } catch (logError) {
          console.error('Failed to log messages:', logError);
        }
      },
    });

    return result.toUIMessageStreamResponse({
      headers: { 'X-Conversation-Id': convId },
    });
  } catch (err) {
    console.error('Pipeline error:', err);
    const error = err as { status?: number; message?: string };

    if (error.status === 503) {
      return NextResponse.json(
        { error: 'Coach K is warming up. Please try again in a few seconds.', retryable: true },
        { status: 503 }
      );
    }
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.', retryable: true },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: 'Coach K is temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
