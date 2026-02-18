# Team 6 — Engineering: RAG System & AI Coach Architecture

## Status: ⬜ Can start schema now
## Priority: 🟡 High
## Dependencies: Can start immediately; needs Teams 1-5 output for content ingestion
## Research method: Perplexity API → preset="advanced-deep-research" for research portions; direct implementation for code

---

## Instructions

This task has two parts:
1. **Research** (via Perplexity): Best practices for RAG architecture, embedding strategies, PGVector optimization
2. **Build** (direct implementation): Schema, API, embedding pipeline, system prompt

Start with research, then build.

## Research Prompt for Perplexity

```
You are a full-stack AI engineer building a RAG-powered Hyrox coaching system.

### Tech Stack (DECIDED)
- **Vector DB**: PGVector on Supabase
- **Structured DB**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Embedding model**: OpenAI text-embedding-3-small
- **LLM (Phase 1)**: Kimi K2 Thinking via Fireworks AI API (256K context, 32B active MoE)
- **Fine-tuning (Phase 2)**: LoRA on Fireworks AI (same model)
- **Frontend**: TBD (mobile-first, "coach in your pocket")

### Research needed on:

1. **PGVector Optimization for RAG**
   - Best chunking strategies for coaching/fitness content
   - Optimal embedding dimensions for text-embedding-3-small
   - HNSW vs IVFFlat index selection for our scale
   - Hybrid search: combining semantic similarity with keyword/metadata filtering
   - Re-ranking strategies after initial retrieval
   - Context window assembly: how to pack retrieved chunks + athlete profile into 256K

2. **Supabase-Specific RAG Patterns**
   - Edge Functions for embedding pipeline
   - RPC functions for similarity search
   - Row Level Security patterns for multi-user
   - Real-time subscriptions for workout logging
   - Storage for document uploads

3. **Fireworks AI Integration**
   - API patterns for Kimi K2 Thinking
   - Streaming responses
   - Function calling with K2 Thinking
   - LoRA deployment workflow
   - Multi-LoRA serving (if we want A/B testing different fine-tuned versions)

4. **Coaching Conversation Design**
   - System prompt architecture for a coaching persona
   - How to inject RAG context without overwhelming the model
   - Conversation memory across sessions (what to persist, what to summarize)
   - Workout prescription generation: structured output → formatted plan
   - Progress analysis from logged data

5. **Training Data Collection for Fine-Tuning**
   - How to structure conversation logs for future LoRA training
   - Quality signals to capture (user satisfaction, follow-through)
   - JSONL format requirements for Fireworks AI LoRA
   - Minimum dataset size recommendations

IMPORTANT OUTPUT REQUIREMENTS:
- Length: At minimum 3,000-5,000 words. Be thorough on implementation details.
- Format: Use structured markdown with H2/H3 headers, code blocks for SQL/Python/JSON, and markdown tables for comparisons.
- Include COMPLETE, COPY-PASTEABLE code: SQL schema with all columns/types/constraints, Python embedding pipeline, system prompt text, API endpoint specs.
- Data flow diagrams should be text-based (ASCII or markdown).
- Include an end-to-end example: user asks a question → embedding → retrieval → prompt assembly → inference → response.
- Cite sources: Reference Supabase docs, PGVector best practices, Fireworks AI docs specifically.
```

---

## Expected Output
Save raw Perplexity output to: `docs/research/completed/team6_engineering.md`

## Build Artifacts (create separately)
- `src/schema.sql` — Supabase database schema
- `src/embedding_pipeline.py` — Document ingestion + embedding
- `src/coach_system_prompt.md` — System prompt for coaching persona
- `src/search.sql` — PGVector similarity search functions
