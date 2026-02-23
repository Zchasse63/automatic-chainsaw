import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/**
 * Embed a text query using OpenAI text-embedding-3-small (1536 dim).
 */
export async function embedQuery(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

export interface RAGChunk {
  id: string;
  content: string;
  section: string;
  source_name: string;
}

export interface RAGResult {
  chunks: RAGChunk[];
  formatted: string;
  chunkIds: string[];
}

/**
 * Retrieve relevant knowledge chunks via hybrid search (semantic + full-text).
 * Used both for auto-retrieval in the route handler and as the backing
 * function for the search_knowledge_base tool.
 */
export async function retrieveKnowledge(
  query: string,
  supabase: SupabaseClient,
  matchCount: number = 5,
): Promise<RAGResult> {
  try {
    const embedding = await embedQuery(query);
    const { data, error } = await supabase.rpc('hybrid_search_chunks', {
      query_text: query,
      query_embedding: JSON.stringify(embedding),
      match_count: matchCount,
      full_text_weight: 1.0,
      semantic_weight: 1.0,
      rrf_k: 50,
    });

    if (error || !data || data.length === 0) {
      return { chunks: [], formatted: '', chunkIds: [] };
    }

    // Filter out low-relevance chunks (RRF scores below threshold)
    const SIMILARITY_THRESHOLD = 0.3;
    const scored = data as (RAGChunk & { score?: number })[];
    const hasScores = scored.some((c) => c.score !== undefined);
    const filtered = hasScores
      ? scored.filter((c) => c.score !== undefined && c.score >= SIMILARITY_THRESHOLD)
      : scored;

    if (filtered.length === 0) {
      return { chunks: [], formatted: '', chunkIds: [] };
    }

    const chunks = filtered as RAGChunk[];
    const formatted = chunks
      .map(
        (c, i) =>
          `### Source ${i + 1}: ${c.source_name}\n**Section**: ${c.section}\n\n${c.content}`,
      )
      .join('\n\n---\n\n');
    const chunkIds = chunks.map((c) => c.id);

    return { chunks, formatted, chunkIds };
  } catch {
    return { chunks: [], formatted: '', chunkIds: [] };
  }
}
