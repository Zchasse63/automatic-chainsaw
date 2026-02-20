# CLAUDE.md — Hyrox AI Coach Project

## Project Overview

Building a personalized AI-powered Hyrox coach using a **Hybrid RAG + Fine-Tuning** architecture. The system combines retrieval-augmented generation for accurate, grounded coaching with LoRA fine-tuning for a distinctive coaching persona — resulting in a coach that knows the science, knows the athlete, and sounds like a real coach.

## Athlete Profile

- **Current fitness**: 35–40 miles/week running, 4–5 strength training days/week
- **Target event**: Hyrox — June 6, 2025 (~16 weeks from mid-Feb 2025)
- **Key adaptation**: Convert 2–3 strength days → HIIT-style (EMOM, AMRAP, intervals) while maintaining run volume
- **Goal**: Build a "coach in your pocket" — personalized, science-backed, adaptive

## Architecture Decision (FINAL)

### Three-Layer System

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **RAG** (retrieval) | Supabase PGVector + text-embedding-3-small | Provides correct facts, athlete data, current science |
| **Inference** (persona) | Grok 4.1 Fast Reasoning via xAI | Coaching voice, reasoning style, output format |
| **Athlete Profile** (state) | Supabase PostgreSQL | Persistent state: workout logs, PRs, race countdown, preferences |

### Why This Combination

- **Fine-tuning alone** → sounds like a coach but hallucinates (no access to athlete data or current science)
- **RAG alone** → accurate but generic voice (textbook with your name inserted)
- **Combined** → RAG feeds it *what to coach about*, fine-tuning teaches it *how to be a coach*, athlete profile gives it *who it's coaching*

## Model: Grok 4.1 Fast Reasoning via xAI

| Spec | Value |
|------|-------|
| Provider | xAI |
| Model ID | `grok-4-1-fast-reasoning` |
| Integration | Vercel AI SDK (`@ai-sdk/xai`) |
| Key strength | Fast reasoning, strong instruction following, excellent coaching persona |
| Function calling | Supported |

### Known Concerns
- RAG layer remains critical to ground responses and prevent hallucination
- Do NOT rely on parametric knowledge alone for training prescriptions or science claims

## Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Vector DB | Supabase PGVector | Knowledge base embeddings (research docs, protocols) |
| Structured DB | Supabase PostgreSQL | Athlete profile, workout logs, training plans |
| Auth | Supabase Auth | User management |
| Embeddings | OpenAI text-embedding-3-small (1536 dim) | Document + query embedding |
| Inference | Grok 4.1 Fast Reasoning via xAI | AI coaching responses |
| Frontend | Next.js 16.1.6 + React 19 + Tailwind v4 | Dark-mode mobile-first "coach in your pocket" UI |
| State Mgmt | @tanstack/react-query v5 + Zustand v5 | Server state caching + ephemeral UI state |
| Hosting | Netlify | hyrox-ai-coach.netlify.app |

## Research Workflow

### Deep Research via Perplexity API

This project uses **Perplexity's Agentic Research API** for all deep research tasks. The API is already configured in VS Code.

**API Key:** Set via `PERPLEXITY_API_KEY` in `.env.local`

**Preset to use:** `advanced-deep-research`
- **Model:** `anthropic/claude-opus-4-6`
- **Tools:** `web_search` + `fetch_url`
- **Max steps:** 10 (highest available)
- **Use case:** Institutional-grade research with maximum depth

**How to call it:**
```bash
# Endpoint: POST https://api.perplexity.ai/v1/responses
# Auth: Bearer token with PERPLEXITY_API_KEY
# Payload: { "preset": "advanced-deep-research", "input": "<your prompt>" }

# Using the runner script:
python scripts/perplexity_research.py --task team1
python scripts/perplexity_research.py --prompt "Custom query" --preset fast-search
```

**Other presets (for lighter tasks):**
| Preset | Model | Steps | Use When |
|--------|-------|-------|----------|
| `fast-search` | xai/grok-4-1-fast | 1 | Quick factual lookups |
| `pro-search` | openai/gpt-5.1 | 3 | Standard research questions |
| `deep-research` | openai/gpt-5.2 | 10 | Complex analysis |
| `advanced-deep-research` | anthropic/claude-opus-4-6 | 10 | Maximum depth, institutional-grade |

### Research Tasks (6 Teams)

Each task has a self-contained prompt in `docs/research/`. They can run in parallel:

| File | Team | Status | Priority |
|------|------|--------|----------|
| `team1_hyrox_event_deep_dive.md` | Hyrox Event Analysis & Benchmarking | ✅ Complete | 🔴 Critical |
| `team2_elite_athletes.md` | Elite Athlete Training Methods | ✅ Complete | 🔴 Critical |
| `team3_training_programs.md` | Training Programs & Camps | ✅ Complete | 🟡 High |
| `team4_sports_science.md` | Sports Science & Aerobic Frameworks | ✅ Complete | 🟡 High |
| `team5_periodization_blueprint.md` | 16-Week Periodization Blueprint | ✅ Complete | 🔴 Critical |
| `team6_engineering.md` | RAG System & AI Coach Architecture | ✅ Complete | 🟡 High |

**Execution order:**
- **Wave 1** (parallel): Teams 1, 2, 3, 4
- **Wave 2** (after Wave 1): Team 5 synthesizes all research
- **Wave 3** (overlaps Wave 2): Team 6 builds the system

### Research Task Process
1. Read the research task prompt from `docs/research/team{N}.md`
2. Run the prompt through Perplexity using `advanced-deep-research` preset
3. Save raw output to `docs/research/completed/`
4. Review and validate — check for hallucinations, missing sections
5. Chunk and prepare for embedding into RAG knowledge base

## AI Inference

### Platform: xAI Grok 4.1 Fast Reasoning

Integrated via Vercel AI SDK (`@ai-sdk/xai`). Configuration in [src/lib/ai/xai.ts](src/lib/ai/xai.ts).

**Training Data** (historical, used for prompt tuning): 924 examples (v2) in JSONL format
- Located at `docs/training-data/raw/*.jsonl` and `docs/training-data/combined/all.jsonl`

### API Keys

All API keys are stored in `.env.local` (gitignored). Required keys:

| Service | Env Variable | Notes |
|---------|-------------|-------|
| xAI | `XAI_API_KEY` | Coach K chat + plan extraction |
| OpenAI | `OPENAI_API_KEY` | Embeddings only (text-embedding-3-small) |
| Perplexity | `PERPLEXITY_API_KEY` | Research only |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server |

## Project File Structure

```
hyrox-ai-coach/
├── CLAUDE.md                          # This file — project context for Claude Code
├── docs/
│   ├── research/                      # Research task prompts (one per team)
│   │   ├── team1_hyrox_event_deep_dive.md
│   │   ├── team2_elite_athletes.md
│   │   ├── team3_training_programs.md
│   │   ├── team4_sports_science.md
│   │   ├── team5_periodization_blueprint.md
│   │   ├── team6_engineering.md
│   │   └── completed/                # Raw research outputs (15 files, ~92K words)
│   ├── chunks/
│   │   └── all_chunks.json           # 239 RAG-ready chunks
│   ├── training-data/
│   │   ├── raw/                      # 11 JSONL files, 729 examples
│   │   └── combined/                 # train.jsonl, eval.jsonl, all.jsonl
│   ├── evaluation/                   # Test results and reports
│   └── architecture/
│       ├── build_plan.md             # Full execution plan
│       ├── nebius-finetuning-guide-PROJECT.md     # (Legacy) Nebius reference — no longer used
│       ├── model_selection.md         # Original model analysis
│       └── system_design.md           # Full system architecture + data flows
├── scripts/
│   ├── perplexity_research.py         # Research runner via Perplexity API
│   ├── chunk_research.py             # Semantic chunker for RAG
│   ├── combine_training_data.py      # Combines JSONL into train/eval split
│   └── test_coach_k.py              # 43-prompt evaluation suite
└── src/
    ├── app/
    │   ├── (app)/                     # Authenticated app shell (dashboard, coach, training, performance, profile)
    │   ├── api/                       # API routes (chat, conversations, workouts, training-plans, dashboard, etc.)
    │   ├── auth/callback/             # Supabase auth callback handler
    │   └── (auth)/                    # Login, signup pages
    ├── components/
    │   ├── coach/                     # Chat message, input, sidebar, plan card, plan review modal
    │   ├── training/                  # Week calendar, draggable/droppable workout cards
    │   ├── providers/                 # React Query provider
    │   └── ui/                        # shadcn/ui primitives (21 components)
    ├── hooks/                         # React Query hooks (conversations, workouts, training-plans, dashboard)
    ├── stores/                        # Zustand stores (coach-store)
    └── lib/
        ├── coach/                     # AI pipeline (SSE streaming, RAG, plan extraction schema)
        └── supabase/                  # Client, server, middleware helpers + generated types
```

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-02-13 | Hybrid RAG + Fine-Tuning architecture | Each layer solves what the other can't |
| 2025-02-13 | Supabase for all backend | PGVector + PostgreSQL + Auth in one platform |
| 2025-02-13 | Perplexity advanced-deep-research for research | Claude Opus 4.6 with 10-step web research via API |
| 2025-02-13 | Build fine-tuning from day one | Collect training data immediately, no reason to phase it |
| 2025-02-13 | text-embedding-3-small for embeddings | 1536 dim, good quality/cost balance for coaching content |
| 2026-02-13 | Switched to Grok 4.1 Fast Reasoning via xAI | Replaced Nebius Llama 3.3 70B LoRA. Better reasoning, simpler infra (no fine-tuning needed). |
| 2026-02-15 | Next.js 16 + Tailwind v4 + shadcn/ui + B0 design system | Dark-mode mobile-first design, Hyrox caution-stripe aesthetic |
| 2026-02-16 | React Query + Zustand for state | Server state caching + localStorage-persisted UI state |
| 2026-02-16 | @dnd-kit for training calendar | Drag-and-drop workout rescheduling within weekly calendar |

## Current Build Status

All phases complete and deployed:
- **Research**: 15 outputs, ~92K words, 239 RAG chunks embedded in Supabase PGVector
- **Inference**: Grok 4.1 Fast Reasoning via xAI (replaced Nebius Llama 3.3 70B LoRA)
- **Evaluation**: 83% (273/330 checks) with tuned prompt
- **Frontend**: Full-stack Next.js app with auth, AI coach chat, training calendar, dashboard, workout logging
- **Integration**: Cross-page data flow via React Query, chat persistence, plan acceptance from coach
- **Deployment**: Live at hyrox-ai-coach.netlify.app
