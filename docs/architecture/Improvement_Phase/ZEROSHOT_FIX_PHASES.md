# Zeroshot Fix Phases — All 28 Audit Issues

> Reference: `docs/architecture/Improvement_Phase/AUDIT_REPORT.md`
> All issues from the audit get fixed. No exceptions.

---

## Phase 2A: Security & Ownership (10 issues)

**Issues**: C3, C4, C5, C6, C7, C8, L3, L4, L10, plus mass-assignment hardening

**Pattern**: Add `.eq('athlete_id', profile.id)` ownership checks to all unprotected routes, and add field-filtering to prevent mass-assignment.

**Files**:
- `src/app/api/goals/[id]/route.ts` — C3, C4
- `src/app/api/workouts/[id]/route.ts` — C5, C6
- `src/app/api/training-plans/[id]/route.ts` — C7
- `src/app/api/conversations/[id]/messages/route.ts` — C8
- `src/app/api/messages/[id]/feedback/route.ts` — L3
- `src/app/api/training-plans/[id]/days/[dayId]/route.ts` — L4
- `src/app/api/profile/route.ts` — L10

---

## Phase 2B: Schema & Data Integrity (5 issues)

**Issues**: C1, C2, H1, H8, H9

**Files**:
- `src/app/api/stations/route.ts` — C1 (`station_order` → `station_number`)
- `src/app/(app)/performance/page.tsx` — C2 (Station interface: `name` → `station_name`, `station_order` → `station_number`)
- `src/app/api/dashboard/route.ts` — H1 (streak 7-day → 90-day), H8 (week index → `.find()`), H9 (exclude rest days from progress)

---

## Phase 2C: AI Pipeline Resilience (6 issues)

**Issues**: H2, H3, H4, H5, L9, L11

**Files**:
- `src/lib/ai/tools.ts` — H2 (`get_today_workout` try/catch), H3 (`get_training_plan` try/catch)
- `src/app/api/chat/route.ts` — H4 (persist tool calls in onFinish)
- `src/app/(app)/coach/page.tsx` — H5 (reconstruct tool parts on conversation reload)
- `src/lib/ai/nebius.ts` — L9 (env var runtime validation)
- `src/components/coach/chat-message.tsx` — L11 (tighten plan detection heuristic)

---

## Phase 2D: Cache Coherence & Wiring (6 issues)

**Issues**: H6, H7, L5, L6, L7, L8

**Files**:
- `src/components/training/schedule-workout-button.tsx` — H6 (add `['dashboard']` invalidation)
- `src/lib/ai/tools.ts` — H7 (`log_benchmark` PR detection + `personal_records` insert)
- `src/hooks/use-training-plans.ts` — L5 (invalidate `['training-plans']` plural)
- `src/hooks/use-workouts.ts` — L6 (stable query key serialization)
- `src/app/(app)/training/page.tsx` — L7 (null-safe `start_date`)
- `src/stores/coach-store.ts` — L8 (type consistency for null/undefined)

---

## Phase 2E: Achievement System (2 issues + new feature)

**Issues**: L1, L2

**New code needed**:
- Server-side `checkAndAwardAchievements(athleteId, supabase)` function
- Call it after workout log creation and benchmark logging
- Client-side: after mutations, check for new achievements and trigger `showAchievementToast`
- Wire the existing `achievement-toast.tsx` into the app

**Files**:
- NEW: `src/lib/achievements.ts` — achievement check logic
- `src/app/api/workouts/route.ts` — call achievement check after workout insert
- `src/app/api/benchmarks/route.ts` — call achievement check after benchmark insert
- `src/components/achievements/achievement-toast.tsx` — L1 (wire into app)
- `src/app/api/achievements/route.ts` — L2 (add POST endpoint for awarding)

---

## Tracking

| Phase | Issues | Status |
|-------|--------|--------|
| 2A | C3,C4,C5,C6,C7,C8,L3,L4,L10 | PENDING |
| 2B | C1,C2,H1,H8,H9 | PENDING |
| 2C | H2,H3,H4,H5,L9,L11 | PENDING |
| 2D | H6,H7,L5,L6,L7,L8 | PENDING |
| 2E | L1,L2 | PENDING |
