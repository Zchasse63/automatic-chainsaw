# Hyrox AI Coach — Master Implementation Plan

> **Synthesized from**: Comprehensive gap analysis (Opus), VS Code Claude feature audit, STNDRD app research, current frontend handoff spec, and product owner feedback. This is the single source of truth for what to build next.

---

## Current state summary

Coach K has a strong foundation that should not be rebuilt: a fine-tuned Llama 3.3 70B model on Nebius Token Factory, 239 embedded knowledge chunks in Supabase PGVector with hybrid search, a tuned system prompt validated across 59 scenarios, and a working Next.js frontend with dark/gold Hyrox-themed UI including chat, dashboard, sidebar navigation, and training pages. The coaching pipeline (embed → search → format → prompt → stream → log) is functional end-to-end.

The gap between this working prototype and a product athletes will actually train with daily comes down to five areas: making the AI actionable (not just conversational), building the workout execution experience, adding the data visualizations athletes expect, connecting chat outputs to real training plans, and polishing reliability and performance.

---

## 1. AI SDK migration — the single highest-leverage change

Migrating from custom SSE streaming to the Vercel AI SDK v6 is the foundation everything else builds on. It replaces hundreds of lines of custom streaming, state management, and parsing code with a two-file architecture, and critically, it unlocks tool calling — which is what turns Coach K from a chatbot into a training partner that can actually log workouts, pull stats, and modify plans from within the conversation.

### What changes

The Nebius provider setup uses `@ai-sdk/openai-compatible` with `createOpenAICompatible()` pointing at `https://api.tokenfactory.nebius.com/v1`. The server route becomes a single `streamText()` call with tools injected. The client replaces all custom streaming state with `useChat()` from `@ai-sdk/react`, which exposes a `parts` array on each message for rendering text, tool invocations, and tool results as distinct UI elements.

Key SDK v6 specifics: `useChat` uses `sendMessage({ text })` not `handleSubmit`, messages expose `parts` not `content`, `stopWhen: stepCountIs(5)` replaces old `maxSteps`, and status values are `'idle' | 'submitted' | 'streaming' | 'error'`.

### RAG becomes tool-based

Instead of pre-fetching RAG context on every message (wasteful when the athlete is just chatting about scheduling), RAG becomes a tool the model calls when it needs Hyrox knowledge. This makes retrieval visible in the UI, supports multi-step reasoning (search → read → search again), and saves tokens on conversational turns. Roughly 40% of messages actually need knowledge base context — tool-based retrieval is more efficient for a coaching chatbot.

The `search_knowledge_base` tool embeds the query via OpenAI text-embedding-3-small, calls `hybrid_search_chunks` via Supabase RPC, and returns the top 5 chunks. The existing hybrid search function and knowledge chunks table are used as-is.

### System prompt stays frozen

The tuned system prompt is used exactly as documented in the handoff spec. The `{context}` placeholder gets populated by the RAG tool results. The athlete profile is injected as a second system message. These are non-negotiable constraints.

---

## 2. Ten coaching tools that make the AI actionable

The tool architecture injects the authenticated `athleteId` via closure, keeping it invisible to the model while giving every tool scoped database access. Each tool returns structured data that renders as a distinct inline card in the chat UI.

### The tool set

**`search_knowledge_base`** — Searches the Hyrox training knowledge base. Embeds query, calls hybrid_search_chunks, returns top 5 chunks. UI: no visible card (context feeds the response).

**`create_workout_log`** — Logs a completed workout when the athlete reports results. Parameters: exercise type, duration, distance, sets, reps, weight, RPE 1-10, notes. UI: compact confirmation card with checkmark.

**`get_today_workout`** — Retrieves today's planned workout from the active training plan. UI: detailed workout card with exercise list and targets.

**`get_training_plan`** — Retrieves the full active training plan with all weeks and daily workouts. UI: collapsible weekly calendar view.

**`update_training_plan_day`** — Modifies a specific day (swap exercises, adjust volume). UI: updated day card showing changes.

**`log_benchmark`** — Records a benchmark test result with automatic PR detection. Compares against previous best. UI: benchmark card with trophy icon if PR, comparison to previous best.

**`get_athlete_stats`** — Pulls recent workout history, personal records, and training volume for a configurable time range. UI: compact stats summary card.

**`set_goal`** — Creates or updates a training goal (race time, station time, running pace, volume, benchmark PR, consistency). UI: goal card with target and current status.

**`get_progress_summary`** — Comprehensive progress report with plan adherence percentage, benchmark trends, and period summary. UI: multi-section progress dashboard.

**`calculate_race_pacing`** — Calculates race pacing strategy based on target finish time and latest benchmarks. Breaks down into per-run target, station budget, transition budget. UI: pacing table with run/station/transition breakdown.

### Chat-to-workout: the critical bridge

This is the feature that connects Coach K's conversational output to real scheduled training. When Coach K suggests a workout in chat, the response should include a rendered workout card with a **"Schedule This Workout"** button. Tapping it opens a date picker (defaulting to the next logical training day), and on confirm, the workout is written to the `training_plan_days` table and appears on the calendar.

Implementation: Coach K uses `generateObject()` with a `WorkoutPlan` Zod schema to produce structured workout data alongside its natural-language explanation. The structured output renders as an interactive card in the chat. The schedule action is a client-side mutation that writes to Supabase.

This means the athlete can ask "What should I do for my sled push day this week?", get a detailed response with specific sets/reps/weights, and with one tap, that workout appears on their calendar ready for execution. No manual transcription.

### Tool result rendering

Each tool type renders a distinct inline card component in the chat, visually separated from text with a bordered card and tool-specific icon. Use a switch on `part.toolName` within the `parts` renderer. Keep tool results visually distinct but integrated — they should feel like Coach K is pulling up information, not like the UI is interrupting.

---

## 3. The workout experience — whiteboard view, timer, post-workout logging

This is the area where the current app is weakest and where STNDRD's lessons are most directly applicable. Hyrox workouts are not gym workouts — there are no long rest periods, you move continuously between stations and runs, and you need to see the entire session upfront to prepare mentally and physically. The experience must support the real athlete workflow: review the full workout, write it on a whiteboard or memorize it, start a session timer, execute, then log per-section results afterward.

### Workout view: full session layout

When an athlete taps a calendar day and selects a workout, they see the **entire workout laid out as a single scrollable view** — not a step-through wizard. Each section (warm-up, stations, runs, cool-down) is a distinct card within the view showing the exercise name, prescribed volume (sets/reps/distance/time), target intensity or pace, and technique notes or cues.

This is the "whiteboard view" — the athlete reads it, internalizes the session structure, and then executes. For Hyrox-specific workouts, sections map to the race structure: "Run 1 → SkiErg → Run 2 → Sled Push → ..." with each section showing its prescribed parameters.

Design reference: STNDRD displays exercises with HD video demos, set/rep fields, and a rest timer. For Coach K, swap video demos for technique cue text (sourced from the RAG knowledge base) and Hyrox-specific context (sled weights for your division, target split times based on your goal race time).

### Session timer

A global session timer starts when the athlete taps "Start Workout" and runs for the entire session duration. This is not a per-exercise timer — it's a running clock that mirrors how Hyrox athletes actually track their training sessions.

Technical requirements drawn from STNDRD's failures: the timer **must run in a Web Worker** to prevent background tab throttling, it **must use `Date.now()` differentials** (not `setInterval` increments which drift), it **must persist to localStorage** for crash recovery, and it **must continue when the app is backgrounded**. STNDRD's most frequently cited complaint is that their timer stops in the background — this is non-negotiable for a Hyrox app where athletes switch between the app and music or other apps during training.

The timer displays prominently at the top of the workout view during execution and is captured as `duration_minutes` in the workout log on completion.

### Post-workout logging: per-section results and notes

After the session (or during, if the athlete prefers to log between sections), each section card expands to accept actual results. The logging fields per section are: completion status (done/skipped/modified), actual time or reps achieved, RPE for that specific section (1-10), and a free-text notes field.

This per-section granularity is essential for Hyrox training. An athlete needs to know not just "today's session felt like RPE 8" but "the sled push was RPE 9 and my form broke down on the last 10 meters while the ski erg was only RPE 6." This data feeds Coach K's analysis and informs plan adjustments.

On workout completion, the app shows a summary screen with total duration, average RPE across sections, any PRs detected, and comparison to the prescribed workout (planned vs actual). This summary is saved as a single `workout_logs` entry with the per-section data stored in the `completed_workout` JSONB field.

### STNDRD patterns to adopt

From the STNDRD research, these specific patterns should be implemented:

**Exercise replacement within structured workouts.** If equipment is unavailable, the athlete can tap any exercise and swap it for an alternative targeting the same movement pattern. Coach K's RAG knowledge base contains exercise substitution data — surface this as a quick-swap menu.

**Autosave every logged entry immediately.** STNDRD's most damaging user complaint is mid-workout crashes wiping data. Every set, every RPE entry, every note should write to Supabase immediately, not batch on completion.

**Lock-screen timer via Live Activity (iOS).** If/when a native app is built, the session timer should display on the lock screen. For the web app, use the Web Locks API and Service Worker to maintain timer state.

### STNDRD patterns to skip

**Step-through mode with countdown timers between exercises.** This works for bodybuilding (where rest periods are prescribed) but not for Hyrox training where you move continuously. The whiteboard view with a global timer is the correct paradigm.

**Gamified XP per workout.** Hyrox athletes are motivated by race performance improvements and PR tracking, not arbitrary point systems. Save gamification for the achievement/badge system (see section 6).

---

## 4. Calendar and training plan management

The training page needs to evolve from its current empty state into the operational center of the app — where athletes see their week, manage their schedule, and launch workouts.

### Calendar view: Macrofactor-inspired

The calendar uses a week-at-a-glance layout as the default view, with each day showing a condensed workout summary card: session type (color-coded by category — blue for runs, orange for station work, green for strength, gray for rest), total estimated duration, and a completion indicator (empty/partial/complete).

**Full drag-and-drop** between days. If an athlete can't train Tuesday, they drag Tuesday's workout to Wednesday. The drop target highlights to show valid placement. This requires updating the `training_plan_days` table's `date` field and recalculating any dependent scheduling logic.

**Tap to edit** any day. Tapping opens the day detail view showing the full workout layout. From here the athlete can modify exercises, adjust volume, add notes, or launch the workout.

A month view toggle shows the broader training block with color-coded dots per day indicating session type and completion status, plus weekly volume summaries.

### Training plan generation from chat

When Coach K generates a multi-week training plan in conversation, it should use `generateObject()` with a `TrainingPlan` Zod schema to produce structured data (weeks, days, sessions, exercises). The chat renders this as a collapsible plan preview card. An **"Activate This Plan"** button writes the full plan to the `training_plans` / `training_plan_days` tables and populates the calendar.

Only one plan can be active at a time. Activating a new plan archives the previous one (status: 'archived' with a timestamp) rather than deleting it, preserving history.

### New database tables for training plans

The handoff spec defines `workout_logs` and `benchmark_tests` but the calendar needs a proper training plan structure:

```
training_plans (
  id uuid primary key,
  athlete_id uuid references athlete_profiles(id),
  name text,
  status text check (status in ('active', 'archived', 'draft')),
  total_weeks int,
  phase text,
  source text,              -- 'coach_k' | 'manual' | 'imported'
  conversation_id uuid,     -- links back to the chat that generated it
  created_at timestamptz,
  updated_at timestamptz
)

training_plan_days (
  id uuid primary key,
  plan_id uuid references training_plans(id) on delete cascade,
  date date not null,
  day_of_week int,
  session_type text,        -- run | hiit | strength | simulation | recovery | rest
  title text,               -- "Sled Push Focus + 3x1km"
  prescribed_workout jsonb, -- full exercise list with sets/reps/targets
  completed boolean default false,
  intensity text,           -- low | moderate | high
  notes text,
  created_at timestamptz
)
```

RLS policies follow the same pattern as existing tables — athlete_id ownership chain through training_plans.

---

## 5. Dashboard — purposeful at a glance, detailed on interaction

The current dashboard shows race countdown, streak, RPE average, and workout count. These are the right top-level metrics but they need to do more — each should be a gateway to deeper insight.

### Stat cards that expand into charts

**Streak card** — Shows current consecutive training day streak. Tap to expand into a heatmap calendar (GitHub contribution graph style) showing the last 90 days of training activity. Color intensity maps to session volume or RPE. Streak history and longest streak are displayed below the heatmap.

**RPE card** — Shows 7-day average RPE. Tap to expand into a line chart (Recharts) showing daily RPE over the last 30 days with a trend line. Overlay the athlete's training load so they can see the correlation between volume and perceived effort. Flag any 3+ consecutive sessions above RPE 8 with a "recovery recommended" callout.

**Workouts card** — Shows sessions completed this week. Tap to expand into a stacked bar chart showing weekly session count by type (runs, station work, strength, recovery) over the last 8 weeks. This immediately reveals balance — if an athlete is doing all running and no station-specific work with 6 weeks to race, that's visible.

### Additional dashboard elements

**Race countdown** — Already present but should include a race readiness score (0-100). This composite score weights: training volume consistency (20%), benchmark performance vs targets (25%), running fitness (20%), plan adherence (10%), taper quality (10%), recovery metrics (10%), and race simulation completion (5%). Display as a color-coded ring: green >80, yellow 60-80, red <60. Below the ring, surface the weakest component: "Your Sled Pull is your weakest station at 62% — consider 2 targeted sessions this week."

**Next workout card** — Shows today's (or next scheduled) workout with session type, estimated duration, and a "Start Workout" button that launches directly into the workout view. If no workout is scheduled, show "Ask Coach K to plan your week" with a link to chat.

**Recent benchmarks** — Sparkline trend for each Hyrox station the athlete has tested, showing improvement trajectory. Tap any station to see the full history.

**Weekly volume summary** — Total training hours this week vs target, displayed as a simple progress bar. Below it, a breakdown by session type.

### Charts library

Use Recharts for all data visualization. It integrates cleanly with React Query — fetch data via `useQuery`, pass directly to chart components. `ResponsiveContainer` wrapping each chart handles mobile sizing. No charting components exist in the current shadcn/ui or B0 component set, so Recharts fills this gap entirely.

---

## 6. Features from the VS Code Claude audit to incorporate

The VS Code Claude audit identified several features in three categories. Here's what to take from each:

### Built but not wired — connect these

**Race results logging.** The database schema exists but the UI to input race splits (8 running times, 8 station times, transition times) doesn't. Build a race results entry form that captures the full Hyrox split structure. Display results as a waterfall chart showing time budget breakdown (running vs stations vs transitions) and a run degradation line plotting runs 1-8 to reveal the fatigue curve.

**Benchmark tests.** Schema exists, needs a proper input UI with a station selector, MM:SS time input, automatic weight field population based on division, and comparison to previous best. The 10 core Hyrox benchmarks: 1km SkiErg, 1km Row, 50m Sled Push, 50m Sled Pull, 80m Burpee Broad Jumps, 200m Farmers Carry, 100m Sandbag Lunges, 100 Wall Balls, 1km Run, 5km Run.

**Achievements.** The schema exists for a badge/achievement system. Implement Hyrox-specific achievements: station mastery badges ("SkiErg Specialist: Sub-3:30"), consistency streaks ("Iron Will: 4 weeks 100% adherence"), milestone markers ("Sub-1:30 Club"), and improvement achievements ("10% Faster"). Display in a trophy case grid. Use confetti animation (canvas-confetti) on unlock. Toast notifications via sonner.

### Partially implemented — finish these

**Message feedback (thumbs up/down).** The schema has a column for this but the UI buttons aren't wired. Add thumb icons below each Coach K response. Save the feedback to the messages table. This data becomes training data for future model iterations — high-value, low-effort feature.

**RPE tracking.** Exists in the workout log schema but needs to be surfaced per-section in the workout view (not just per-workout). The RPE slider should use the Radix Slider primitive with Hyrox-themed styling (1-3 green, 4-6 yellow, 7-8 orange, 9-10 red).

**Profile avatars and customization.** Basic profile exists but could show athlete division, race history count, and PR highlights. Make the profile feel like a "race card" — the summary an athlete would show another Hyrox competitor.

### Missing but needed — build these (prioritized)

**Workout timer** — Covered in section 3. High priority.

**Offline mode (PWA)** — Essential for gym environments with poor connectivity. Use Serwist for service worker management. Cache app shell and static assets with CacheFirst, API routes with NetworkFirst falling back to IndexedDB. Queue workout logs locally, sync to Supabase when connectivity returns. Medium priority — important for real-world use but not MVP-blocking.

**Push notifications** — Workout reminders and achievement celebrations via Web Push API with VAPID keys. "Your training plan has a session in 30 minutes." Lower priority.

**Wearable integration** — Heart rate data from Garmin Connect API (most popular among Hyrox athletes) or Terra API for multi-device support. Post-MVP.

**Payment/subscriptions** — Stripe integration for tiered access. Post-MVP. Recommended tiers based on competitive analysis: Free (basic logging + community), Athlete $14.99/mo (AI plans + analytics), Pro $29.99/mo (advanced periodization + wearables).

---

## 7. Coaching intelligence upgrades

These make Coach K genuinely adaptive rather than just responsive.

### Auto-regulation based on RPE trends

When average session RPE exceeds 8.0 for 3+ consecutive sessions, Coach K proactively recommends a deload (40-50% volume reduction for one week). When RPE drops below target by more than 1 point consistently, recommend progressive overload. This logic runs as a check before each coaching response — pre-compute RPE trends and inject them into the athlete context system message.

### Workout analysis on every log entry

When `create_workout_log` fires, Coach K immediately analyzes the result: compare actual vs prescribed reps/weight/RPE, calculate the RPE trend across last 3 sessions of the same type, check for fatigue flags (rising RPE + stable/declining performance), and generate specific feedback. The response should feel like: "Your sled push time improved 8% while RPE stayed at 7 — you're progressing well. Next week we'll add 5kg."

### Plan adherence drives redistribution

When an athlete misses a scheduled session, Coach K should offer to redistribute the key work across remaining days rather than simply marking it missed. The `update_training_plan_day` tool makes this actionable from within chat: "I see you missed Tuesday's tempo run. Want me to add the key intervals to Thursday's session?"

### Conversation memory: three tiers

**Tier 1 (now):** Last 8 turns verbatim. Already implemented.

**Tier 2 (immediate):** When conversation exceeds 8 turns, summarize oldest 4 turns into a running summary using the LLM. Prepend summary to context window. Preserves injury mentions, goal discussions, and preferences without consuming full token budget.

**Tier 3 (medium-term):** Semantic memory via Mem0 or custom implementation using PGVector. Extract key facts from conversations ("targets sub-70min Hyrox", "knee injury history", "struggles with wall balls") into a `conversation_memories` table. Before each response, retrieve the 5 most relevant memories via embedding similarity.

---

## 8. Technical optimizations

### React Query migration

Replace `useEffect`/`fetch` patterns with TanStack Query v5. Configure stale times per data type: training plans at 30 minutes, workout logs at 2 minutes, dashboard aggregations at 1 minute, athlete profiles at 15 minutes. Implement optimistic updates for workout logging — immediately append the new entry to the cached list, roll back on error.

### RLS policy optimization

Three changes for immediate performance gains: add B-tree indexes on every column referenced in RLS policies (drops query time from 171ms to <2ms on 100K rows), wrap `auth.uid()` in a subselect for initPlan caching (`(SELECT auth.uid()) = user_id`), and replace correlated subqueries with inverted queries.

### Supabase Realtime for cross-device sync

Subscribe to `postgres_changes` on workout_logs and training_plan_days filtered by athlete_id. Use callbacks to invalidate React Query caches so the dashboard updates automatically when a workout is logged on a different device.

### Next.js 16 features

Enable React Compiler (`reactCompiler: true`) to eliminate manual `useMemo`/`useCallback`. Use Server Components as default for data-heavy dashboard pages with `<Suspense>` boundaries. Convert form submissions to Server Actions for simpler revalidation.

---

## 9. UI component strategy

The component strategy uses the B0 design system as its foundation. The app's visual identity — raw industrial + precision coaching, dark mode, Hyrox Yellow accents, sharp corners, Barlow Condensed / IBM Plex Sans / JetBrains Mono typography — is defined entirely through B0 design tokens in `globals.css` and custom-built components. No external component library beyond shadcn/ui is used in any app screens.

> **Note:** Kokonut UI components (free and pro) were installed early in the project but are not used by any page or feature. The B0 design system provides a stronger, more cohesive identity that matches the Hyrox aesthetic. All new components should follow the established B0 patterns — using the surface elevation system, text hierarchy, accent colors, and typography classes directly.

**Layer 1 — shadcn/ui primitives (foundation):** Button, Input, Select, Dialog, Sheet, Tabs, Progress, Switch, Slider, Checkbox, Radio Group, Scroll Area, Tooltip, Popover, Command, Drawer, Dropdown Menu, Textarea, Toast (sonner). These 21 components are already installed and provide the base interactive elements. All are styled to match B0 tokens via the shadcn theme configuration.

**Layer 2 — Custom B0 components (the product):** These are the components that define the app experience, built from scratch using B0 design tokens + shadcn primitives + Lucide icons. Each follows the established patterns visible in dashboard, coach, and training pages: `font-display` for headings, `font-body` for content, `font-mono` for data, `bg-surface-{n}` for elevation, `text-hyrox-yellow` for accents, `border-border-default` for structure, `caution-stripe` for signature elements.

**Layer 3 — Supplementary libraries:** Recharts for all charts, TanStack Table for data tables (split times, PR boards), sonner for toast notifications (already integrated), canvas-confetti for achievement celebrations, @dnd-kit for drag-and-drop calendar management.

**Custom components to build (10-12 total):**

1. **Chat message bubbles & message list** — Already partially built (`chat-message.tsx`); needs tool result card rendering for AI SDK migration
2. **Streaming text renderer** — Markdown rendering with B0 typography for Coach K responses
3. **Workout timer (Web Worker)** — Global session timer with crash recovery, background persistence, prominent display using `font-display` + `text-hyrox-yellow`
4. **Workout section cards with logging** — Each section shows prescribed work + expandable logging fields (completion, time, RPE, notes); uses surface elevation for visual hierarchy
5. **Calendar week view with drag-and-drop** — Already partially built (`week-calendar.tsx`, `droppable-day.tsx`, `draggable-workout-card.tsx`); needs polish and month view toggle
6. **Stat card with expandable chart** — Dashboard cards that expand to reveal Recharts visualizations (heatmap, line chart, bar chart); follow the existing stat card pattern with `bg-surface-1 border border-border-default`
7. **Benchmark entry form with station selector** — Station picker using the 8 station colors from B0, MM:SS time input, auto-populated division weights
8. **Race results waterfall chart** — Recharts visualization showing run/station/transition time budget breakdown
9. **RPE slider with color coding** — Radix Slider (via shadcn) styled with B0 semantic colors: 1-3 green, 4-6 yellow, 7-8 orange, 9-10 red
10. **Race readiness score ring** — SVG ring component with 7-component composite score, color-coded (green >80, yellow 60-80, red <60)
11. **Workout summary/completion screen** — Post-workout review with total duration, average RPE, PRs detected, planned vs actual comparison
12. **Tool result inline cards** — Distinct card components for each coaching tool result (workout card, stats card, pacing table, etc.) rendered within the chat

---

## 10. Implementation roadmap

### Weeks 1-2: Foundation

- Migrate to Vercel AI SDK v6 (streamText + useChat + Nebius provider)
- Implement all 10 coaching tools with Zod schemas
- Wire tool-based RAG (search_knowledge_base tool)
- Add chat-to-workout button (generateObject with WorkoutPlan schema)
- Build training_plans and training_plan_days tables with RLS
- Run RLS optimization (indexes + auth.uid() wrapping)
- Wire message feedback (thumbs up/down) to messages table
- Enable React Compiler

### Weeks 3-5: Workout experience

- Build the workout whiteboard view (full session layout, section cards)
- Implement session timer with Web Worker and crash recovery
- Build per-section post-workout logging (RPE, time, notes per section)
- Create autosave-on-every-entry pattern
- Build exercise replacement/swap UI
- Create workout summary/completion screen
- Implement calendar week view with drag-and-drop
- Add month view toggle with training type color coding

### Weeks 6-8: Dashboard and analytics

- Build expandable stat cards (Streak → heatmap, RPE → trend, Workouts → volume)
- Implement race readiness score with 7-component model
- Add performance charts with Recharts (station trends, radar chart, volume by type)
- Build benchmark entry UI with station selector and trend sparklines
- Create race results logging with split capture and waterfall visualization
- Wire Supabase Realtime for cross-device dashboard sync
- Migrate remaining useEffect/fetch to React Query

### Weeks 9-12: Intelligence and engagement

- Implement RPE-based auto-regulation and deload detection
- Build workout analysis pipeline (planned vs actual + feedback)
- Add plan adherence tracking with missed-session redistribution
- Implement conversation summary buffer (Tier 2 memory)
- Build achievement system with Hyrox-specific badges
- Add goals management page with progress visualization
- PWA/offline support with Serwist and IndexedDB sync
- Push notifications for workout reminders

---

## Appendix A: Database schema additions

Beyond what's in the handoff spec (athlete_profiles, conversations, messages, workout_logs, benchmark_tests), these tables are needed:

```sql
-- Training plan structure
create table training_plans (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athlete_profiles(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('active', 'archived', 'draft')),
  total_weeks int,
  current_phase text,
  source text default 'coach_k' check (source in ('coach_k', 'manual', 'imported')),
  conversation_id uuid references conversations(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table training_plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references training_plans(id) on delete cascade,
  date date not null,
  day_of_week int check (day_of_week between 0 and 6),
  session_type text check (session_type in ('run', 'hiit', 'strength', 'simulation', 'recovery', 'rest')),
  title text,
  prescribed_workout jsonb,
  completed boolean default false,
  intensity text check (intensity in ('low', 'moderate', 'high')),
  notes text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index training_plans_athlete_idx on training_plans (athlete_id, status);
create index training_plan_days_plan_idx on training_plan_days (plan_id, date);
create index training_plan_days_date_idx on training_plan_days (date);

-- Goals
create table goals (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athlete_profiles(id) on delete cascade,
  goal_type text not null check (goal_type in ('race_time', 'station_time', 'running_pace', 'training_volume', 'benchmark_pr', 'consistency')),
  target_value text not null,
  current_value text,
  target_date date,
  description text,
  status text default 'active' check (status in ('active', 'achieved', 'abandoned')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(athlete_id, goal_type)
);

-- Achievements
create table achievements (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athlete_profiles(id) on delete cascade,
  achievement_type text not null,
  achievement_name text not null,
  description text,
  rarity text check (rarity in ('bronze', 'silver', 'gold', 'diamond')),
  unlocked_at timestamptz default now(),
  metadata jsonb
);

create index achievements_athlete_idx on achievements (athlete_id, unlocked_at desc);

-- Conversation memories (Tier 3 semantic memory)
create table conversation_memories (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athlete_profiles(id) on delete cascade,
  memory_type text check (memory_type in ('fact', 'preference', 'goal', 'injury', 'pr')),
  content text not null,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Race results (full Hyrox split structure)
create table race_results (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athlete_profiles(id) on delete cascade,
  race_date date not null,
  event_location text,
  division text,
  format text check (format in ('singles', 'doubles', 'relay')),
  total_time_seconds int not null,
  running_splits jsonb,       -- [{"run": 1, "time_seconds": 280}, ...]
  station_splits jsonb,       -- [{"station": "skierg", "time_seconds": 210}, ...]
  transition_times jsonb,     -- [{"after": "run_1", "time_seconds": 15}, ...]
  overall_placement int,
  division_placement int,
  notes text,
  created_at timestamptz default now()
);

create index race_results_athlete_idx on race_results (athlete_id, race_date desc);

-- Athlete readiness (daily check-in for auto-regulation)
create table athlete_readiness (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athlete_profiles(id) on delete cascade,
  date date not null default current_date,
  sleep_quality int check (sleep_quality between 1 and 5),
  energy_level int check (energy_level between 1 and 5),
  soreness int check (soreness between 1 and 5),
  motivation int check (motivation between 1 and 5),
  readiness_score numeric generated always as (
    (sleep_quality + energy_level + (6 - soreness) + motivation) * 5.0
  ) stored,
  notes text,
  created_at timestamptz default now(),
  unique(athlete_id, date)
);
```

RLS policies for all new tables follow the same athlete_id ownership pattern documented in the handoff spec.

---

## Appendix B: Key learnings from STNDRD

Patterns to adopt: program-first architecture where athletes follow structured plans rather than building from scratch, exercise replacement within structured workouts for equipment flexibility, autosaving every logged entry immediately to prevent data loss (STNDRD's top complaint), the workout overview paradigm (see full session → execute → log), and Instagram-shareable workout completion screens.

Patterns to avoid: background timer that stops when app is backgrounded (critical failure for Hyrox athletes), aggressive paywall before preview (kills trust), XP point systems that feel arbitrary rather than tied to real athletic progress, step-through exercise-by-exercise mode (wrong paradigm for continuous Hyrox-style sessions).

Key insight: Athletes want opinionated, structured programming over blank canvases — they want a credible coach to tell them what to do today, with enough flexibility to adapt to real-world conditions. This validates Coach K's entire approach.

---

## Appendix C: Constraints (carried forward from handoff spec)

These are non-negotiable and must be respected throughout implementation:

- Nebius is the ONLY inference provider for coaching responses. OpenAI is ONLY for embeddings.
- Do not modify the system prompt without re-running the 59-scenario evaluation suite.
- Do not modify the knowledge_chunks table or its data.
- Always use hybrid_search_chunks (not pure semantic search) for production queries.
- Re-run RAG search per message — don't cache chunks across turns.
- Temperature 0.7, max_tokens 1200 — validated and frozen.
- The coaching pipeline flow (embed → search → format → prompt → stream → log) is the canonical architecture.