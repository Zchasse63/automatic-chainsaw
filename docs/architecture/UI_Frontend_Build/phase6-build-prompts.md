# Phase 6: Claude Code Build Prompts — Hyrox AI Coach

> **Role**: You are a prompt engineer creating the sequenced build prompts that will be fed to Claude Code to implement the Hyrox AI Coach application. Each prompt must be self-contained with all necessary context, because Claude Code starts fresh each session. Your job is to take the outputs from Phases 1-5 and convert them into actionable, unambiguous build instructions. You are in planning mode — produce the prompt documents, not the code itself.

---

## Project Context (include in every prompt as context header)

The Hyrox AI Coach is a full-featured training application for Hyrox athletes built with:
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Components**: Kokonut UI + Kokonut UI Pro + shadcn/ui + Recharts + TanStack Table
- **Backend**: Next.js API routes + Supabase (PostgreSQL, Auth, PGVector)
- **AI**: Fine-tuned Llama 3.3 70B on Nebius (OpenAI-compatible API) + RAG via PGVector
- **Deployment**: Vercel

The project lives at `/Users/zach/Desktop/hyrox-ai-coach/`.

---

## Build Sequence

The prompts should follow this build order. Each prompt depends on the outputs of previous prompts. Design them so Claude Code can execute them sequentially with clear handoff points.

### Prompt 1: Project Scaffold & Configuration
**What it does**: Initialize the Next.js project, install all dependencies, configure Tailwind, set up project structure, configure environment variables, set up Supabase client utilities.

**Should include**:
- Exact `npx create-next-app` command with correct flags
- All `npm install` commands for every dependency:
  - Kokonut UI (shadcn CLI registry setup)
  - shadcn/ui components to install
  - `openai` SDK, `@supabase/supabase-js`, `@supabase/ssr`
  - Recharts, TanStack Table, sonner, react-day-picker
  - Motion (framer-motion successor)
  - Any other deps from Phase 4/5
- Tailwind CSS v4 configuration (Kokonut-compatible)
- TypeScript strict config
- Project directory structure (from Phase 5 route map)
- Environment variable setup (.env.local template)
- Supabase client utilities (server client, client client, middleware client)
- ESLint/Biome config
- The Kokonut `.cursorrules` conventions (if applicable)

**Acceptance criteria**: `npm run dev` works. All dependencies installed. Project structure matches the route map from Phase 5.

### Prompt 2: Database Migration & Seed Data
**What it does**: Execute the complete SQL migration against Supabase, then seed reference data.

**Should include**:
- The complete SQL migration file from Phase 2
- The seed data SQL from Phase 3
- Instructions for how to run it (Supabase SQL editor, or `supabase db push`, or migration files)
- Verification queries to confirm tables exist with correct schemas
- Verification that RLS policies are active
- Verification that seed data is populated (station count, exercise count, etc.)
- Reminder: DO NOT modify `knowledge_chunks` table or existing RPC functions

**Acceptance criteria**: All tables created. RLS policies active. Reference data seeded. `knowledge_chunks` untouched.

### Prompt 3: Authentication & Profile Flow
**What it does**: Implement Supabase Auth with Next.js middleware, login/signup pages, and the onboarding flow.

**Should include**:
- Supabase Auth configuration (providers to enable)
- Next.js middleware for route protection
- Auth pages using Kokonut Pro Login components
- Onboarding multi-step form (from Phase 5 Screen 1 spec)
- Profile CRUD API routes (from Phase 4)
- Auto-redirect logic: auth → check profile exists → onboarding or dashboard
- Auth context/hooks for client components

**Acceptance criteria**: User can sign up, complete onboarding, and be redirected to dashboard. Profile data persists in Supabase.

### Prompt 4: AI Coaching Chat — Core Pipeline
**What it does**: Implement the complete coaching pipeline (the most critical feature). This is the RAG → embed → search → prompt → stream → log flow.

**Should include**:
- The complete coaching pipeline from the handoff doc (all 9 steps, exact code)
- The system prompt (exact text — DO NOT modify)
- The `POST /api/chat` endpoint with SSE streaming
- Conversation CRUD endpoints
- Message feedback endpoint
- Context formatting function
- Athlete profile injection function
- Error handling for Nebius (cold start, 503, 429, 500, timeout)
- Error handling for OpenAI embeddings (fallback to no-RAG)
- Token usage logging

**Should NOT include** (yet): The frontend chat UI. This prompt builds the API layer only.

**Acceptance criteria**: Can hit `POST /api/chat` with a curl/Postman request and get a streaming Coach K response. Response is grounded in RAG context. Token counts logged to messages table. Smoke test passes (sled push technique, herniated disc refusal, clarifying questions for vague requests).

### Prompt 5: AI Coach Chat — Frontend UI
**What it does**: Build the complete chat interface using Kokonut AI components.

**Should include**:
- Phase 5 Screen 3 spec (full component tree, all states, interactions)
- Kokonut components to use: AI Input Selector, AI State Loading, AI Text Loading, AI Voice, Smooth Drawer
- Custom components to build: Chat message bubbles, message list, streaming text renderer, conversation sidebar
- SSE consumption on the frontend (ReadableStream parsing)
- Auto-scroll behavior
- Markdown rendering in coach responses
- Quick-action suggestion chips
- Conversation creation and switching
- Loading/empty/error states
- Cold start UX ("Coach K is warming up...")
- Mobile responsive behavior

**Acceptance criteria**: Full chat experience works end-to-end. Streaming tokens appear smoothly. Conversation history persists. Cold start is handled gracefully. Mobile layout works.

### Prompt 6: Dashboard
**What it does**: Build the dashboard home screen.

**Should include**:
- Phase 5 Screen 2 spec
- Dashboard aggregate API endpoint (from Phase 4)
- Kokonut components: Bento Grid, Apple Activity Card, Animated List (Pro), Dynamic Text
- Custom components: Race countdown, stat/metric cards, training streak
- @number-flow/react for animated number displays
- Empty state for new users
- Responsive layout (bento grid reflow for mobile)

**Acceptance criteria**: Dashboard loads with real data from Supabase. Shows today's workout, race countdown, weekly stats. Empty state works for new users.

### Prompt 7: Workout Logging
**What it does**: Build the workout logger and workout history.

**Should include**:
- Phase 5 Screen 5 spec (Workout Logger)
- Workout CRUD API endpoints (from Phase 4)
- Quick log mode + detailed log mode
- Timer component (custom build)
- RPE slider with labels
- Session type selector
- Calendar view of training history
- Integration with training plan (pre-populate from plan day)
- PR detection on save (compare against personal_records)
- Celebration animation on new PR (canvas-confetti)

**Acceptance criteria**: User can log a workout (both quick and detailed). Data persists. Calendar shows history. New PR detected and celebrated.

### Prompt 8: Training Plans
**What it does**: Build training plan management.

**Should include**:
- Phase 5 Screen 4 spec
- Training plan CRUD API endpoints (from Phase 4)
- Week-by-week view with Smooth Tab
- Day cards with expand/collapse
- Completion status tracking
- "Log this workout" flow (links to Workout Logger with pre-populated data)
- Plan creation (manual or "Ask Coach K" prompt)
- Archive/activate plans

**Acceptance criteria**: User can view their active plan week by week. Can mark days complete. Can launch workout logger from a plan day.

### Prompt 9: Performance & Analytics
**What it does**: Build the data-heavy analytics screens.

**Should include**:
- Phase 5 Screen 6 spec
- Benchmark and PR API endpoints (from Phase 4)
- Recharts integration (line charts, bar charts, radar chart for stations)
- PR board with trend indicators
- Station-by-station breakdown with benchmark comparisons
- Running pace trend charts
- TanStack Table for tabular data (benchmark history)
- Color-coded performance indicators (green/yellow/red vs benchmarks)

**Acceptance criteria**: Charts render with real data. Station breakdown shows all 8 stations. PRs display correctly. Benchmark comparison works.

### Prompt 10: Race Hub
**What it does**: Build race result logging and analysis.

**Should include**:
- Phase 5 Screen 7 spec
- Race result CRUD API endpoints (from Phase 4)
- Race result entry form (with per-station split entry)
- Visual split breakdown (horizontal stacked bar chart)
- Race-over-race comparison
- "Ask Coach K to analyze" integration (opens chat with race data as context)
- Pre-race features (pacing strategy, race day checklist)

**Acceptance criteria**: User can log a full race with splits. Split visualization works. Race comparison works between two races.

### Prompt 11: Goals, Achievements & Profile
**What it does**: Build the remaining screens — goals, achievements, profile settings.

**Should include**:
- Phase 5 Screen 8 spec (Profile & Settings)
- Goals CRUD API endpoints (from Phase 4)
- Achievement checking logic
- Achievement badge grid
- Goal creation and tracking
- Profile edit form (Kokonut Pro Form 06)
- Settings (units, theme toggle, notifications, data export, delete account)

**Acceptance criteria**: User can create/track goals. Achievements display correctly. Profile editable. Theme toggle works. Account deletion works.

### Prompt 12: Polish, Testing & Deployment
**What it does**: Final pass — navigation, responsive testing, error states, deployment config.

**Should include**:
- Global navigation (Morphic Navbar for desktop, bottom tabs for mobile)
- Page transitions and animations (from Phase 5 Animation Spec)
- Responsive testing checklist (all screens at mobile/tablet/desktop)
- Error boundary setup
- Loading state audit (every screen has proper loading state)
- Empty state audit (every screen has proper empty state)
- Vercel deployment configuration
- Environment variable setup in Vercel
- Smoke test checklist (the 3 tests from the handoff doc + full user flow)

**Acceptance criteria**: Full user flow works: sign up → onboard → chat with coach → log workout → view dashboard → check performance → log race → set goal. Works on mobile. Deploys to Vercel.

---

## Prompt Engineering Guidelines

When creating each prompt for Claude Code, follow these rules:

1. **Include all relevant context inline** — Don't reference "Phase 2 output" by name. Paste the actual SQL, the actual component spec, the actual API contract into the prompt.

2. **Be explicit about file paths** — Tell Claude Code exactly where to create each file (`app/api/chat/route.ts`, `components/coach/ChatMessageList.tsx`, etc.)

3. **Specify library versions** — Don't say "install Recharts." Say `npm install recharts@2.x` with the version you validated.

4. **Include the "DO NOT" list** — Every prompt should remind Claude Code: don't modify knowledge_chunks, don't modify the system prompt, don't use OpenAI for coaching, don't change temperature/max_tokens.

5. **Define acceptance criteria** — Every prompt ends with testable criteria so Claude Code (and Zach) can verify the work.

6. **Handle the .env file** — The project already has a `.env` file with all API keys. Reference it but never include keys in prompts.

7. **Reference previous prompt outputs** — If Prompt 5 depends on API routes from Prompt 4, include a brief summary of what was built in Prompt 4 so Claude Code has context.

8. **One concern per prompt** — Each prompt should be completable in a single Claude Code session without hitting context limits. If a prompt is getting too long, split it.

---

## Deliverables

### Deliverable: 12 Standalone Build Prompts
Each prompt is a self-contained markdown document that can be pasted directly into a Claude Code session. Each includes:
- Context header (project overview, tech stack, constraints)
- Specific task description
- All reference material inline (schemas, component specs, API contracts, code examples)
- File paths for every file to create/modify
- Acceptance criteria
- "DO NOT" reminders

### Deliverable: Build Sequence Checklist
A single-page checklist tracking which prompts have been executed and their status:
- [ ] Prompt 1: Scaffold _(creates project)_
- [ ] Prompt 2: Database _(creates tables)_
- [ ] ... and so on through Prompt 12

### Deliverable: Dependency Map
A document showing which prompts depend on which prior prompts, so if something needs to be re-run, we know the cascade.
