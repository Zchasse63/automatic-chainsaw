# Hyrox AI Coach — Frontend Build Plan

> **Status:** Ready to execute
> **Total phases:** 13 (B0–B12)
> **Design System:** B0-design-system.md (complete)
> **Visual Identity:** Raw Industrial Meets Precision Coaching

---

## Research → Build Phase Mapping

The research phases (Phase 1–6) produced the knowledge base. The build phases (B0–B12) are the execution plan. Here's how they map:

| Research Phase | What It Produced | Used In Build Phase(s) |
|---------------|-----------------|----------------------|
| Phase 1: Kokonut UI Audit | Component inventory, 4-layer architecture, gap analysis | B0, B1 |
| Phase 2: Database Schema | PostgreSQL schema, RLS policies, indexes | B2 |
| Phase 3: Seed Data | Reference tables, benchmarks, exercise library | B2 |
| Phase 4: API Architecture | 9-step coaching pipeline, all endpoints, state management | B4, B5 |
| Phase 5: Frontend Specs | Screen-by-screen blueprints (9 screens) | B3, B5–B11 |
| Phase 6: Build Prompts | Sequenced build instructions, dependency map | B1–B12 |
| Design System Research | Typography, animation, atmosphere, differentiation | B0 |

---

## Build Phase Overview

```
B0  Design System & Tokens          ← YOU ARE HERE
B1  Project Scaffold & Config
B2  Database Migration & Seed Data
B3  Authentication & Onboarding
B4  AI Coach Pipeline (Backend)
B5  AI Coach Chat UI
B6  Dashboard
B7  Workout Logger
B8  Training Plans
B9  Performance & Analytics
B10 Race Hub
B11 Profile, Settings & Goals
B12 Polish, Testing & Deploy
```

---

## Dependency Map

```
B0: Design System
├── No dependencies (design spec complete)
│
B1: Scaffold
├── Depends on: B0 (design tokens, fonts, theme configuration)
│
B2: Database
├── Depends on: B1 (project exists, Supabase client utils)
│
B3: Auth & Onboarding
├── Depends on: B1 (project structure, Supabase clients)
├── Depends on: B2 (athlete_profiles table, RLS policies)
│
B4: AI Coach Pipeline
├── Depends on: B1 (project structure, env vars, OpenAI SDK)
├── Depends on: B2 (conversations, messages, knowledge_chunks tables)
├── Depends on: B3 (auth middleware, user session)
│
B5: AI Coach Chat UI
├── Depends on: B1 (Kokonut UI components)
├── Depends on: B3 (auth context)
├── Depends on: B4 (chat API endpoints)
│
B6: Dashboard
├── Depends on: B1 (Kokonut UI, @number-flow/react)
├── Depends on: B2 (all data tables)
├── Depends on: B3 (auth, profile)
│
B7: Workout Logger
├── Depends on: B1 (components, canvas-confetti)
├── Depends on: B2 (workout_sessions, exercises, personal_records)
├── Depends on: B3 (auth)
│
B8: Training Plans
├── Depends on: B2 (training_plans tables)
├── Depends on: B3 (auth)
├── Soft: B7 (links to workout logger)
│
B9: Performance & Analytics
├── Depends on: B1 (Recharts, TanStack Table)
├── Depends on: B2 (benchmarks, personal_records)
├── Depends on: B3 (auth)
├── Soft: B7 (workout data to chart)
│
B10: Race Hub
├── Depends on: B2 (race_results, race_splits)
├── Depends on: B3 (auth)
├── Soft: B4 (chat for race analysis)
│
B11: Profile, Settings & Goals
├── Depends on: B2 (goals, achievements tables)
├── Depends on: B3 (auth, profile)
│
B12: Polish & Deploy
├── Depends on: ALL previous phases
```

### Parallelization Opportunities

After B3 (Auth) completes, the following can be built in parallel:
- **Track A**: B4 → B5 (AI Coach backend → frontend)
- **Track B**: B6 (Dashboard)
- **Track C**: B7 → B8 (Workout Logger → Training Plans)

After B7 completes:
- **Track D**: B9 (Analytics) and B10 (Race Hub) can run in parallel

B11 can start anytime after B3.

---

## Phase Details

### B0: Design System & Tokens
**Status:** COMPLETE
**Document:** [B0-design-system.md](B0-design-system.md)
**Deliverables:**
- [x] Visual identity: "Raw Industrial Meets Precision Coaching"
- [x] Color system: 6-level surface elevation, accent, semantic, station, performance, border colors
- [x] Typography: Barlow Condensed (display) + IBM Plex Sans (body) + JetBrains Mono (data)
- [x] Typographic scale: Major Third 1.250
- [x] Spacing: 4px grid, responsive breakpoints, sharp border radii (2px default)
- [x] Shadow system: dark mode elevation + accent glows
- [x] Atmosphere: grain texture, gradients, glassmorphism rules, industrial elements
- [x] Animation strategy: 3 easing curves, 4 spring configs, page load/scroll/micro-interaction/data/celebration/transition specs
- [x] Performance budget: mobile animation limits, reduced motion support
- [x] Iconography: Lucide React with station mapping
- [x] Signature element: The Station Rail (8-segment Hyrox progress)
- [x] Component architecture: 4-layer model, 12 custom components identified

---

### B1: Project Scaffold & Configuration
**Input:** B0-design-system.md, Phase 1 (Kokonut audit), Phase 6 (Prompt 1)
**Deliverables:**
- [ ] Next.js 16 project with App Router, TypeScript strict, Tailwind CSS v4
- [ ] All dependencies installed (Motion, Recharts, TanStack Table, Supabase, OpenAI, Lucide, etc.)
- [ ] shadcn/ui initialized with Kokonut UI registry configured
- [ ] shadcn base components installed (button, card, dialog, input, etc.)
- [ ] Kokonut UI free components installed (AI Input, Bento Grid, Smooth Tab, etc.)
- [ ] `globals.css` with full `@theme` configuration from B0 design tokens
- [ ] Google Fonts configured: Barlow Condensed, IBM Plex Sans, JetBrains Mono
- [ ] Directory structure: `src/app/`, `src/components/`, `src/lib/`, `src/hooks/`, `src/types/`
- [ ] Supabase client utilities (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- [ ] Environment variables template (`.env.local.example`)
- [ ] `lib/motion.ts` — shared animation constants (easing curves, spring configs)
- [ ] `lib/utils.ts` — `cn()` helper
- [ ] Biome configuration
- [ ] Verify: `npm run dev` starts clean, design tokens visible, fonts loading

**Acceptance criteria:** Project runs, design tokens render correctly, all fonts load, Kokonut components install without errors.

---

### B2: Database Migration & Seed Data
**Input:** Phase 2 (schema), Phase 3 (seed data)
**Deliverables:**
- [ ] All tables created in Supabase: `athlete_profiles`, `conversations`, `messages`, `workout_sessions`, `exercises`, `personal_records`, `training_plans`, `plan_weeks`, `plan_days`, `race_results`, `race_splits`, `goals`, `achievements`
- [ ] Reference tables: `hyrox_stations`, `benchmarks`, `exercise_library`
- [ ] RLS policies on all tables (user can only access own data)
- [ ] Indexes on foreign keys and commonly queried columns
- [ ] Seed data: 8 Hyrox stations with weights per division, benchmark times by level, exercise library
- [ ] Verify: `knowledge_chunks` table and existing RPC functions are NOT modified (already in production)

**Acceptance criteria:** All tables exist, RLS policies active, seed data verified (8 stations, benchmarks populated, exercise library populated).

---

### B3: Authentication & Onboarding
**Input:** Phase 5 (Screens 0-1), Phase 6 (Prompt 3)
**Deliverables:**
- [ ] Supabase Auth integration (email + OAuth: Google, Apple)
- [ ] Auth pages: Login, Register, Forgot Password (using Kokonut Pro Login components)
- [ ] Auth middleware protecting `/app/*` routes
- [ ] Multi-step onboarding flow (Kokonut Pro Form 04):
  - Step 1: Basic info (name, age, gender)
  - Step 2: Running background (weekly mileage, recent race times)
  - Step 3: Hyrox experience (previous races, target division)
  - Step 4: Equipment access (gym facilities, available equipment)
  - Step 5: Goals & timeline (target race date, finish time goal)
- [ ] `athlete_profiles` row created on onboarding completion
- [ ] Redirect logic: Unauthenticated → login, Authenticated without profile → onboarding, Complete → dashboard

**Acceptance criteria:** Full auth flow works end-to-end, onboarding creates valid athlete profile, middleware protects routes.

---

### B4: AI Coach Pipeline (Backend)
**Input:** Phase 4 (API architecture), existing RAG setup
**Deliverables:**
- [ ] `POST /api/chat` endpoint implementing the 9-step pipeline:
  1. Receive user message + conversation_id
  2. Embed query via OpenAI text-embedding-3-small
  3. Hybrid search: vector similarity + keyword match on `knowledge_chunks`
  4. Format RAG context (top 5 chunks with relevance scores)
  5. Load athlete profile from Supabase
  6. Assemble system prompt (from Phase 6 tuned prompt) + RAG context + profile
  7. Call Nebius Token Factory (v2 fine-tuned model) via OpenAI-compatible API
  8. Stream response via SSE (Server-Sent Events)
  9. Log message + response to `conversations`/`messages` tables
- [ ] `GET /api/conversations` — list user's conversations
- [ ] `GET /api/conversations/:id` — get conversation with messages
- [ ] `POST /api/conversations` — create new conversation
- [ ] `DELETE /api/conversations/:id` — delete conversation
- [ ] Error handling: Nebius cold start retry (5-10s), rate limiting, auth validation
- [ ] Streaming response format compatible with frontend SSE consumption

**Acceptance criteria:** Smoke tests pass — sled push technique question returns relevant coaching, herniated disc question triggers safety boundary, streaming works in browser dev tools.

---

### B5: AI Coach Chat UI
**Input:** Phase 5 (Screen 3), Phase 6 (Prompt 5)
**Deliverables:**
- [ ] 2-panel layout: conversation sidebar (280px) + chat area (desktop), drawer on mobile
- [ ] Conversation list with create/delete/rename
- [ ] Custom chat message list with user/AI message bubbles
- [ ] Streaming text renderer with word-level fade-in animation (from B0 spec)
- [ ] AI Input Selector (Kokonut) configured as message composer
- [ ] AI State Loading + AI Text Loading for "Coach is thinking..."
- [ ] AI Voice for voice input
- [ ] Markdown rendering in AI responses (react-markdown + remark-gfm)
- [ ] Quick action buttons: "Help me with my sled push", "Build my training plan", etc.
- [ ] Pulsing yellow block cursor during streaming
- [ ] Mobile responsive: full-screen chat with bottom-sheet conversation history

**Acceptance criteria:** Full chat conversation works end-to-end, streaming renders smoothly, conversation history persists, voice input triggers message send.

---

### B6: Dashboard
**Input:** Phase 5 (Screen 2), Phase 6 (Prompt 6)
**Deliverables:**
- [ ] Bento Grid layout (Kokonut) with responsive columns (1/2/4)
- [ ] Race countdown card with animated timer (font-mono, text-timer)
- [ ] Station Rail signature element at top
- [ ] Activity rings (Apple Activity Card — Kokonut) for weekly training metrics
- [ ] Today's workout card with quick-start CTA
- [ ] Recent activity feed (animated list)
- [ ] Quick stat cards with animated counters (@number-flow/react)
- [ ] "Ask Coach K" quick chat shortcut
- [ ] Staggered page load animation (60ms stagger, INDUSTRIAL_SNAP)
- [ ] Hero gradient background with grain texture

**Acceptance criteria:** Dashboard renders all cards with real or seed data, animations play on load, race countdown ticks, responsive on mobile/tablet/desktop.

---

### B7: Workout Logger
**Input:** Phase 5 (Screen 5), Phase 6 (Prompt 7)
**Deliverables:**
- [ ] Quick log mode (minimal: exercise, sets, reps, weight)
- [ ] Detailed log mode (full: exercise, sets, reps, weight, RPE, rest time, notes)
- [ ] Custom timer/stopwatch component (rest timer, workout timer)
- [ ] RPE slider (1-10) with labeled descriptions
- [ ] Exercise picker with search (from exercise_library)
- [ ] Set completion with Hold Button (Kokonut) — press-and-hold to confirm
- [ ] PR detection: auto-detect when a set beats personal_records
- [ ] PR celebration animation (gold flash + badge pop + particles, from B0 spec)
- [ ] Workout summary on completion
- [ ] Save to `workout_sessions` + `exercises` + `personal_records` tables

**Acceptance criteria:** Full workout can be logged (warm-up through cool-down), timer works, PR detected and celebrated, data persists in Supabase.

---

### B8: Training Plans
**Input:** Phase 5 (Screen 4), Phase 6 (Prompt 8)
**Deliverables:**
- [ ] Week/day tabs (Smooth Tab — Kokonut) for plan navigation
- [ ] Expandable workout cards per day (Accordion pattern)
- [ ] Exercise detail: sets, reps, weight, rest, notes, video link placeholder
- [ ] Completion checkmarks per exercise/day
- [ ] "Generate Training Plan" via Coach K chat integration
- [ ] Calendar view (Kokonut Pro Calendar Schedule or react-day-picker)
- [ ] Link to workout logger for today's planned workout
- [ ] Training plan data from `training_plans` / `plan_weeks` / `plan_days` tables

**Acceptance criteria:** Training plan displays correctly for current week, exercises expand with full detail, completion tracking works, calendar shows scheduled workouts.

---

### B9: Performance & Analytics
**Input:** Phase 5 (Screen 6), Phase 6 (Prompt 9)
**Deliverables:**
- [ ] Smooth Tab navigation between analysis views
- [ ] Line charts: running pace trend, training volume over time (Recharts)
- [ ] Bar charts: weekly volume breakdown, station performance (Recharts)
- [ ] Radar chart: 8-station strength profile (Recharts)
- [ ] PR board: sortable table of personal records (TanStack Table)
- [ ] Benchmark comparison: your times vs. Elite/Advanced/Intermediate/Beginner
- [ ] Station breakdown cards with individual trend lines
- [ ] All charts animate on first view (PRECISION_EASE, staggered bars)
- [ ] Animated counter stats for headline numbers

**Acceptance criteria:** Charts render with workout data (or seed data), PR board sorts correctly, benchmark comparison is accurate against seed benchmarks.

---

### B10: Race Hub
**Input:** Phase 5 (Screen 7), Phase 6 (Prompt 10)
**Deliverables:**
- [ ] Race result entry form (total time, individual station splits, run splits)
- [ ] Splits visualization: stacked bar chart showing time per station
- [ ] Race-over-race comparison: side-by-side split tables
- [ ] Race day checklist (customizable, persistent)
- [ ] Pre-race features: target pace calculator, station strategy viewer
- [ ] Integration with Coach K for race analysis ("Analyze my last race")
- [ ] Data tables for split times (TanStack Table)

**Acceptance criteria:** Race results can be entered and displayed, split visualization renders correctly, comparison works between 2+ races.

---

### B11: Profile, Settings & Goals
**Input:** Phase 5 (Screen 8), Phase 6 (Prompt 11)
**Deliverables:**
- [ ] Profile edit form (Kokonut Pro Form 06): name, age, weight, running stats, equipment
- [ ] Goal setting: target race, finish time goal, weekly mileage target
- [ ] Achievement badges: PR milestones, streak tracking, training consistency
- [ ] Settings: dark/light theme toggle (Switch Button — Kokonut), notification prefs
- [ ] Data export: download training history as CSV
- [ ] Account management: password change, sign out, delete account (with confirmation)

**Acceptance criteria:** Profile edits persist, goals display on dashboard, theme toggle works, data export downloads valid CSV.

---

### B12: Polish, Testing & Deploy
**Input:** All previous phases
**Deliverables:**
- [ ] Global navigation: Morphic Navbar (Kokonut) with page routing
- [ ] Mobile bottom tab bar with correct icons and active states
- [ ] Page transition animations (clipPath industrial shutter, from B0 spec)
- [ ] Scroll-triggered animations on all content screens
- [ ] Loading states: skeleton screens on all data-fetching pages
- [ ] Error states: empty states, error boundaries, offline handling
- [ ] Full responsive QA: mobile (375px), tablet (768px), desktop (1280px+)
- [ ] Accessibility: reduced motion support, keyboard navigation, ARIA labels
- [ ] Performance: Lighthouse audit (target 90+ on all metrics)
- [ ] SEO: meta tags, OpenGraph images, app manifest
- [ ] Vercel deployment configuration
- [ ] Environment variables configured in Vercel dashboard
- [ ] Production smoke test: auth → onboarding → chat → workout → analytics

**Acceptance criteria:** Full user journey works end-to-end in production, Lighthouse 90+, responsive on all breakpoints, reduced motion respected.

---

## Execution Checklist

```
- [ ] B0:  Design System & Tokens              ✅ COMPLETE
- [ ] B1:  Project Scaffold & Configuration
- [ ] B2:  Database Migration & Seed Data
- [ ] B3:  Authentication & Onboarding
- [ ] B4:  AI Coach Pipeline (Backend)
- [ ] B5:  AI Coach Chat UI
- [ ] B6:  Dashboard
- [ ] B7:  Workout Logger
- [ ] B8:  Training Plans
- [ ] B9:  Performance & Analytics
- [ ] B10: Race Hub
- [ ] B11: Profile, Settings & Goals
- [ ] B12: Polish, Testing & Deploy
```

---

## Re-Run Cascade

If a phase needs to be re-done, these downstream phases are affected:

| If This Changes | Re-Run These |
|----------------|-------------|
| B0 (Design System) | B1 (update tokens), spot-check all screens |
| B1 (Scaffold) | B2–B12 (all depend on project structure) |
| B2 (Database) | B3–B12 (all depend on tables) |
| B3 (Auth) | B4–B12 (all depend on auth) |
| B4 (AI Pipeline) | B5, possibly B10 |
| B5–B11 | Only B12 (integration polish) |

---

## Key References

| Document | Location | Purpose |
|----------|----------|---------|
| Design System | `UI_Frontend_Build/B0-design-system.md` | All visual design tokens and specs |
| Database Schema | `UI_Frontend_Build/phase2-database-schema.md` | Table definitions |
| Seed Data | `UI_Frontend_Build/phase3-seed-data.md` | Reference data SQL |
| API Architecture | `UI_Frontend_Build/phase4-api-architecture.md` | Endpoint specs, pipeline |
| Screen Specs | `UI_Frontend_Build/phase5-frontend-specs.md` | Screen-by-screen blueprints |
| Build Prompts | `UI_Frontend_Build/phase6-build-prompts.md` | Detailed prompt templates |
| Design Research | `UI_Frontend_Build/research_output/design_system_research_*.md` | Typography, animation, atmosphere research |
| Kokonut Audit | `UI_Frontend_Build/phase1-kokonut-ui.md` | Component inventory & gaps |
| System Design | `docs/architecture/system_design.md` | Full system architecture |
| Nebius Guide | `docs/architecture/nebius-finetuning-guide-PROJECT.md` | Fine-tuning API reference |
