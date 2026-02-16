# Hyrox AI Coach — Build Plan

> **Created**: 2026-02-13
> **Status**: APPROVED — executing
> **Prerequisite**: All 15 research outputs complete (~92K words, $13.13 Perplexity API cost)

---

## Executive Summary

This document defines the execution plan for building the Hyrox AI Coach from our completed research base. There are two parallel pipelines — **Fine-Tuning** (coaching persona) and **RAG** (knowledge retrieval) — that converge into the final product. The critical insight driving execution order is: **chunking must happen first** because it defines the knowledge units that both pipelines depend on.

---

## Why Chunking Comes First

Both pipelines consume the same 15 research outputs but in different ways:

| Pipeline | How It Uses Research | Dependency on Chunks |
|----------|---------------------|---------------------|
| **RAG** | Chunks → embed → store in PGVector | Chunks ARE the product |
| **Fine-Tuning** | Research → generate coaching Q&A pairs | Some training examples need RAG-style context snippets so the model learns to USE retrieved chunks |

The fine-tuning guide (Section 8) explicitly states:
> *"If model ignores RAG context → Add training examples that explicitly reference provided context"*

This means ~15-20% of training examples should include a realistic RAG context block (an actual chunk from our knowledge base) in the prompt, teaching the LoRA to synthesize retrieved context into coaching responses. **We can't write those examples until we know what the chunks look like.**

---

## Execution Order

```
Phase 1: CHUNK          ──→  Defines knowledge units (both pipelines need this)
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
Phase 2a: GENERATE JSONL              Phase 2b: SUPABASE SCHEMA
(fine-tuning data from                (tables, PGVector extension,
 research + chunks)                    athlete profile schema)
              │                               │
              ▼                               ▼
Phase 3a: UPLOAD + TRAIN LoRA         Phase 3b: EMBED + STORE
(Nebius Token Factory, runs async     (OpenAI embeddings → PGVector)
 on their GPUs for ~15 min)
              │                               │
              └───────────────┬───────────────┘
                              ▼
Phase 4: WIRE + TEST      ──→  RAG pipeline + fine-tuned model + athlete profile
                              ▼
Phase 5: ITERATE           ──→  v2 training data from real usage, warm-start LoRA
```

---

## Phase 1: Chunk Research Documents

**Goal**: Split 15 research outputs into semantically coherent chunks suitable for embedding and retrieval.

### Chunking Strategy

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Chunk size** | 500-800 tokens (~375-600 words) | Fits comfortably in K2's context with room for multiple retrieved chunks |
| **Overlap** | 50-100 tokens | Preserves context at boundaries |
| **Method** | Semantic (by H2/H3 header sections) | Our research is well-structured with clear headers |
| **Metadata per chunk** | source_doc, section_header, topic_tags, chunk_index | Enables filtered retrieval |

### Why Semantic Over Fixed-Size

Our research docs are already well-organized with H2/H3 headers marking distinct topics. Splitting on headers preserves the natural knowledge boundaries (e.g., "Sled Push Technique" stays as one chunk rather than getting split mid-paragraph). For sections that exceed 800 tokens, we split at paragraph boundaries within the section.

### Estimated Chunk Count

| Document | Est. Usable Words | Est. Chunks |
|----------|------------------:|------------:|
| team1a (Event Format) | 5,900 | 12-15 |
| team1b (Pacing) | 6,200 | 13-16 |
| team1c (Station Breakdown) | 7,100 | 15-18 |
| team2 (Elite Athletes) | 4,800 | 10-12 |
| team2b_synth (Elite Completion) | 3,600* | 8-10 |
| team3a_synth (PRVN/HWPO/CompTrain) | 5,700* | 12-14 |
| team3b_synth (Persist/Hybrid/BPN) | 5,500* | 11-14 |
| team3c (CrossFit/Running) | 6,000 | 12-15 |
| team4 (Sports Science) | 4,500 | 9-12 |
| team4b (Recovery/Testing) | 6,900 | 14-17 |
| team5 (Periodization Blueprint) | 8,100* | 16-20 |
| team5b (Autoregulation) | 6,700 | 13-17 |
| team6 (Engineering) | 6,300 | 13-16 |
| team7 (Workout Construction) | 8,400 | 17-21 |
| team8 (Nutrition/Recovery) | 6,200 | 13-16 |
| **Total** | **~92,000** | **~190-240 chunks** |

*Asterisked files have inflated raw word counts due to metadata/JSON content. Usable word counts shown.

### Chunk Output Format

```json
{
  "id": "team1c_station_sled_push_001",
  "source_doc": "team1c_20260213_083157.md",
  "section": "Sled Push Station",
  "content": "The sled push is one of the most glycolytic stations...",
  "word_count": 420,
  "topic_tags": ["sled_push", "station", "technique", "glycolytic"],
  "chunk_index": 7
}
```

### Deliverables
- `docs/chunks/all_chunks.json` — All chunks with metadata
- `docs/chunks/chunk_stats.md` — Stats: count, avg size, distribution
- `scripts/chunk_research.py` — Reproducible chunking script

---

## Phase 2a: Generate Fine-Tuning Data (JSONL)

**Goal**: Convert research knowledge into ~1,000 coaching conversation examples for LoRA v1. Target range: 700-1,000 high-quality examples. Quality over quantity — no filler.

### Training Example Categories

| Category | Description | Examples per Doc | Total Est. |
|----------|-------------|:----------------:|-----------:|
| **Factual recall** | "What are the 8 stations?" | 8-12 | 100-150 |
| **Workout programming** | "Design a 4-week sled push block" | 12-20 | 150-200 |
| **Coaching judgment** | "I'm exhausted but have a key session" | 8-12 | 100-130 |
| **Race strategy** | "How should I pace my 1km runs?" | 5-8 | 50-70 |
| **Science explanation** | "Why does concurrent training cause interference?" | 5-8 | 60-80 |
| **RAG-augmented** | Context snippet + question + synthesis | — | 100-150 |
| **Multi-turn** | 2-3 turn coaching conversations | — | 100-150 |
| **Cross-topic scenarios** | Questions spanning multiple research areas | — | 50-80 |
| **Target Total** | | | **~1,000** |

### System Prompt (Consistent Across All Examples)

```
You are Coach K, an elite Hyrox training coach powered by deep sports science knowledge. You combine the periodization expertise of Chris Hinshaw and Andy Galpin with the competitive intensity of Hunter McIntyre and Jake Dearden. You're direct, specific, and data-driven. You always explain the "why" behind your programming. When prescribing workouts, you specify exact sets, reps, rest periods, and RPE targets. You reference the athlete's training history and current fitness level. You think in terms of energy systems, movement patterns, and progressive overload.
```

### RAG-Augmented Training Example Format

These examples teach the model to USE retrieved context (critical for the hybrid architecture):

```jsonl
{"messages":[{"role":"system","content":"You are Coach K... [system prompt]\n\nRelevant knowledge:\n---\nThe sled push is completed over 50m with standardized weights: 152kg for Open Men, 102kg for Open Women. Elite male athletes complete this station in 1:30-2:00, with the primary limiting factor being leg drive power and glycolytic capacity rather than upper body pushing strength.\n---"},{"role":"user","content":"My sled push time was 4:30 in my last simulation. What should I focus on?"},{"role":"assistant","content":"4:30 is roughly double elite pace, but here's the good news: sled push responds faster to targeted training than almost any other station.\n\nThe research is clear — sled push performance correlates most strongly with relative leg strength, not upper body. Your priority stack:\n\n1. **Heavy sled work 2x/week** — 6-8 x 50m at race weight, focusing on low hip position and driving through the floor. Rest 2-3 min between sets. Target RPE 8.\n\n2. **Posterior chain strength** — Romanian deadlifts 3x8 at RPE 7-8, hip thrusts 3x10. These build the hip extension power that drives the sled.\n\n3. **Practice the transition** — Always follow sled work with a 200m run at race pace. Your body needs to learn how to run on legs that feel like concrete.\n\nWith 6 weeks of this, you should see 60-90 seconds come off. The biggest gains come in the first training block because untrained sled push has the widest performance variance of any station."}]}
```

### Per-Document Q&A Generation Plan

| Source Doc | Focus Areas | Single-Turn | Multi-Turn | RAG-Context | Total |
|-----------|-------------|:-----------:|:----------:|:-----------:|------:|
| team1a | Event format, tiers, benchmarks | 25 | 8 | 7 | 40 |
| team1b | Pacing, transitions, race day | 30 | 10 | 8 | 48 |
| team1c | 8 station techniques, common errors | 40 | 12 | 10 | 62 |
| team2 + 2b | Elite methods, CrossFit translation | 30 | 10 | 8 | 48 |
| team3a/3b/3c | Program design, methodology | 45 | 15 | 12 | 72 |
| team4 + 4b | Energy systems, recovery, testing | 50 | 15 | 15 | 80 |
| team5 | Periodization, phase structure | 35 | 12 | 10 | 57 |
| team5b | Autoregulation, RPE, adaptations | 30 | 12 | 10 | 52 |
| team6 | System design (minimal coaching content) | 5 | 2 | 2 | 9 |
| team7 | Workout formats, movement matrix, scaling | 50 | 15 | 15 | 80 |
| team8 | Nutrition, supplements, sleep, hydration | 35 | 10 | 10 | 55 |
| **Cross-topic** | Scenarios spanning multiple docs | 40 | 20 | 15 | 75 |
| **Total** | | **415** | **141** | **122** | **~678-1,000** |

**Note**: Target ~1,000. Realistic floor ~700. Quality over quantity — no filler examples to hit a number.

### Quality Filters (Pre-Inclusion Checklist)

Every training example must pass:
- [ ] Factually grounded in research (no hallucinated claims)
- [ ] Includes specific, quantified recommendations (sets, reps, pacing, RPE)
- [ ] Uses coaching voice — direct, encouraging, explains "why"
- [ ] Response length: 150-500 words (typical coaching interaction)
- [ ] Multi-turn conversations flow naturally
- [ ] No contradictions with other training examples
- [ ] RAG-context examples actually reference the provided context

### File Organization

```
docs/training-data/
├── raw/                          # Per-document JSONL files
│   ├── team1a_training.jsonl
│   ├── team1b_training.jsonl
│   ├── ...
│   └── cross_topic_training.jsonl
├── combined/
│   ├── train.jsonl               # 90% (~900 examples, shuffled)
│   └── eval.jsonl                # 10% (~100 examples, held out)
├── validate.py                   # JSONL validation script
└── stats.md                      # Example counts, token estimates, category breakdown
```

### Deliverables
- ~700-1,000 JSONL training examples across all categories (quality over quantity)
- Validated train/eval split (90/10)
- Token count and cost estimate before upload

---

## Phase 2b: Supabase Schema Setup (Parallel with 2a)

**Goal**: Set up Supabase project with PGVector, athlete profile tables, and conversation logging.

### Tables

```sql
-- Enable PGVector extension
create extension if not exists vector;

-- Knowledge base chunks (RAG)
create table knowledge_chunks (
  id text primary key,
  source_doc text not null,
  section text,
  content text not null,
  topic_tags text[],
  chunk_index int,
  word_count int,
  embedding vector(1536),  -- text-embedding-3-small
  created_at timestamptz default now()
);

-- Athlete profile (persistent state)
create table athlete_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  display_name text,
  weight_kg numeric,
  height_cm numeric,
  age int,
  sex text,
  training_history jsonb,        -- run volume, strength level, experience
  current_phase text,            -- general_prep, specific_prep, competition_prep, taper
  race_date date,
  goal_time_minutes numeric,
  weekly_availability_hours numeric,
  equipment_available text[],
  injuries_limitations text[],
  preferences jsonb,             -- AM/PM, workout style preferences
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Workout logs
create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athlete_profiles(id),
  date date not null,
  session_type text,             -- run, hiit, strength, simulation, recovery
  prescribed_workout jsonb,      -- what was prescribed
  completed_workout jsonb,       -- what was actually done
  rpe_pre int,                   -- pre-session readiness (1-10)
  rpe_post int,                  -- post-session RPE (1-10)
  duration_minutes int,
  notes text,
  created_at timestamptz default now()
);

-- Benchmark tests
create table benchmark_tests (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athlete_profiles(id),
  test_date date not null,
  test_type text,                -- cooper, time_trial_2k, station_test, simulation, strength
  results jsonb,                 -- flexible: {distance: 2400, time_seconds: 480, ...}
  notes text,
  created_at timestamptz default now()
);

-- Conversation logs (for future fine-tuning data collection)
create table conversations (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athlete_profiles(id),
  messages jsonb not null,       -- [{role, content, timestamp}]
  rag_chunks_used text[],        -- which chunks were retrieved
  model_used text,               -- base or lora version
  quality_rating int,            -- user thumbs up/down (1-5)
  flagged_for_training boolean default false,
  created_at timestamptz default now()
);

-- Indexes
create index on knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index on workout_logs (athlete_id, date);
create index on benchmark_tests (athlete_id, test_date);
create index on conversations (athlete_id, created_at);
```

### Deliverables
- Supabase project created and configured
- All tables created with indexes
- RLS policies for multi-user support
- Connection tested from Python

---

## Phase 3a: Upload + Train LoRA (After Phase 2a)

**Goal**: Upload validated JSONL to Nebius Token Factory and start LoRA SFT on Llama 3.3 70B Instruct.

### Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Base model** | `meta-llama/Llama-3.3-70B-Instruct` | Proven, cheapest serverless LoRA |
| **Output model** | `hyrox-coach-v1` (suffix) | First iteration |
| **Epochs** | 3 | Good balance for ~700-900 examples |
| **LoRA rank** | 16 | Higher than default 8 for richer coaching persona |
| **LoRA alpha** | 32 | 2x rank for scaling |
| **Context length** | 8192 | Sufficient for our training examples (max 2,304 tokens) |

### Steps
1. Validate JSONL locally (validation script)
2. Upload `all.jsonl` to Nebius via OpenAI SDK
3. Create SFT job with LoRA hyperparameters
4. Poll until completion (est. ~15 minutes)
5. Deploy LoRA via v0 API
6. Test inference with sample prompts

### Post-Training Evaluation Prompts
```
1. "I have 12 weeks until Hyrox and I run 35 miles per week. How should I structure my training?"
2. "My sled push time is 4:30. What's the fastest way to improve?"
3. "I missed 3 training days this week due to travel. How do I get back on track?"
4. "Design me an EMOM workout targeting the ski erg and wall ball stations."
5. "My RPE has been 8+ on all sessions this week. What should I do?"
6. "What supplements should I take during my 16-week Hyrox prep?"
7. "I only have 30 minutes today instead of 60. What should I do with my HIIT session?"
8. "My 5K time is 22 minutes. What Hyrox finish time should I target?"
```

Compare fine-tuned responses vs. base K2 Thinking to evaluate persona capture.

---

## Phase 3b: Embed + Store in PGVector (After Phases 1 + 2b)

**Goal**: Embed all chunks using text-embedding-3-small and store in Supabase PGVector.

### Steps
1. Load all chunks from `docs/chunks/all_chunks.json`
2. Batch embed via OpenAI API (batch size: 100 chunks per request)
3. Insert into `knowledge_chunks` table with embeddings
4. Verify retrieval with test queries:
   - "How should I pace my 1km runs between stations?" → should retrieve team1b pacing chunks
   - "What's the best sled push technique?" → should retrieve team1c sled push chunks
   - "How much protein should I eat daily?" → should retrieve team8 nutrition chunks

### Embedding Cost
- ~200-240 chunks × ~500 tokens avg = ~100K-120K tokens
- OpenAI text-embedding-3-small: $0.02 / 1M tokens
- **Cost: < $0.01** — essentially free

---

## Phase 4: Wire + Test

**Goal**: Connect RAG retrieval → fine-tuned K2 Thinking → response generation.

### Query Pipeline
```
User question
    → Embed query (text-embedding-3-small)
    → Search PGVector (cosine similarity, top-5 chunks)
    → Build prompt: system prompt + retrieved chunks + user question
    → Send to fine-tuned K2 Thinking (hyrox-coach-v1)
    → Return coaching response
    → Log to conversations table
```

### Test Scenarios
1. **Factual accuracy**: Questions with known answers from research
2. **Coaching persona**: Verify voice, tone, specificity
3. **RAG grounding**: Verify model references retrieved context, not hallucinations
4. **Multi-domain**: Questions spanning multiple research areas
5. **Edge cases**: Questions outside training data, off-topic detection

---

## Phase 5: Iterate (Only If Needed)

v1 is designed to be comprehensive. Only iterate if testing reveals specific gaps.

### v2 Training Data Sources (If Needed)
- Corrections from Phase 4 testing (responses that missed the mark)
- New scenario types discovered during testing
- DPO pairs: preferred vs. rejected responses for ambiguous coaching situations
- High-quality conversations from real usage (flagged_for_training = true)

### Warm-Start LoRA
- Use `warmStartFrom: hyrox-coach-v1` instead of `baseModel`
- 1 epoch on new data only
- Cost: ~$5 per iteration

---

## Cost Estimates

### Fine-Tuning Costs (Nebius Token Factory)

**Model tier**: Llama 3.3 70B Instruct = **$2.80 per 1M training tokens**

| Version | Examples | Avg Tokens/Example | Dataset Tokens | Epochs | Training Tokens | Cost |
|---------|:--------:|:------------------:|:--------------:|:------:|:---------------:|-----:|
| **v1** | 729 | ~862 | ~628K | 3 | ~1.9M | **~$5.28** |
| **v2** | 924 | ~843 | ~779K | 3 | ~2.3M | **~$6.54** |

### Token Estimation Methodology

Per training example breakdown:
- **System prompt**: ~150 tokens (consistent "Coach K" prompt)
- **User message**: ~50-100 tokens (coaching question)
- **Assistant response**: ~400-650 tokens (target: 150-500 words of specific coaching)
- **Single-turn average**: ~725 tokens
- **Multi-turn average**: ~1,200 tokens (2-3 turns)
- **RAG-augmented average**: ~1,000 tokens (chunk context + Q&A)
- **Weighted average across all types**: ~800 tokens (v1), ~1,000 tokens (v2+)

### Embedding Costs (OpenAI)

| Item | Tokens | Rate | Cost |
|------|:------:|------|-----:|
| Chunk embeddings (~220 chunks) | ~110K | $0.02/1M | **$0.002** |
| Query embeddings (testing, ~1K queries) | ~10K | $0.02/1M | **$0.0002** |
| **Total embedding cost** | | | **< $0.01** |

### Inference Costs (Nebius Token Factory — Post-Training)

Fine-tuned LoRA serves at base model price (no markup):

| | Rate (per 1M tokens) |
|---|---|
| Input | $0.13 |
| Output | $0.40 |

Estimated per coaching interaction:
- Input: ~2,000 tokens (system prompt + RAG chunks + user message) = $0.0012
- Output: ~500 tokens (coaching response) = $0.00125
- **Cost per interaction: ~$0.0025** (less than 1 cent)
- **1,000 interactions: ~$2.50**

### Supabase

| Tier | Cost | Includes |
|------|------|---------|
| Free | $0 | 500MB database, 1GB storage, 50K auth MAU |
| Pro (if needed) | $25/mo | 8GB database, 100GB storage |

Free tier is sufficient for development and initial testing.

### Total Project Cost Estimate

| Category | v1 (Actual) | v2 (Estimate) |
|----------|:--------:|:------------:|
| Perplexity Research | $13.13 | +$10 |
| Fine-tuning (Nebius) | $5.63 | ~$6.54 |
| Embeddings (OpenAI) | < $0.01 | < $0.01 |
| Inference testing | ~$0.03 | ~$0.05 |
| Supabase | $0 | $0 |
| **Total** | **~$19** | **~$30** |

---

## Timeline Estimate

| Phase | Task | Can Parallelize? | Blocking? |
|-------|------|:----------------:|:---------:|
| **1** | Chunk research docs | — | Yes — blocks 2a, 3b |
| **2a** | Generate JSONL (~500 examples) | With 2b | Yes — blocks 3a |
| **2b** | Set up Supabase schema | With 2a | Yes — blocks 3b |
| **3a** | Upload JSONL + train LoRA | With 3b | Yes — blocks 4 (but runs async on Nebius GPUs) |
| **3b** | Embed chunks + store in PGVector | With 3a | Yes — blocks 4 |
| **4** | Wire RAG pipeline + test | — | Yes — blocks 5 |
| **5** | Iterate (v2 data, warm-start) | — | Ongoing |

**Critical path**: Phase 1 → Phase 2a → Phase 3a (LoRA training)

The LoRA training itself runs asynchronously on Nebius GPUs (~15 minutes), so once we kick it off, we can work on Phase 3b while waiting.

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| LoRA doesn't capture coaching persona | Medium | High | Start with 700+ examples + rank 16; iterate with more data and higher rank if needed |
| RAG retrieves irrelevant chunks | Low | Medium | Well-structured chunks + topic tags enable filtered search; test extensively |
| Model ignores RAG context | Medium | High | 15-20% of training examples explicitly include RAG context; teaches model to use it |
| Training data quality too low | Medium | High | Quality filters + human review of sample before full generation |
| Nebius API issues | Low | Medium | OpenAI-compatible SDK; proven platform |

---

## Next Action

**Phase 1: Chunk Research Documents** — Build `scripts/chunk_research.py` and process all 15 outputs.
