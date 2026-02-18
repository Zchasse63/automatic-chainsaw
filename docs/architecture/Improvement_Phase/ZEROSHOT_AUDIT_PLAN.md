# Hyrox AI Coach — Comprehensive Audit & Remediation Plan

> **Purpose**: Full functional audit of every feature in the implementation plan, followed by targeted fixes. All files from IMPLEMENTATION_PLAN.md exist in the codebase, but many may be stubs, disconnected, or improperly wired. This plan verifies every data flow end-to-end.
>
> **Execution**: Via Zeroshot multi-agent clusters, phased for reliability.

---

## Phase 1: DEEP AUDIT (Research Only — No Code Changes)

### Zeroshot Task File: `audit-phase1.md`

**Classification**: STANDARD:INQUIRY (research/audit)

Perform a comprehensive functional audit of the Hyrox AI Coach codebase. Do NOT modify any code — this is a research task only.

**Context**: This is a Next.js 16 app with:
- AI SDK v6 (`streamText`, `useChat`) for coach chat
- 10 coaching tools defined in `src/lib/ai/tools.ts`
- Supabase PostgreSQL + PGVector for database
- React Query + Zustand for state management
- 25 API routes, 8 app pages, 16 hooks

**AUDIT AREAS**:

#### A1. Tool Call Pipeline (Critical)
For each of the 10 tools in `src/lib/ai/tools.ts`:
- [ ] Does the tool's `execute` function actually query/write to Supabase correctly?
- [ ] Does it handle errors gracefully (try/catch, user-friendly messages)?
- [ ] Does the tool result match what `tool-result-renderer.tsx` expects to render?
- [ ] Are Zod schemas complete and accurate for each tool's input?
- [ ] Does `search_knowledge_base` actually perform hybrid search (vector + keyword)?
- [ ] Does `create_workout_log` write to `workout_logs` table with correct schema?
- [ ] Does `get_today_workout` correctly match today's date to `training_plan_days`?
- [ ] Does `get_training_plan` return the full plan with weeks and days?
- [ ] Does `update_training_plan_day` validate and persist changes?
- [ ] Does `log_benchmark` write to `benchmark_tests` and check for PRs in `personal_records`?
- [ ] Does `get_athlete_stats` pull profile, weekly stats, and PRs?
- [ ] Does `set_goal` write to `goals` table correctly?
- [ ] Does `get_progress_summary` calculate adherence, trends, and goals?
- [ ] Does `calculate_race_pacing` use correct Hyrox pacing formulas?

#### A2. Chat → Database Round-Trip
- [ ] Message sent in coach page → hits `/api/chat` → creates conversation if new → persists user message → streams AI response → persists assistant message → message appears in conversation history on reload
- [ ] Conversation switching: selecting a different conversation loads its messages correctly via `useMessages()` → `setMessages()` in `useChat`
- [ ] Cold start handling: 5-second timeout, user sees indicator
- [ ] Tool results persist: if AI calls a tool, the tool result is visible when reloading the conversation
- [ ] Feedback: thumbs up/down on messages → POST `/api/messages/[id]/feedback` → persists → reflects on reload

#### A3. Workout Logging (Dual Path)
Path 1 — Via Chat:
- [ ] User says "log my workout" → AI calls `create_workout_log` tool → `WorkoutLoggedCard` renders → data appears in `workout_logs` table → reflects on dashboard stats → reflects in training page "Recent Workouts"

Path 2 — Via Training Page:
- [ ] User clicks "Start Workout" on a plan day → navigates to `/training/workout/[id]` → timer works → section logger captures data → RPE slider works → "Complete Workout" submits to `/api/workouts` → updates `training_plan_days.is_completed` → data flows to dashboard

- [ ] Both paths result in the SAME data format in `workout_logs`
- [ ] Dashboard `useDashboard` hook correctly aggregates data from both paths

#### A4. Training Plan Flow
- [ ] Coach generates plan text → `containsTrainingPlan()` detects it → `TrainingPlanCard` shows "Review & Accept" → click triggers `/api/training-plans/extract` → `generateObject` extracts structured plan → `PlanReviewModal` opens → user accepts → plan saved to `training_plans` + `training_plan_weeks` + `training_plan_days` → plan appears in training page
- [ ] Week calendar renders all weeks/days correctly from plan data
- [ ] Day click opens drawer with workout details + "Start Workout" + "Mark Done" buttons
- [ ] Drag-and-drop rescheduling works (if implemented) → persists via `useUpdatePlanDay`
- [ ] Plan progress bar calculates correctly (completed/total days)

#### A5. Dashboard Data Flow
- [ ] `GET /api/dashboard` returns: profile, weeklyStats, streak, todaysWorkout, activePlan, lastConversation, recentPRs, goals, daysUntilRace
- [ ] Each data point is sourced from the correct table and is accurate
- [ ] `ExpandableStatCard` renders charts (`WeeklyVolumeChart`, `RpeTrendChart`) with real data
- [ ] `StreakHeatmap` fetches from `/api/dashboard/streak-heatmap` and renders 90 days
- [ ] `RaceReadiness` fetches from `/api/dashboard/readiness` and shows 7-component score
- [ ] Today's workout card links to correct workout execution page
- [ ] Active plan card links to training page

#### A6. Performance Page
- [ ] `BenchmarkEntry` dialog → submits to `/api/benchmarks` → data appears in benchmarks tab
- [ ] `RaceResultsEntry` dialog → submits to `/api/races` → data appears (where?)
- [ ] Stations tab shows all 8 Hyrox stations with best benchmark times
- [ ] PRs tab shows records from `personal_records` table
- [ ] React Query hooks (`useBenchmarks`, `usePersonalRecords`) invalidate correctly after mutations

#### A7. Achievement System
- [ ] `TrophyCase` component renders on profile page
- [ ] `GET /api/achievements` returns unlocked + locked achievements
- [ ] Achievement triggers: what events check for achievement unlocks? (workout log? benchmark PR? streak?)
- [ ] `AchievementToast` triggers on new unlock — is this wired?

#### A8. Calendar & Scheduling
- [ ] Week calendar: renders current week from plan, days are clickable
- [ ] Month calendar: `MonthCalendar` component shows full month with workout dots
- [ ] Calendar view toggle (week/month) works on training page
- [ ] Schedule from chat: `ScheduleWorkoutButton` in tool result cards → date picker → writes to plan days → invalidates cache

#### A9. Profile & Onboarding
- [ ] Onboarding flow collects: name, age, sex, weight, height, Hyrox division, race date, goal time, experience level, equipment, injuries
- [ ] Profile data saved to `athlete_profiles` table
- [ ] Profile page displays all data + allows editing
- [ ] Profile page shows trophy case
- [ ] Profile data flows to system prompt via `buildAthleteProfileMessage()`

#### A10. API Route Completeness
For each of the 25 API routes, verify:
- [ ] Auth middleware: does it call `createServerClient()` and check `auth.getUser()`?
- [ ] RLS: are database queries protected by Row Level Security policies?
- [ ] Error handling: proper HTTP status codes, error messages
- [ ] CORS/headers: no issues with cross-origin or missing headers

#### A11. Routing & Navigation
- [ ] All navigation links work (sidebar, header, inter-page links)
- [ ] Auth guard: unauthenticated users redirected to login
- [ ] Middleware routes: `/coach`, `/dashboard`, `/training`, `/performance`, `/profile` require auth
- [ ] Deep links work: `/training/workout/[id]` with valid/invalid IDs
- [ ] Back navigation doesn't break state

#### A12. State Management
- [ ] React Query cache keys are consistent across hooks
- [ ] Mutations invalidate the correct query keys
- [ ] Zustand `coach-store` persists active conversation ID to localStorage
- [ ] No stale data after mutations (e.g., log workout → dashboard updates immediately)
- [ ] Error states handled for all queries (loading, error, empty)

**OUTPUT**: Create a detailed markdown report at `docs/architecture/Improvement_Phase/AUDIT_REPORT.md` containing:
1. Executive summary with overall health score
2. For each area (A1-A12): status, findings, issues found with file:line references
3. Critical issues list (blocking functionality)
4. High-priority issues (degraded UX)
5. Low-priority issues (polish)
6. Recommended fix order

---

## Phase 2: CRITICAL FIXES (Based on Audit)

After Phase 1 audit is complete, execute fixes for all CRITICAL issues found.

Read `docs/architecture/Improvement_Phase/AUDIT_REPORT.md` first for context.

**Scope**: Only fix issues marked as CRITICAL in the audit report. These are issues where:
- A feature doesn't work at all (broken tool calls, missing DB queries)
- Data doesn't persist or flows to the wrong place
- A page crashes or shows no data
- Navigation is broken

**Requirements**:
- Preserve all existing working functionality
- Follow existing code patterns (React Query hooks, B0 design tokens, Zustand patterns)
- Test each fix by verifying the data flow described in the audit
- After each file change, ensure `bun run build` still passes

---

## Phase 3: CALENDAR ENHANCEMENT (New Feature)

### Objective
Create a dedicated full-page calendar view, separate from the training page's small embedded calendar. Users need a larger, more usable calendar where each day can be expanded to show full workout details.

### Requirements

1. **New route**: `/calendar` — dedicated calendar page in the app shell
2. **Full-page month view**: Large grid showing the entire month
   - Each day cell shows: workout title (truncated), session type badge, completion status
   - Rest days shown differently (muted styling)
   - Color-coded by session type (using existing B0 color tokens)
3. **Day expansion**: Click any day to expand it into a detailed view showing:
   - Full workout title and description
   - Exercise details (if available from `training_plan_days.workout_details` JSONB)
   - Session type, estimated duration
   - Completion status with ability to mark done
   - "Start Workout" button linking to `/training/workout/[id]`
   - Logged workout data if completed (duration, RPE, notes)
4. **Week navigation**: Previous/next week arrows, "Today" button to snap back
5. **Month navigation**: Previous/next month arrows
6. **Data sources**: Merge training plan days + logged workouts onto the same calendar
7. **Mobile-first**: Responsive — single column on mobile with list view, grid on desktop
8. **Add to app navigation**: Add "Calendar" link to the sidebar/bottom nav

### Design Constraints
- Use existing B0 design system tokens (globals.css)
- Use existing shadcn/ui primitives
- Use `react-day-picker` (already installed) as the base calendar
- Follow existing page patterns (loading skeletons, empty states)
- Use React Query for data fetching (create `useCalendarData` hook if needed)

### Files to Create/Modify
- NEW: `src/app/(app)/calendar/page.tsx` — Calendar page
- NEW: `src/components/calendar/full-calendar.tsx` — Full-page calendar component
- NEW: `src/components/calendar/day-detail-panel.tsx` — Expanded day view
- NEW: `src/hooks/use-calendar.ts` — React Query hook for calendar data
- MODIFY: App navigation (sidebar/bottom nav) to include Calendar link

---

## Phase 4: HIGH-PRIORITY FIXES (Based on Audit)

After Phases 2-3, fix all HIGH-PRIORITY issues from the audit.

Read `docs/architecture/Improvement_Phase/AUDIT_REPORT.md` for context.

**Scope**: Issues where:
- A feature works but data is incomplete or inconsistent
- UX is confusing or broken in edge cases
- Cache invalidation is missing (stale data shown)
- Error handling is absent

---

## Phase 5: POLISH & INTEGRATION VERIFICATION

Final verification pass:
1. Run `bun run build` — must pass with zero errors
2. Verify all 25 API routes respond correctly
3. Verify all inter-page navigation works
4. Verify all React Query cache invalidations trigger correctly
5. Verify the new calendar page works end-to-end
6. Check mobile responsiveness on all pages

**OUTPUT**: Update `docs/architecture/Improvement_Phase/AUDIT_REPORT.md` with:
- Completion status for each finding
- Any remaining known issues
- Final health score
