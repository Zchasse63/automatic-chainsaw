# System Design — Hyrox AI Coach

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    HYROX AI COACH                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Frontend    │  │   Supabase   │  │  Nebius Token    │  │
│  │  (Mobile/Web) │  │   Backend    │  │    Factory        │  │
│  │              │──▶│              │──▶│                  │  │
│  │  Chat UI     │  │  PGVector    │  │ Llama 3.3 70B    │  │
│  │  Workout Log │  │  PostgreSQL  │  │  LoRA fine-tuned │  │
│  │  Dashboard   │  │  Auth        │  │  Serverless LoRA │  │
│  │  Progress    │  │  Edge Fns    │  │  $0.13/$0.40/1M  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  DATA FLOW: User Question → Coaching Response                │
│                                                              │
│  1. User asks: "What should I do for sled push training?"   │
│  2. Query → text-embedding-3-small → embedding vector        │
│  3. PGVector cosine similarity → top 5 relevant chunks       │
│  4. Retrieve athlete profile (current week, PRs, history)    │
│  5. Assemble prompt: system prompt + RAG context + profile   │
│  6. Send to Llama 3.3 70B LoRA on Nebius → coaching response │
│  7. Log interaction for future fine-tuning data              │
└─────────────────────────────────────────────────────────────┘
```

## Supabase Schema (High Level)

### Tables

**knowledge_base** — RAG source documents (research from Teams 1-5)
- id, content, embedding (vector), metadata (JSONB)
- source (team1-6), topic, subtopic, athlete_name, program_name
- chunk_index, total_chunks, created_at

**athlete_profiles** — Persistent athlete state
- id, user_id (FK to auth.users), name
- current_week, current_phase, race_date
- running_mpw, strength_days, hiit_days
- prs (JSONB: sled_push, ski_erg, etc.)
- injury_history, preferences, goals

**workout_logs** — Training history
- id, user_id, date, type (run/hiit/strength/simulation)
- duration_minutes, rpe, heart_rate_avg, heart_rate_max
- exercises (JSONB array), notes, tags
- hyrox_station (nullable), station_time

**running_logs** — Detailed run data
- id, user_id, date, distance_miles, duration, pace
- type (easy/tempo/interval/long/race)
- splits (JSONB), elevation_gain, hr_zones

**training_plans** — Periodization state
- id, user_id, plan_name, start_date, race_date
- current_week, current_phase
- planned_workouts (JSONB), completed_workouts (JSONB)
- adherence_pct, adjustments_log

**conversations** — Chat history + training data collection
- id, user_id, timestamp
- user_message, assistant_response
- rag_context_used (JSONB: which chunks were retrieved)
- quality_rating (nullable: for fine-tuning data quality)
- flagged_for_training (boolean)

### PGVector Configuration
- Extension: `vector` enabled
- Embedding dimension: 1536 (text-embedding-3-small)
- Index: HNSW (for <100K vectors, better recall than IVFFlat)
- Distance function: cosine similarity

## Embedding Pipeline

1. **Ingest**: Load research markdown from `docs/research/completed/`
2. **Chunk**: Split by section headers (H2/H3), overlap 100 tokens between chunks
3. **Enrich metadata**: Auto-tag with source team, topic, athlete name, program
4. **Embed**: text-embedding-3-small → 1536-dim vectors
5. **Store**: Insert into `knowledge_base` table with embedding + metadata
6. **Index**: HNSW index on embedding column

## Coaching Conversation Flow

```
User message
    │
    ▼
┌─────────────────┐
│ Embed user query │ → text-embedding-3-small
└────────┬────────┘
         │
    ▼                              ▼
┌──────────────┐         ┌───────────────────┐
│ RAG retrieval│         │ Athlete profile   │
│ (PGVector    │         │ (PostgreSQL query) │
│  top-5 chunks)│        │                   │
└──────┬───────┘         └────────┬──────────┘
       │                          │
       └──────────┬───────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Assemble prompt │
         │ System prompt   │
         │ + RAG context   │
         │ + Athlete data  │
         │ + User message  │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │ Llama 3.3 70B   │
         │ (Nebius API)    │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │ Response + Log  │
         │ Save to         │
         │ conversations   │
         └────────────────┘
```

## Fine-Tuning Data Collection

Every coaching interaction automatically:
1. Saves user message + model response to `conversations` table
2. Records which RAG chunks were used (for training context)
3. Optionally captures quality rating (thumbs up/down in UI)
4. Flags high-quality exchanges for training data

When ready to fine-tune:
1. Export flagged conversations as JSONL
2. Format for Nebius LoRA (chat completions format)
3. Upload and train LoRA adapter on Llama 3.3 70B base
4. Deploy as serverless LoRA on Nebius (serves at base model price)
5. A/B test fine-tuned vs base model responses

## Research Workflow (Perplexity Integration)

```
Research task file (docs/research/team{N}.md)
    │
    ▼
┌────────────────────────────┐
│ scripts/perplexity_research│
│ preset=advanced-deep-      │
│ research                   │
│ model=claude-opus-4-6      │
│ max_steps=10               │
│ tools=web_search+fetch_url │
└──────────┬─────────────────┘
           │
           ▼
docs/research/completed/team{N}_output.md
           │
           ▼
    Embedding pipeline
           │
           ▼
    PGVector knowledge_base
```
