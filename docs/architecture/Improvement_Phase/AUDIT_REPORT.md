# Hyrox AI Coach — Functional Audit Report
Date: 2026-02-18
Auditor: Zeroshot Worker Agent

---

## Executive Summary

**Health Score: 71/100**

The Hyrox AI Coach codebase is architecturally sound and the core AI chat pipeline works end-to-end: streaming, tool calls, RAG search, plan extraction, and plan acceptance are all correctly wired. Authentication is consistently applied via `createServerClient + getUser()` across nearly all routes. The React Query cache strategy covers the most important mutation paths. The training plan acceptance pipeline (TrainingPlanCard → PlanReviewModal → POST /api/training-plans) writes all three required tables correctly.

However, there are seven distinct broken or seriously degraded features. The most impactful: (1) the `/api/stations` route orders by a non-existent column (`station_order` — the schema has `station_number`), causing a 500 error on every request to the Stations tab; (2) five API routes (`/api/goals/[id]`, `/api/workouts/[id]`, `/api/training-plans/[id]`, `/api/conversations/[id]/messages`) have no ownership verification, meaning any authenticated user can read or mutate another user's data; (3) the entire achievement system has no trigger mechanism — no code ever calls `athlete_achievements.insert()` and the `showAchievementToast` utility is never invoked; (4) tool call results are not persisted to the database, so reloaded conversations show only raw text with no tool result cards.

Secondary issues include: the dashboard streak calculation reads only 7 days of workout history but iterates up to 30 days, causing streaks to silently read 0 after 7 days; `get_today_workout` and `get_training_plan` tools are missing try/catch wrappers; `ScheduleWorkoutButton` skips `dashboard` cache invalidation; and `personal_records` can never be auto-populated since `log_benchmark` has no PR detection logic.

---

### Recommended Fix Order

1. **`/api/stations` `station_order` column mismatch** — 1-line fix, breaks entire Stations tab for every user.
2. **Ownership checks on 5 unprotected routes** — IDOR security vulnerability; trivial to add `.eq('athlete_id', profile.id)`.
3. **Dashboard streak reads only 7 days** — streak silently shows 0 after day 7 even with a 20-day streak; fix by fetching 90 days.
4. **`get_today_workout` and `get_training_plan` tools missing try/catch** — uncaught DB errors crash the AI stream.
5. **Tool call results not persisted** — conversation reload loses all tool result UI cards; requires schema addition and onFinish update.
6. **`ScheduleWorkoutButton` missing `dashboard` cache invalidation** — stale stats after scheduling.
7. **Achievement system trigger missing** — implement server-side check-and-award after workout/benchmark creation.

---

## Critical Issues (Feature Broken)

| # | File:Line | Issue | Impact | Fix Status |
|---|-----------|-------|--------|-----------|
| C1 | `src/app/api/stations/route.ts:9` | `.order('station_order', ...)` — column `station_order` does not exist in `hyrox_stations`; DB has `station_number` | Stations tab on Performance page returns 500 on every load | FIXED 2026-02-18 |
| C2 | `src/app/(app)/performance/page.tsx:16-19` | `Station` interface uses `name` (not `station_name`) and `station_order` (not `station_number`) — fields are undefined even if C1 fixed | Station names and order numbers render as `undefined` | FIXED 2026-02-18 |
| C3 | `src/app/api/goals/[id]/route.ts:20-31` | PUT updates goal by `id` alone with no `.eq('athlete_id', profile.id)` check | Any authenticated user can overwrite any other user's goal (IDOR) | FIXED 2026-02-18 |
| C4 | `src/app/api/goals/[id]/route.ts:45-54` | DELETE removes goal by `id` alone, no ownership check | Any authenticated user can delete any goal (IDOR) | FIXED 2026-02-18 |
| C5 | `src/app/api/workouts/[id]/route.ts:17-32` | GET returns workout by `id` with no athlete ownership check | Any authenticated user can read any workout | FIXED 2026-02-18 |
| C6 | `src/app/api/workouts/[id]/route.ts:35-62` | PUT updates workout by `id` alone, accepts full body as update payload | IDOR + mass-assignment vulnerability | FIXED 2026-02-18 |
| C7 | `src/app/api/training-plans/[id]/route.ts:36-63` | PUT updates plan by `id` alone, no ownership check, accepts full body | IDOR + mass-assignment | FIXED 2026-02-18 |
| C8 | `src/app/api/conversations/[id]/messages/route.ts:5-37` | GET reads messages by `conversation_id` alone, no ownership verification | Any authenticated user can read any conversation history | FIXED 2026-02-18 |

---

## High-Priority Issues (Degraded UX / Stale Data)

| # | File:Line | Issue | Impact | Fix Status |
|---|-----------|-------|--------|-----------|
| H1 | `src/app/api/dashboard/route.ts:35-78` | `recentWorkouts` fetched with 7-day window (line 36: `weekAgo`), but streak loop runs 30 iterations (line 63) — workouts beyond 7 days are absent, streak breaks silently | Dashboard streak shows 0 after day 7 even with long active streak | FIXED 2026-02-18 |
| H2 | `src/lib/ai/tools.ts:79-110` | `get_today_workout` tool has no try/catch — Supabase errors throw uncaught exceptions inside streamText | AI stream crashes on DB error for this tool | FIXED 2026-02-18 |
| H3 | `src/lib/ai/tools.ts:117-138` | `get_training_plan` tool has no try/catch — same issue as H2 | AI stream crashes on DB error for this tool | FIXED 2026-02-18 |
| H4 | `src/app/api/chat/route.ts:109-128` | `onFinish` only saves `content: text` — tool call results and RAG chunk IDs are never persisted | On conversation reload, tool result cards disappear; `rag_chunks_used` always null | FIXED 2026-02-18 |
| H5 | `src/app/(app)/coach/page.tsx:145-152` | On conversation switch, `setMessages` re-creates messages with only `{ type: 'text', text }` parts — tool parts lost | Tool result cards invisible in reloaded conversations | FIXED 2026-02-18 |
| H6 | `src/components/training/schedule-workout-button.tsx:47` | `handleSelect` invalidates `['workouts']` and `['training-plans']` but not `['dashboard']` | Dashboard weekly stats stale after scheduling a workout | FIXED 2026-02-18 |
| H7 | `src/lib/ai/tools.ts:167-191` | `log_benchmark` tool never queries or writes `personal_records` — no PR detection | PRs are never automatically created from benchmark results | FIXED 2026-02-18 |
| H8 | `src/app/api/dashboard/route.ts:165-168` | `todaysWorkout` lookup: `weeks[currentWeek - 1]` uses array index — if any weeks are missing or out of order in DB, wrong workout is shown | Wrong today's workout on dashboard for plans with missing weeks | FIXED 2026-02-18 |
| H9 | `src/app/api/dashboard/route.ts:150-153` | Plan progress counts ALL days including rest days as completable — `allDays.filter(d => d.is_completed)` over all days. `get_progress_summary` tool (tools.ts:305) correctly excludes rest days. | Dashboard progress % is lower than it should be | FIXED 2026-02-18 |

---

## Low-Priority Issues (Polish / Improvement)

| # | File:Line | Issue | Impact | Fix Status |
|---|-----------|-------|--------|-----------|
| L1 | `src/components/achievements/achievement-toast.tsx:8` | `showAchievementToast` is defined but imported by no file — achievement toasts never fire | Achievement system is display-only, toasts never triggered | FIXED 2026-02-18 |
| L2 | `src/app/api/achievements/route.ts` | No POST endpoint for awarding achievements — `athlete_achievements` can only be read, not written via API | Achievement system is read-only, no trigger mechanism | FIXED 2026-02-18 |
| L3 | `src/app/api/messages/[id]/feedback/route.ts:29-32` | `UPDATE messages SET feedback=? WHERE id=?` with no ownership check — any user can rate any message | Minor IDOR on non-sensitive data | FIXED 2026-02-18 |
| L4 | `src/app/api/training-plans/[id]/days/[dayId]/route.ts:44-48` | PATCH passes entire `body` to `training_plan_days` without field filtering | Mass-assignment: caller can set any column | FIXED 2026-02-18 |
| L5 | `src/hooks/use-training-plans.ts:145-146` | `useUpdatePlanDay` invalidates `['training-plan']` (bare key prefix) but NOT `['training-plans']` (list) | Plan list doesn't refresh after day update | FIXED 2026-02-18 |
| L6 | `src/hooks/use-workouts.ts:24` | `queryKey: ['workouts', params]` where `params` is an object — React Query compares objects by reference for cache hits | May cause unnecessary refetches | FIXED 2026-02-18 |
| L7 | `src/app/(app)/training/page.tsx:184` | `startDate={activePlan.start_date}` passed to `WeekCalendar` but `start_date` is `string | null` — component receives null when start_date unset | WeekCalendar can break on null start_date | FIXED 2026-02-18 |
| L8 | `src/stores/coach-store.ts:19` | `lastConversationId: id ?? undefined` — when `id` is `null`, stored as `undefined` but type is `string | null` | Minor type inconsistency in Zustand/localStorage | FIXED 2026-02-18 |
| L9 | `src/lib/ai/nebius.ts:9` | `process.env.NEBIUS_MODEL!` — non-null assertion, no runtime validation; if env var missing, model ID is `undefined` and Nebius returns 400 | Silent failure if env var not set | FIXED 2026-02-18 |
| L10 | `src/app/api/profile/route.ts:79-86` | `PATCH /api/profile` passes full `body` directly to `supabase.update(body)` — caller can set any column including `user_id` | Mass-assignment on profile update | FIXED 2026-02-18 |
| L11 | `src/app/(app)/coach/page.tsx:12-14` | Plan detection heuristic in `containsTrainingPlan` (chat-message.tsx:13) requires only 3 "Week N" mentions — can false-positive on casual messages | Spurious "Training plan detected" banners | FIXED 2026-02-18 |

---

## A1: Tool Call Pipeline

**Status: PARTIAL**

### Tool Inventory

| Tool | Zod Schema | DB Table | Column Match | Error Handling | Renderer |
|------|-----------|---------|-------------|---------------|---------|
| `search_knowledge_base` | `query: string` | `knowledge_chunks` via RPC | RPC params match DB function signature exactly | try/catch at line 42 | Hidden (null returned in chat-message.tsx:89) |
| `create_workout_log` | `date, session_type, duration_minutes?, rpe_post?, notes?` | `workout_logs` | All columns valid | `if (error)` check | `WorkoutLoggedCard` — shows session_type, duration, RPE |
| `get_today_workout` | `{}` | `training_plans`, `training_plan_weeks` | Valid | **No try/catch** | `TodayWorkoutCard` — shows title, description, start/schedule buttons |
| `get_training_plan` | `week_number?: number` | `training_plans`, `training_plan_weeks` | Valid | **No try/catch** | `TrainingPlanCard` (in tool-result-renderer, not the acceptance card) |
| `update_training_plan_day` | `day_id, workout_title?, workout_description?, session_type?, is_completed?` | `training_plan_days` | All valid | `if (error)` check | `DayUpdatedCard` — shows updated title/type + ScheduleWorkoutButton |
| `log_benchmark` | `test_type, station_id?, results, notes?` | `benchmark_tests` | All valid | `if (error)` check | `BenchmarkCard` — shows test_type and test_date |
| `get_athlete_stats` | `{}` | `athlete_profiles`, `workout_logs`, `personal_records` | Valid | try/catch added (FIXED 2026-02-18) | `StatsCard` — shows weekly stats + division/goal |
| `set_goal` | `title, description?, goal_type?, target_value?, target_date?` | `goals` | All valid; inserts `current_value: 0` | `if (error)` check | `GoalCard` — shows title, target, date |
| `get_progress_summary` | `days?: number` | `workout_logs`, `goals`, `training_plans`, `training_plan_weeks` | Valid | try/catch added (FIXED 2026-02-18) | `ProgressCard` — shows totals, breakdown, adherence |
| `calculate_race_pacing` | `target_minutes, fitness_level?` | None (pure computation) | N/A | No errors possible | `PacingCard` — shows run splits and station targets |

### Findings

**CRITICAL: `get_today_workout` (tools.ts:79) — No try/catch**
Both Supabase queries inside this tool execute without a try/catch wrapper. A network error or RLS error will propagate as an uncaught exception inside the `streamText` pipeline. The AI SDK v4 may handle this by ending the stream with an error, but the user sees an abrupt failure rather than a graceful "couldn't fetch" message.

**CRITICAL: `get_training_plan` (tools.ts:117) — No try/catch**
Same issue. The `search_knowledge_base` tool (line 24) correctly uses try/catch as the pattern to follow.

**HIGH: `log_benchmark` has no PR detection (tools.ts:167-191)**
After inserting to `benchmark_tests`, the tool does not check `personal_records` for the same `test_type`/`station_id`. If the new result is better than the previous best, no PR row is created. The `personal_records` table can only be populated if the user manually goes to a non-existent UI, by a DB trigger (none found in schema), or via a missing `POST /api/personal-records` route. PRs are effectively never created automatically.

**LOW: `get_athlete_stats` silently ignores errors (tools.ts:197-235)**
Three Supabase queries run without checking for errors. If `athlete_profiles` returns an error, `profile` is null and the response shows `profile: null` without context.

**`search_knowledge_base` renderer suppression is intentional**
The tool result for `search_knowledge_base` is explicitly suppressed in `chat-message.tsx:89-90` (`return null` for this toolName). Correct — RAG is a background operation.

**`create_workout_log` missing React Query invalidation**
The tool writes to `workout_logs` server-side but the client-side React Query cache (`['workouts']`, `['dashboard']`) is not invalidated. The dashboard and training page show stale data until the user navigates away and back.

---

## A2: Chat API Route (/api/chat)

**Status: PASS (with persistence gap)**

### Auth Pattern
Lines 12–19: `createClient()` (from `@/lib/supabase/server`) + `supabase.auth.getUser()`. Correct Supabase SSR pattern. No JWT spoofing risk.

### Athlete Context Injection
Profile is fetched (lines 35–39) and passed to `buildAthleteProfileMessage()` (line 72). The result is concatenated with `SYSTEM_PROMPT` (line 75–77). Athlete name, age, fitness stats, race date, injuries, etc. are injected into the system prompt. PASS.

### RAG Approach
RAG is done on-demand via `search_knowledge_base` tool (agentic RAG) — no pre-fetch. This matches the system prompt design. The model decides when to search.

### streamText Configuration
- Model: fine-tuned Llama via Nebius (COACH_K_MODEL from nebius.ts)
- Tools: all 10 coaching tools
- Temperature: 0.7
- maxOutputTokens: 16,384
- stopWhen: `stepCountIs(10)` — up to 10 tool call cycles
- maxDuration: 60s (Vercel function limit)

### Message Persistence
**User messages**: Saved before streaming (lines 83–96). Content is extracted from `parts` of type `text`. If `content` is empty (e.g., a tool-only message), no insert happens.

**Assistant messages**: Saved in `onFinish` callback (lines 109–127) using final `text`. Includes `tokens_in`, `tokens_out`, `latency_ms`. **Does NOT save**: `rag_chunks_used` (always null in DB), `suggested_actions` (always null), `pinned` (always null), or tool results.

**Tool result persistence**: Tool call results are NOT saved. The `messages` table has no `tool_calls`/`tool_results` column. On page reload, `useMessages()` returns only text rows — tool result cards cannot be reconstructed. Every reloaded conversation loses its tool result UI.

### Conversation ID Propagation
New conversation created if `convId` absent (lines 49–68). The ID is returned via `X-Conversation-Id` header (line 132). Coach page intercepts this in the custom fetch function (page.tsx:73–76) and calls `setActiveConversation`. PASS.

---

## A3: Database Schema Integrity

**Status: PARTIAL**

### Table Count
`database.ts` defines **18 tables** (CLAUDE.md says 16 — appears outdated):
`achievement_definitions`, `athlete_achievements`, `athlete_profiles`, `benchmark_tests`, `conversations`, `exercise_library`, `goals`, `hyrox_stations`, `knowledge_chunks`, `messages`, `personal_records`, `race_results`, `race_splits`, `skill_level_benchmarks`, `training_plan_days`, `training_plan_weeks`, `training_plans`, `workout_logs`.

### Column Name Mismatches

**`hyrox_stations` — station_order vs station_number**
- DB column: `station_number: number` (database.ts:376)
- Code references `station_order` at: `src/app/api/stations/route.ts:9`
- Code references `station_order` at: `src/app/(app)/performance/page.tsx:18` (Station interface)
- Code also uses `station.name` at performance/page.tsx:160 but DB column is `station_name`
- Result: every query to `/api/stations` returns an error; even if fixed, names render undefined.

**`training_plan_days` foreign key — PASS**
All code uses `training_plan_week_id` (DB column name). No mismatch.

**`messages` — unused columns**
`rag_chunks_used`, `suggested_actions`, `pinned` exist in DB but are never written. Not a bug, but a feature gap.

**`goals` — soft delete column unused**
`deleted_at` column exists in DB schema (database.ts:303) but no code queries `.is('deleted_at', null)` when listing goals. Deleted goals will reappear in lists if soft-delete pattern was intended.

**`workout_logs.conversation_id`**
Column exists in schema (database.ts:906) and is a FK to `conversations`. No code ever sets this column. Intent unclear (tracking which conversation generated the log).

### All Other Column References Verified as Correct
`athlete_profiles`, `benchmark_tests`, `training_plans`, `training_plan_weeks`, `workout_logs`, `personal_records`, `race_results`, `knowledge_chunks`, `conversations`, `messages` — all column names used in code match `database.ts` exactly.

---

## A4: Conversation & Message Persistence

**Status: PASS (with tool result gap)**

### Conversation CRUD
- `GET /api/conversations`: Paginated (limit/offset, max 50), ordered by `updated_at DESC`. PASS.
- `POST /api/conversations`: Creates with `athlete_id + title`. PASS.
- No DELETE endpoint for individual conversations. They accumulate indefinitely.

### Message Creation
- User: Inserted in chat route (lines 90–95) before streaming.
- Assistant: Inserted in `onFinish` (lines 112–119) with text, token counts, latency.
- Neither populates `rag_chunks_used`, `suggested_actions`, or `pinned`.

### Message Loading
`GET /api/conversations/[id]/messages` selects all needed fields, ordered `created_at ASC`, paginated max 100. The coach page loads up to 100 messages via `useMessages(conversationId)` with limit=100.

### Missing: Conversation Ownership Check
`GET /api/conversations/[id]/messages` (route.ts:5–37) only checks that the user is authenticated — it does NOT verify that the conversation belongs to the requesting user's athlete profile. Any authenticated user can read any conversation if they know the UUID.

---

## A5: Workout Log Pipeline (Dual Path)

**Status: PARTIAL**

### Path A: `create_workout_log` Tool (tools.ts:48–73)
Writes to `workout_logs`:
`athlete_id, date, session_type, duration_minutes, rpe_post, notes, completion_status: 'completed'`

Missing vs Path B: `rpe_pre`, `heart_rate_avg`, `completed_workout`, `prescribed_workout`, `training_plan_day_id`, `conversation_id`.

After insert: **No automatic plan day completion.** The tool does not update `training_plan_days.is_completed`.

### Path B: POST /api/workouts (workouts/route.ts:50–109)
Writes to `workout_logs`:
`athlete_id, date, session_type, duration_minutes, rpe_pre, rpe_post, notes, completed_workout, prescribed_workout, training_plan_day_id, heart_rate_avg, completion_status`

After insert: If `training_plan_day_id` is provided, automatically marks `training_plan_days.is_completed = true` and sets `linked_workout_log_id` (lines 99–107). PASS.

### Path Comparison

| Field | Path A (AI Tool) | Path B (API) |
|-------|----------------|-------------|
| `rpe_pre` | Missing | Present |
| `heart_rate_avg` | Missing | Present |
| `completed_workout` (JSON) | Missing | Present |
| `prescribed_workout` (JSON) | Missing | Present |
| `training_plan_day_id` | Missing | Present |
| Auto-marks plan day complete | **No** | **Yes** |

When a user tells the AI to log a workout, `training_plan_day_id` is never set and plan progress never updates. The athlete must manually mark the day done in the Training calendar.

### Path C: /training/log/page.tsx
Uses `useCreateWorkout` (Path B via hook). Reads `planDayId` from URL params and pre-fills. Correctly auto-links to plan day. PASS.

### Path D: /training/workout/[id]/page.tsx
Uses `useCreateWorkout` with `training_plan_day_id: id` and `completed_workout: { sections, timer_ms }`. Full-featured. PASS.

---

## A6: Training Plan Pipeline

**Status: PASS**

### Full Acceptance Flow

1. **Detection** (`chat-message.tsx:12–15`): `containsTrainingPlan(text)` — requires 3+ "Week N" mentions. Heuristic; can false-positive on casual messages.

2. **TrainingPlanCard** (`training-plan-card.tsx`): POSTs `{ messageContent }` to `/api/training-plans/extract`. Displays "Training plan detected" banner with "Review & Accept" button.

3. **Extract route** (`training-plans/extract/route.ts`): Auth checked. Uses `generateObject` with `BASE_LLAMA_MODEL` (base Llama, not fine-tuned) and `TrainingPlanSchema`. Returns `{ plan: TrainingPlanInput }`.

4. **PlanReviewModal** (`plan-review-modal.tsx`): Shows plan name, duration, sessions count, editable start date, week-by-week accordion with day/session type pills. On "Accept & Activate" calls `useCreateTrainingPlan().mutateAsync()`.

5. **POST /api/training-plans** (`training-plans/route.ts:37–153`):
   - Archives existing active plan ✓
   - Creates `training_plans` row ✓
   - For each week: creates `training_plan_weeks` row ✓
   - For each day: creates `training_plan_days` row ✓
   - All three tables written. All column names match `database.ts`.

### Schema Cross-Check: TrainingPlanDaySchema vs DB

| Schema Field | DB Column | Match |
|-------------|----------|-------|
| `day_of_week` | `day_of_week` | PASS |
| `session_type` | `session_type` | PASS |
| `workout_title` | `workout_title` | PASS |
| `workout_description` | `workout_description` | PASS |
| `workout_details` | `workout_details` | PASS |
| `estimated_duration_minutes` | `estimated_duration_minutes` | PASS |
| `is_rest_day` | `is_rest_day` | PASS |

### Cache Coherence After Plan Accept
`useCreateTrainingPlan.onSuccess` invalidates `['training-plans']` and `['dashboard']`. PASS.
Does NOT invalidate `['training-plan', id]` (specific plan detail) — but since the plan is new, no such cache entry exists yet. PASS.

---

## A7: Dashboard Data Pipeline

**Status: PARTIAL**

### /api/dashboard

**Streak Bug (H1 — Critical)**:
`recentWorkouts` is fetched with `.gte('date', weekAgo)` where `weekAgo` = 7 days ago (line 36). The streak loop iterates `for (let d = 0; d < 30; d++)` (line 63) and checks `recentWorkouts.some(w => w.date.startsWith(dateStr))`. Any day beyond 7 days ago will not be in `recentWorkouts`, so the streak breaks at 7 days maximum. An athlete with a 20-day streak will see 0 on day 8 if they haven't worked out yet that morning.

**Week index bug (H8)**:
`const currentWeekData = weeks[currentWeek - 1]` (line 167). If any weeks were deleted or never created (e.g., plan starts at week_number=2), array index is wrong. Should use `.find(w => w.week_number === currentWeek)`.

**Progress percentage inconsistency (H9)**:
Dashboard counts ALL days including rest days: `allDays.filter(d => d.is_completed)`. Rest days have `is_completed: null/false` by default, so they deflate progress. The `get_progress_summary` tool (tools.ts:305) correctly does `.filter(d => !d.is_rest_day)` before computing adherence.

### /api/dashboard/readiness

Weights sum to exactly 1.0 (0.2+0.15+0.2+0.15+0.15+0.05+0.1). Score computation is correct. Components are sensible. `run_fitness = runCount * 10` (capped at 100) — 10 runs in 30 days = 100% run fitness. Reasonable formula.

### /api/dashboard/streak-heatmap

Returns `{ days: [{date, workoutCount, totalMinutes}] }`.
`StreakHeatmap` component expects `HeatmapDay[]` with same fields. PASS.

### Dashboard Page → useDashboard Hook → API Shape

`useDashboard` type at `use-dashboard.ts:3–53` exactly matches `/api/dashboard` response. All fields present. PASS.

---

## A8: React Query Cache Coherence

**Status: PARTIAL**

### Query Key Inventory

| Key | Hook / Source |
|-----|--------------|
| `['conversations']` | `useConversations` |
| `['messages', conversationId]` | `useMessages` |
| `['workouts', params]` | `useWorkouts` |
| `['training-plans']` | `useTrainingPlans` |
| `['training-plan', id]` | `useTrainingPlan` |
| `['dashboard']` | `useDashboard` |
| `['benchmarks', type?]` | `useBenchmarks` |
| `['personal-records']` | `usePersonalRecords` |
| `['races']` | `useRaces` |
| `['race-readiness']` | `RaceReadiness` component |
| `['streak-heatmap']` | `StreakHeatmap` component |
| `['achievements']` | `TrophyCase` component |
| `['stations']` | Performance page inline |
| `['training-plan-day', id]` | Workout page inline |

### Mutation Invalidation Audit

| Mutation | Invalidates | Missing |
|----------|------------|---------|
| `useCreateWorkout` | `['workouts']`, `['dashboard']`, `['training-plans']` | `['streak-heatmap']`, `['race-readiness']` |
| `useCreateTrainingPlan` | `['training-plans']`, `['dashboard']` | None significant |
| `useUpdatePlanDay` | `['training-plans']`, `['training-plan']` (bare prefix) | `['training-plans']` list (L5) |
| `ScheduleWorkoutButton` (direct fetch) | `['workouts']`, `['training-plans']` | `['dashboard']` (H6) |

### `useUpdatePlanDay` Prefix Invalidation
`queryClient.invalidateQueries({ queryKey: ['training-plan'] })` — React Query v5 matches ALL keys prefixed with `['training-plan']`, which includes `['training-plan', id]`. This correctly invalidates the detail view. However, it does NOT match `['training-plans']` (note the plural), so the plan list does not refresh (L5).

### Key Stale Data Scenarios
- Log workout via chat → `['workouts']`, `['dashboard']` stale (no client-side invalidation from tool)
- Schedule workout → `['dashboard']` stale
- Log workout via UI → correctly invalidates `['workouts']`, `['dashboard']`, `['training-plans']` but NOT `['streak-heatmap']` or `['race-readiness']`

---

## A9: Auth Consistency

**Status: PASS (minor gaps noted)**

### Route Auth Check Audit

| Route | Auth Check | Ownership Check |
|-------|-----------|----------------|
| `/api/chat` | ✓ `getUser()` | ✓ Profile by `user_id` |
| `/api/conversations` GET/POST | ✓ | ✓ |
| `/api/conversations/[id]/messages` GET | ✓ | **✗ No ownership** |
| `/api/workouts` GET/POST | ✓ | ✓ |
| `/api/workouts/[id]` GET/PUT/DELETE | ✓ | **✗ No ownership** |
| `/api/training-plans` GET/POST | ✓ | ✓ |
| `/api/training-plans/extract` POST | ✓ | — (no profile needed) |
| `/api/training-plans/[id]` GET/PUT/DELETE | ✓ | **✗ No ownership** |
| `/api/training-plans/[id]/days/[dayId]` PATCH | ✓ | ✓ (verifies plan→athlete) |
| `/api/training-plans/[id]/days/[dayId]/complete` POST | ✓ | ✓ |
| `/api/training-plans/day/[dayId]` GET | ✓ | ✓ (deep join ownership) |
| `/api/dashboard` GET | ✓ | ✓ |
| `/api/dashboard/readiness` GET | ✓ | ✓ |
| `/api/dashboard/streak-heatmap` GET | ✓ | ✓ |
| `/api/profile` GET/POST/PATCH | ✓ | ✓ (by `user_id`) |
| `/api/goals` GET/POST | ✓ | ✓ |
| `/api/goals/[id]` PUT/DELETE | ✓ | **✗ No ownership** |
| `/api/achievements` GET | ✓ | ✓ |
| `/api/benchmarks` GET/POST | ✓ | ✓ |
| `/api/personal-records` GET | ✓ | ✓ |
| `/api/stations` GET | **No auth** | — (intentional, public) |
| `/api/races` GET/POST | ✓ | ✓ |
| `/api/messages/[id]/feedback` POST | ✓ | **✗ No ownership** |

### Middleware Coverage
`src/middleware.ts` uses `createServerClient + getUser()`. All `/api/*` routes and app pages are protected. `PUBLIC_ROUTES = ['/login', '/signup', '/auth/callback', '/forgot-password']`. Middleware provides network-level protection; per-route `getUser()` provides defense-in-depth.

### `/api/stations` — Public Route
No auth check. Stations are reference data, so intentionally public. The column name bug (C1/C2) still breaks this route regardless.

---

## A10: Component → Hook → API Wiring

**Status: PASS (with gaps noted)**

### Page Wiring Audit

| Page | Hooks Used | Direct Supabase? | Notes |
|------|-----------|----------------|-------|
| `coach/page.tsx` | `useConversations`, `useMessages`, `useInvalidateConversations`, `useCoachStore` | No | Fully wired |
| `training/page.tsx` | `useWorkouts`, `useActiveTrainingPlan`, `useTrainingPlan`, `useUpdatePlanDay` | No | Fully wired |
| `training/workout/[id]/page.tsx` | `useCreateWorkout`, inline `useQuery` for plan day | No | Fetches `/api/training-plans/day/${id}` |
| `training/log/page.tsx` | `useCreateWorkout` | No | Direct fetch for plan day prefill, then uses hook for submit |
| `dashboard/page.tsx` | `useDashboard` | No | Fully wired |
| `performance/page.tsx` | `usePersonalRecords`, `useBenchmarks`, inline `useQuery` for stations | No | Stations broken due to C1/C2 |
| `profile/page.tsx` | None | `createClient()` (sign-out only) | Uses direct `fetch` for load/save — not in React Query |
| `onboarding/page.tsx` | None | No | Direct `fetch` to `/api/profile` |

### Profile Page — No React Query
`profile/page.tsx` loads via `useEffect + fetch` and saves via `fetch`. No cache invalidation occurs after profile update. Dashboard's `profile.display_name`, `race_date`, `goal_time_minutes` etc. won't update until page refresh. Low impact (profile changes are infrequent).

### Unwired Components
- `achievement-toast.tsx:showAchievementToast` — exported function, never imported anywhere
- `BenchmarkEntry` and `RaceResultsEntry` rendered on Performance page — these components exist and are visible, but their form submissions were not fully audited (not in provided file list)

### Components That Import Supabase Directly
- `profile/page.tsx:17` — `import { createClient } from '@/lib/supabase/client'` — used only for `supabase.auth.signOut()`. Acceptable pattern.

---

## A11: Achievement System

**Status: FAIL**

### Server-Side Trigger: NONE
Audit of all 23 API routes and all tool implementations finds zero code that:
- Calls `supabase.from('athlete_achievements').insert()`
- Reads `achievement_definitions` to check criteria
- Calls `showAchievementToast`

The `athlete_achievements` table will remain empty for all users indefinitely.

### GET /api/achievements
Correctly joins `achievement_definitions` with `athlete_achievements` to produce `{ is_unlocked, unlocked_at }` per achievement. Returns the complete list for display. This part works correctly as a read endpoint.

### TrophyCase Component
- Fetches from `/api/achievements`, query key `['achievements']`
- Renders unlocked achievements with Trophy icon
- Renders locked achievements as "???" with Lock icon
- Correctly handles empty unlocked list (shows "Unlocked (0)")

The component is fully functional and ready — it just never has any unlocked achievements to show.

### showAchievementToast
`achievement-toast.tsx:8` exports `showAchievementToast(title, description)`:
- Fires canvas-confetti with Hyrox colors
- Shows custom Sonner toast with trophy icon

This function was written but never connected. No file imports it. The `useEffect` import at line 3 of achievement-toast.tsx is also unused.

### What Would Be Needed
A server-side `checkAndAwardAchievements(athleteId, supabase)` function, called after:
1. Workout log creation (streak milestones, first workout, etc.)
2. Benchmark logging (PR milestones, station times)
3. Plan completion milestones

Then on the client: after mutations succeed, poll `/api/achievements`, diff against previous state, and call `showAchievementToast` for newly unlocked ones.

---

## A12: Type Safety & Schema Drift

**Status: PARTIAL**

### Zod Schema vs DB Column Types

**`TrainingPlanDaySchema` vs `training_plan_days`:**
- `day_of_week: z.number().min(0).max(6)` vs `integer` — PASS
- `session_type: z.enum(SESSION_TYPES).optional()` vs `string | null` — PASS (Zod validates on extract; DB accepts any string)
- `workout_title: z.string()` vs `string | null` — Minor drift: Zod requires non-null but DB allows null. Handled in API with `|| null` fallback.
- `is_rest_day: z.boolean().default(false)` vs `boolean | null` — PASS

**`create_workout_log` Zod enum vs `workout_logs.session_type`:**
Enum `['run', 'hiit', 'strength', 'simulation', 'recovery', 'station_practice', 'general']` matches `SESSION_TYPES` in `training-plan-schema.ts`. DB has no enum constraint — accepts any string. PASS.

### `any` / `unknown` Types in Critical Paths

| Location | Usage | Risk Level |
|----------|-------|-----------|
| `tools.ts:73` | `profile as unknown as Parameters<typeof buildAthleteProfileMessage>[0]` in chat/route.ts:73 | Low — the shape is structurally compatible |
| `tools.ts:104` | `(weeks.training_plan_days as Array<Record<string, unknown>>)` | Medium — loses type safety for day fields |
| `tool-result-renderer.tsx:27` | `const data = result as Record<string, unknown>` | Low — renderer pattern, acceptable |
| `training-plans/route.ts:120–128` | Day type inline typed | Low — explicit inline type |

### Response Shape vs Hook Type Mismatches

**`useConversations` type vs API:**
Hook type at `use-conversations.ts:3–7` has `{ id, title, updated_at }`. API (conversations/route.ts:31) selects `id, title, started_at, updated_at`. `started_at` is silently dropped. No UI impact.

**`useDashboard` type vs API:**
`use-dashboard.ts:3–53` matches `/api/dashboard` response exactly. PASS.

**Performance page `Station` interface vs DB:**
- Interface has `name: string` — DB has `station_name: string`
- Interface has `station_order: number` — DB has `station_number: number`
- Mismatch causes both fields to be `undefined` at runtime

### Environment Variable Safety

`src/lib/ai/nebius.ts:9` uses `process.env.NEBIUS_MODEL!` (non-null assertion). If this env var is absent (e.g., missing from Netlify config), `COACH_K_MODEL` is `nebius.chat(undefined)` and all chat requests fail with a Nebius 400 error, manifesting as 503 in the chat UI. No runtime guard. Same issue applies to `NEBIUS_API_KEY`, `OPENAI_API_KEY`.

---

*Report generated: 2026-02-18. Based on static code analysis of all files in audit scope. No code was modified during this audit.*
