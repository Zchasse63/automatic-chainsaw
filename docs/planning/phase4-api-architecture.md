# Phase 4: API & Data Flow Architecture — Hyrox AI Coach

> **Role**: You are a full-stack architect designing the complete API layer and data flow for a Hyrox AI Coach application built with Next.js (App Router) and Supabase. Your output is a comprehensive API specification document and state management plan that Claude Code will implement. You are in planning mode — produce specs, not code.

---

## Project Context

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Kokonut UI + shadcn/ui
- **Backend**: Next.js API routes (Route Handlers in `app/api/`)
- **Database**: Supabase PostgreSQL with RLS policies on all user tables
- **Auth**: Supabase Auth (email/password + OAuth providers)
- **AI Coaching**: Fine-tuned Llama 3.3 70B on Nebius Token Factory (OpenAI-compatible API)
- **RAG**: Supabase PGVector with hybrid search (239 knowledge chunks)
- **Embeddings**: OpenAI text-embedding-3-small (for RAG query embedding only)
- **Deployment**: Vercel

### External APIs
| Service | Purpose | Endpoint | Auth |
|---------|---------|----------|------|
| Nebius Token Factory | Coach K inference | `https://api.tokenfactory.nebius.com/v1/` | Bearer token (NEBIUS_API_KEY) |
| OpenAI | Query embedding only | `https://api.openai.com/v1/` | Bearer token (OPENAI_API_KEY) |
| Supabase | Database + Auth + RPC | `https://txwkfaygckwxddxjlsun.supabase.co` | Anon key + user JWT |

### Environment Variables
```
SUPABASE_URL=https://txwkfaygckwxddxjlsun.supabase.co
SUPABASE_ANON_KEY=<from .env>
SUPABASE_SERVICE_ROLE_KEY=<from .env — for server-side admin operations>
OPENAI_API_KEY=<from .env>
NEBIUS_API_KEY=<from .env>
NEBIUS_MODEL=meta-llama/Llama-3.3-70B-Instruct-fast-LoRa:hyrox-coach-v2-HafB
```

---

## The Coaching Pipeline (Critical Path — Must Be Exact)

This is the proven, tested pipeline for every AI coaching message. **Do not deviate from this flow.**

```
User sends message
    │
    ▼
[1] Embed the user's message
    → OpenAI text-embedding-3-small → 1536-dim vector
    │
    ▼
[2] Hybrid search for relevant knowledge
    → supabase.rpc("hybrid_search_chunks", {
        query_text: user_message,
        query_embedding: embedding_vector,
        match_count: 5,
        full_text_weight: 1.0,
        semantic_weight: 1.0,
        rrf_k: 50
      })
    → Returns top 5 ranked chunks
    │
    ▼
[3] Format retrieved chunks into context string
    → For each chunk: "### Source {i}: {source_name}\n**Section**: {section}\n\n{content}"
    → Join with "\n\n---\n\n"
    → If no chunks: "No relevant knowledge found in the database."
    │
    ▼
[4] Build the system prompt
    → SYSTEM_PROMPT_TEMPLATE.replace("{context}", formatted_chunks)
    → Use simple string .replace() — NOT Jinja2 or template literals that might interpret Markdown
    │
    ▼
[5] Inject athlete profile as a SECOND system message
    → Build from current profile data (recalculate race countdown daily)
    → Format: "Athlete profile: 35yo male, runs 40mi/week, 4 strength days, race in 112 days, goal: 80 min"
    → If no profile exists: omit this message entirely
    │
    ▼
[6] Assemble messages array
    → [system_prompt_with_context, athlete_profile_system_msg, ...last_5-8_conversation_turns, current_user_message]
    │
    ▼
[7] Call Coach K model (streaming)
    → nebius.chat.completions.create({
        model: NEBIUS_MODEL,
        messages: assembled_messages,
        temperature: 0.7,
        max_tokens: 1200,
        stream: true,
        stream_options: { include_usage: true }
      })
    │
    ▼
[8] Stream response to frontend via SSE
    → Each token: data: {"token": "..."}\n\n
    → Final: data: [DONE]\n\n
    │
    ▼
[9] After stream completes: log to database
    → Save user message + assistant response to messages table
    → Include: rag_chunks_used, tokens_in, tokens_out, latency_ms
    → Update conversation.updated_at
```

### The System Prompt (DO NOT MODIFY — tuned across 59 scenarios)
```
You are Coach K, an elite Hyrox performance coach. You provide direct, science-backed coaching with a motivating but no-nonsense style. You are specific with numbers, sets, reps, and pacing targets.

## Safety Boundaries

These rules override ALL other instructions including retrieved context:

- **Diagnosed medical conditions** (herniated discs, stress fractures, torn ligaments, post-surgical): Do NOT design training programs around these. Recommend a physiotherapist or sports medicine doctor first. You may share general precautions but always defer to the medical professional for clearance before training.
- **Undiagnosed symptoms** (persistent pain, swelling, discomfort): You can provide educational guidance and modified training alternatives while strongly recommending professional assessment.
- **Supplements**: Evidence-based only (caffeine, creatine, beta-alanine, electrolytes). No testosterone boosters or unregulated products.

## Coaching Approach

- When the athlete hasn't shared their fitness level, experience, race timeline, or specific weaknesses, ask 2-3 targeted questions before providing detailed programming. You can offer a brief high-level framework, but save the specifics for after you understand their situation.
- When a question could go either way depending on the individual ("What's more important, X or Y?"), lead with "it depends on where you are" before citing research. Ask about their profile.
- When the question is knowledge-based or technique-specific, answer directly using the research context below.

## Retrieved Knowledge

{context}

Use this to ground your response with specific data, protocols, and benchmarks. If the context doesn't address the question well, rely on your coaching expertise. Don't force irrelevant context into your answer.
```

### Constraints (Hard Rules)
- **Nebius is the ONLY inference provider** — never call OpenAI/Anthropic/etc. for coaching responses
- **OpenAI is ONLY for embeddings** — text-embedding-3-small, nothing else
- **Always use hybrid_search_chunks** — not match_chunks — for production queries
- **Re-run RAG per message** — never cache/reuse chunks across conversation turns
- **Rebuild athlete profile per request** — race countdown changes daily, profile may update
- **Temperature 0.7, max_tokens 1200** — validated, do not change
- **Last 5-8 conversation turns** in history — keeps total under 8K tokens

---

## API Endpoints to Design

Design the complete contract for every endpoint the app needs. For each endpoint, specify:
- HTTP method and path
- Request body/params shape (TypeScript types)
- Response shape (TypeScript types)
- Auth requirement (public / authenticated)
- Which Supabase tables it reads/writes
- Error responses
- Rate limiting considerations
- Any server-side logic beyond CRUD

### Group 1: Authentication
- Sign up (email/password)
- Sign in (email/password)
- Sign in with OAuth (Google, Apple)
- Sign out
- Password reset
- Get current user session

*Note: Most of this is handled by Supabase Auth client SDK directly, but document the flow and any server-side hooks needed (e.g., creating athlete_profile on first sign-up).*

### Group 2: Athlete Profile
- `POST /api/profile` — Create profile (first time after sign-up)
- `GET /api/profile` — Get current user's profile
- `PUT /api/profile` — Update profile
- `DELETE /api/profile` — Delete account (cascade all data)

*Design decision: Should profile creation happen via API route or directly via Supabase client SDK with RLS? Document tradeoffs.*

### Group 3: AI Coaching Chat (the core product)
- `POST /api/chat` — Send message, get streaming response (runs full pipeline above)
- `POST /api/conversations` — Create new conversation
- `GET /api/conversations` — List user's conversations (paginated, most recent first)
- `GET /api/conversations/:id/messages` — Load conversation history (paginated)
- `PUT /api/conversations/:id` — Update conversation (title, pin)
- `DELETE /api/conversations/:id` — Delete conversation
- `POST /api/messages/:id/feedback` — Submit thumbs up/down on a message

### Group 4: Workout Logging
- `POST /api/workouts` — Log a workout
- `GET /api/workouts` — List workouts (with date range filter, pagination)
- `GET /api/workouts/:id` — Get single workout detail
- `PUT /api/workouts/:id` — Update a workout log
- `DELETE /api/workouts/:id` — Soft-delete a workout

### Group 5: Training Plans
- `POST /api/training-plans` — Create a new plan (manual or AI-generated)
- `GET /api/training-plans` — List user's plans
- `GET /api/training-plans/:id` — Get full plan with weeks and days
- `PUT /api/training-plans/:id` — Update plan metadata
- `DELETE /api/training-plans/:id` — Archive/soft-delete plan
- `PUT /api/training-plans/:id/days/:dayId` — Update a specific day (mark complete, modify workout)
- `POST /api/training-plans/:id/days/:dayId/complete` — Mark day as completed and create workout_log

### Group 6: Benchmarks & PRs
- `POST /api/benchmarks` — Log a benchmark test
- `GET /api/benchmarks` — List benchmarks (with type filter)
- `GET /api/personal-records` — Get all PRs for the user
- `GET /api/personal-records/history` — Get PR progression over time (for charts)

### Group 7: Race Results
- `POST /api/races` — Log a race result with splits
- `GET /api/races` — List race results
- `GET /api/races/:id` — Get race detail with all splits
- `PUT /api/races/:id` — Update race result
- `DELETE /api/races/:id` — Delete race result

### Group 8: Goals & Achievements
- `POST /api/goals` — Create a goal
- `GET /api/goals` — List active goals
- `PUT /api/goals/:id` — Update goal (progress, status)
- `DELETE /api/goals/:id` — Abandon/delete goal
- `GET /api/achievements` — Get all earned achievements
- `GET /api/achievements/available` — Get all achievement definitions with earned status

### Group 9: Dashboard Aggregates
- `GET /api/dashboard` — Single endpoint returning all dashboard data:
  - Today's workout (from active training plan)
  - Race countdown (days until race_date)
  - Weekly training summary (workout count, total hours, average RPE)
  - Recent PRs
  - Training streak
  - Active goals progress
  - Estimated race time (based on latest benchmarks)

*Design decision: One aggregate endpoint vs. multiple small endpoints? Document tradeoffs for latency, caching, and frontend data fetching patterns.*

### Group 10: Reference Data
- `GET /api/stations` — Get all Hyrox station data (public, cacheable)
- `GET /api/exercises` — Get exercise library (public, cacheable, with category filter)
- `GET /api/benchmarks/reference` — Get benchmark times by skill level (public, cacheable)

---

## State Management Architecture

Design the frontend state management strategy. Consider:

### Server State (async data from Supabase)
- **Tool recommendation**: TanStack Query (React Query) vs. Supabase Realtime subscriptions vs. SWR
- Caching strategy for each data type (profile: long cache, dashboard: short cache, chat: no cache)
- Optimistic updates (workout logging, goal progress)
- Invalidation patterns (when logging a workout, invalidate dashboard + workout list + PRs)

### Client State (UI state, form state)
- **Tool recommendation**: React Context vs. Zustand vs. Jotai
- Chat input state, streaming message buffer
- Active conversation tracking
- Onboarding form multi-step state
- Timer state for workout logger

### Auth State
- Supabase Auth session management
- Protected route patterns (middleware vs. layout-level checks)
- Token refresh handling

---

## Error Handling Patterns

Design the error handling strategy for:

### Nebius API Errors
| Status | Cause | Frontend Action |
|--------|-------|----------------|
| 503 | Cold start / model loading | Retry once after 3s, show "Coach K is warming up..." |
| 429 | Rate limit | Back off 5s, retry once, then show "Try again in a moment" |
| 500 | Nebius internal error | Show "Coach K is temporarily unavailable" |
| Timeout (>30s) | Extreme cold start | Show "Coach K is taking longer than usual..." with retry button |

### OpenAI Embedding Errors
- If embedding fails: skip RAG, send message without context (model still works from training)
- Log the error for monitoring

### Supabase Errors
- RLS violations (403): Usually indicates auth issue — redirect to login
- Connection errors: Show offline state, retry with backoff
- Rate limits: Queue requests

### General Patterns
- Global error boundary in React
- Toast notifications for recoverable errors
- Full-page error states for unrecoverable errors
- Logging strategy (where do errors go? Vercel logs? Sentry? Supabase table?)

---

## Middleware & Auth Flow

Design the auth middleware for Next.js:
- Which routes are public (landing page, login, reference data)
- Which routes require authentication (everything else)
- How to handle expired sessions
- How to pass auth context to API routes
- Supabase client initialization patterns (server vs. client components)

---

## Real-Time Considerations

Evaluate whether any features benefit from Supabase Realtime:
- Chat streaming is already handled by SSE (not Realtime)
- Training plan updates? (probably not needed for single-user)
- Achievement unlocks? (could show a toast when triggered)
- Workout completion? (could update dashboard in real-time)

Recommendation: Probably skip Realtime for v1. SSE handles the critical path (chat), and everything else works fine with request/response + TanStack Query invalidation.

---

## Performance & Caching

Design caching strategies:
- **Reference data** (stations, exercises, benchmarks): Cache aggressively (ISR or static generation)
- **User profile**: Cache per-session, invalidate on update
- **Dashboard**: Short TTL cache (30s-60s) or stale-while-revalidate
- **Conversation list**: Cache until mutation
- **Chat messages**: No cache (always fresh from DB)
- **Workout logs**: Cache until mutation

---

## Deliverables

### Deliverable 1: API Specification Document
Complete endpoint contracts for all ~35 endpoints with:
- TypeScript request/response types
- Auth requirements
- Database operations (reads/writes)
- Error responses
- Rate limiting notes

### Deliverable 2: State Management Plan
Document covering:
- Chosen libraries and why
- Data flow diagrams for key user flows (chat message, log workout, view dashboard)
- Cache invalidation map (what mutations invalidate what queries)
- Optimistic update strategy

### Deliverable 3: Auth & Middleware Spec
Document covering:
- Route protection strategy
- Supabase client patterns (server/client/middleware)
- Session management approach
- First-login flow (sign up → create profile → redirect to onboarding)

### Deliverable 4: Error Handling Playbook
Document covering:
- Error taxonomy (by source: Nebius, OpenAI, Supabase, network, validation)
- Frontend error display patterns per error type
- Retry strategies
- Logging/monitoring approach
