import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { SYSTEM_PROMPT_TEMPLATE } from './system-prompt';

// ── Clients ─────────────────────────────────────────────

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const nebius = new OpenAI({
  baseURL: 'https://api.tokenfactory.nebius.com/v1/',
  apiKey: process.env.NEBIUS_API_KEY!,
});

const NEBIUS_MODEL = process.env.NEBIUS_MODEL!;

// ── Types ───────────────────────────────────────────────

interface RAGChunk {
  id: string;
  content: string;
  section: string;
  source_name: string;
  topic_tags: string[];
  score: number;
}

interface AthleteProfile {
  display_name: string | null;
  date_of_birth: string | null;
  sex: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  hyrox_division: string | null;
  hyrox_race_count: number | null;
  training_history: Record<string, unknown> | null;
  current_phase: string | null;
  race_date: string | null;
  goal_time_minutes: number | null;
  weekly_availability_hours: number | null;
  equipment_available: string[] | null;
  injuries_limitations: string[] | null;
  units_preference: string | null;
}

export interface PipelineResult {
  stream: ReadableStream;
  ragChunkIds: string[];
}

// ── Step 1: Embed the user's message ────────────────────

async function embedQuery(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

// ── Step 2: Hybrid search for relevant knowledge ────────

async function searchChunks(
  queryText: string,
  queryEmbedding: number[]
): Promise<RAGChunk[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('hybrid_search_chunks', {
    query_text: queryText,
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: 5,
    full_text_weight: 1.0,
    semantic_weight: 1.0,
    rrf_k: 50,
  });

  if (error) {
    console.error('RAG search error:', error);
    return [];
  }

  return (data ?? []) as RAGChunk[];
}

// ── Step 3: Format retrieved chunks ─────────────────────

function formatChunks(chunks: RAGChunk[]): string {
  if (chunks.length === 0) {
    return 'No relevant knowledge found in the database.';
  }

  return chunks
    .map(
      (chunk, i) =>
        `### Source ${i + 1}: ${chunk.source_name}\n**Section**: ${chunk.section}\n\n${chunk.content}`
    )
    .join('\n\n---\n\n');
}

// ── Step 4: Build system prompt ─────────────────────────

function buildSystemPrompt(formattedContext: string): string {
  return SYSTEM_PROMPT_TEMPLATE.replace('{context}', formattedContext);
}

// ── Step 5: Build athlete profile message ───────────────

function buildAthleteProfileMessage(
  profile: AthleteProfile
): string | null {
  const parts: string[] = [];

  if (profile.display_name) parts.push(`Name: ${profile.display_name}`);

  if (profile.date_of_birth) {
    const age = Math.floor(
      (Date.now() - new Date(profile.date_of_birth).getTime()) /
        (365.25 * 24 * 60 * 60 * 1000)
    );
    parts.push(`${age}yo`);
  }

  if (profile.sex) parts.push(profile.sex);
  if (profile.weight_kg) parts.push(`${profile.weight_kg}kg`);
  if (profile.height_cm) parts.push(`${profile.height_cm}cm`);

  if (profile.hyrox_division)
    parts.push(`Division: ${profile.hyrox_division}`);
  if (profile.hyrox_race_count !== null)
    parts.push(`${profile.hyrox_race_count} Hyrox races completed`);

  const history = profile.training_history as Record<string, unknown> | null;
  if (history) {
    if (history.experience) parts.push(`Experience: ${history.experience}`);
    if (history.run_mpw) parts.push(`runs ${history.run_mpw}mi/week`);
    if (history.strength_days)
      parts.push(`${history.strength_days} strength days/week`);
  }

  if (profile.weekly_availability_hours)
    parts.push(`${profile.weekly_availability_hours}h/week available`);

  if (profile.race_date) {
    const daysUntil = Math.ceil(
      (new Date(profile.race_date).getTime() - Date.now()) /
        (24 * 60 * 60 * 1000)
    );
    if (daysUntil > 0) {
      parts.push(`race in ${daysUntil} days`);
    } else {
      parts.push('race date has passed');
    }
  }

  if (profile.goal_time_minutes)
    parts.push(`goal: ${profile.goal_time_minutes} min`);

  if (profile.current_phase)
    parts.push(`phase: ${profile.current_phase.replace(/_/g, ' ')}`);

  if (profile.equipment_available && profile.equipment_available.length > 0)
    parts.push(`equipment: ${profile.equipment_available.join(', ')}`);

  if (
    profile.injuries_limitations &&
    profile.injuries_limitations.length > 0
  )
    parts.push(
      `injuries/limitations: ${profile.injuries_limitations.join(', ')}`
    );

  if (parts.length === 0) return null;

  return `Athlete profile: ${parts.join(', ')}`;
}

// ── Step 6-8: Assemble messages & stream ────────────────

export async function runCoachingPipeline(
  userMessage: string,
  conversationId: string,
  userId: string
): Promise<PipelineResult> {
  const supabase = await createClient();
  const startTime = Date.now();

  // [1] Embed query
  let embedding: number[];
  let ragChunks: RAGChunk[] = [];

  try {
    embedding = await embedQuery(userMessage);
    // [2] Search chunks
    ragChunks = await searchChunks(userMessage, embedding);
  } catch (err) {
    // If embedding/RAG fails, continue without context
    console.error('Embedding/RAG error, continuing without context:', err);
  }

  const ragChunkIds = ragChunks.map((c) => c.id);

  // [3] Format chunks
  const formattedContext = formatChunks(ragChunks);

  // [4] Build system prompt
  const systemPrompt = buildSystemPrompt(formattedContext);

  // [5] Get athlete profile
  const { data: profile } = await supabase
    .from('athlete_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const athleteMessage = profile
    ? buildAthleteProfileMessage(profile as unknown as AthleteProfile)
    : null;

  // [6] Load conversation history (last 8 turns)
  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(16); // 8 turns = 16 messages max

  // Take last 16 messages (8 user + 8 assistant turns)
  const recentHistory = (history ?? []).slice(-16);

  // [6] Assemble messages array
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
  ];

  if (athleteMessage) {
    messages.push({ role: 'system', content: athleteMessage });
  }

  for (const msg of recentHistory) {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    });
  }

  messages.push({ role: 'user', content: userMessage });

  // [7] Call Coach K model (streaming)
  const completion = await nebius.chat.completions.create({
    model: NEBIUS_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 1200,
    stream: true,
    stream_options: { include_usage: true },
  });

  // [8] Build SSE stream + [9] Log after completion
  let fullResponse = '';
  let tokensIn = 0;
  let tokensOut = 0;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            fullResponse += delta;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ token: delta })}\n\n`)
            );
          }

          // Capture usage from the final chunk
          if (chunk.usage) {
            tokensIn = chunk.usage.prompt_tokens;
            tokensOut = chunk.usage.completion_tokens;
          }
        }

        // [9] Persist messages BEFORE closing stream
        const latencyMs = Date.now() - startTime;
        let assistantMessageId: string | null = null;

        try {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'user',
            content: userMessage,
          });

          // Detect if response looks like a training plan
          const suggestedActions = looksLikeTrainingPlan(fullResponse)
            ? JSON.stringify({ type: 'training_plan' })
            : null;

          const { data: savedMsg } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: fullResponse,
              rag_chunks_used: ragChunkIds,
              tokens_in: tokensIn,
              tokens_out: tokensOut,
              latency_ms: latencyMs,
              suggested_actions: suggestedActions,
            })
            .select('id')
            .single();

          assistantMessageId = savedMsg?.id ?? null;

          await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);
        } catch (logError) {
          console.error('Failed to log messages:', logError);
        }

        // Send metadata with message ID so client can use it for feedback
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, messageId: assistantMessageId })}\n\n`
          )
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        console.error('Stream error:', err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return { stream, ragChunkIds };
}

// ── Heuristic: detect training plan in response ──────────

function looksLikeTrainingPlan(content: string): boolean {
  const weeks = (content.match(/week\s+\d+/gi) || []).length;
  const days = (
    content.match(
      /monday|tuesday|wednesday|thursday|friday|saturday|sunday/gi
    ) || []
  ).length;
  const sessions = (
    content.match(/\b(run|hiit|strength|recovery|simulation|station)\b/gi) ||
    []
  ).length;
  return weeks >= 2 && days >= 3 && sessions >= 3;
}
