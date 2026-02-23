import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { retrieveKnowledge } from '../rag';

export function createKnowledgeTools(supabase: SupabaseClient) {
  return {
    search_knowledge_base: tool({
      description:
        'Search the knowledge base for a DIFFERENT query than the user\'s message. Relevant knowledge for the user\'s current question is already provided in context. Only use this tool if you need additional information on a different or more specific topic.',
      inputSchema: z.object({
        query: z.string().describe('The search query — must be different from the user\'s original question'),
      }),
      execute: async ({ query }) => {
        const result = await retrieveKnowledge(query, supabase);
        if (result.chunks.length === 0) {
          return { chunks: [], message: 'No relevant knowledge found.' };
        }
        return {
          chunks: result.formatted.split('\n\n---\n\n'),
          chunkIds: result.chunkIds,
        };
      },
    }),
  };
}
