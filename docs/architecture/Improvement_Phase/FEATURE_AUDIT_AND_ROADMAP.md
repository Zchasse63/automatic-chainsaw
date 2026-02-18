# Hyrox AI Coach — Feature Audit & Roadmap

> **Generated**: February 2026
> **App URL**: https://hyrox-ai-coach.netlify.app
> **Stack**: Next.js 16.1.6 · React 19 · TypeScript 5.9 · Tailwind CSS v4 · Supabase · Llama 3.3 70B LoRA (Nebius)

---

## Table of Contents

1. [Tech Stack Summary](#1-tech-stack-summary)
2. [Feature Inventory by Domain](#2-feature-inventory-by-domain)
   - [Authentication & Onboarding](#21-authentication--onboarding)
   - [AI Coach Chat](#22-ai-coach-chat)
   - [Training Plans](#23-training-plans)
   - [Training Calendar](#24-training-calendar)
   - [Workout Logging](#25-workout-logging)
   - [Dashboard](#26-dashboard)
   - [Performance Tracking](#27-performance-tracking)
   - [Profile Management](#28-profile-management)
   - [Goals System](#29-goals-system)
3. [API Endpoint Inventory](#3-api-endpoint-inventory)
4. [Database Schema Audit](#4-database-schema-audit)
5. [AI / ML Pipeline](#5-ai--ml-pipeline)
6. [Component Library](#6-component-library)
7. [State Management & Data Flow](#7-state-management--data-flow)
8. [Cross-Page Integration](#8-cross-page-integration)
9. [What's Missing — Gap Analysis](#9-whats-missing--gap-analysis)
10. [Roadmap — Prioritized Feature Proposals](#10-roadmap--prioritized-feature-proposals)

---

## 1. Tech Stack Summary

| Layer | Technology | Details |
|-------|-----------|---------|
| **Framework** | Next.js 16.1.6 | Turbopack default, App Router |
| **Language** | TypeScript 5.9 | Strict mode |
| **UI** | React 19 | Client components with `'use client'` |
| **Styling** | Tailwind CSS v4 | Oxide engine, custom design tokens, dark mode default |
| **Components** | shadcn/ui (21) + Kokonut Free (22) + Kokonut Pro (8) | new-york style base |
| **State** | React Query v5 + Zustand v5 | Server state caching + ephemeral UI state |
| **Auth** | Supabase Auth | Email/password + Google OAuth |
| **Database** | Supabase PostgreSQL | 16+ tables, Row Level Security |
| **Vector DB** | Supabase PGVector | 239 embedded chunks, hybrid search |
| **AI Model** | Llama 3.3 70B LoRA | Fine-tuned on 924 examples via Nebius Token Factory |
| **Embeddings** | OpenAI text-embedding-3-small | 1536 dimensions |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable | Training calendar reordering |
| **Toasts** | Sonner | Dark-themed, positioned top-center |
| **Deployment** | Netlify | Auto-deploy from main branch |
| **Package Manager** | Bun 1.3.9 | |

---

## 2. Feature Inventory by Domain

### 2.1 Authentication & Onboarding

#### Login Page (`/login`)

| Element | Details |
|---------|---------|
| **Email/password** | Standard email input + password field with show/hide toggle (Eye/EyeOff icons) |
| **Google OAuth** | One-click Google sign-in with inline SVG logo, redirects through Supabase OAuth flow |
| **Error handling** | Displays error box for invalid credentials, also checks URL `?error=auth_callback_failed` for post-OAuth failures |
| **Redirect** | Reads `?redirect` query param, defaults to `/dashboard` on success |
| **Navigation** | Links to `/signup` and `/forgot-password` |
| **Loading state** | Submit button shows spinner, disables during request |

#### Signup Page (`/signup`)

| Element | Details |
|---------|---------|
| **Fields** | Email, password (min 6 chars), confirm password |
| **Validation** | Client-side: passwords must match, min length 6 |
| **Success state** | Switches to "Check Your Email" confirmation view with user's email displayed |
| **Google OAuth** | Same flow as login |
| **Email confirmation** | Uses Supabase email confirmation redirect to `/onboarding` |

#### Onboarding Flow (`/onboarding`)

5-step wizard that builds the athlete profile. Each step has a progress bar (5 segments) and step counter.

| Step | Title | Fields | Required? |
|------|-------|--------|-----------|
| **0** | Identity | Display Name (text), Date of Birth (date), Sex (select: Male/Female/Other), Weight in kg (number), Height in cm (number) | Display Name required |
| **1** | Hyrox Experience | Division (select: Open/Pro/Doubles/Relay), Race Count (select: 0/1/2-3/4-5/6+), Experience Level (select: Beginner/Intermediate/Advanced) | All optional |
| **2** | Current Training | Running miles/week (number), Strength days/week (number, 0-7), Weekly availability hours (number), Equipment available (multi-select checkboxes: SkiErg, Rower, Sled Push, Sled Pull, Burpee Broad Jump, Sandbag Lunges, Wall Balls, Farmers Carry, Running Shoes, Assault Bike, Pull-up Bar, Kettlebells, Dumbbells — 13 options) | All optional |
| **3** | Race Goals | Next Race Date (date), Goal Finish Time in minutes (number), Training Phase (select: General Prep/Specific Prep/Competition Prep/Taper/Off Season) | All optional, Skip button shown |
| **4** | Health & Safety | Injuries or Limitations (textarea, comma-separated), Unit Preference (select: Metric/Imperial) | All optional, Skip button shown |

**Behavior**: Back/Next navigation, Skip from step 3+, "Complete Setup" on final step. Submits via `POST /api/profile`. Parses injuries as comma-separated array, converts numeric strings, groups training history into nested JSON. Routes to `/dashboard` on success.

#### Auth Middleware

| Rule | Behavior |
|------|----------|
| Protected routes | Redirects unauthenticated users to `/login` |
| Public routes | `/login`, `/signup`, `/auth/callback`, `/forgot-password` redirect authenticated users to `/dashboard` |
| Profile gate | App layout checks `athlete_profiles` table; redirects to `/onboarding` if no profile exists |

---

### 2.2 AI Coach Chat (`/coach`)

#### Layout

- **Desktop**: Left sidebar (width-72) with conversation list + main chat area
- **Mobile**: Overlay sidebar (fixed, dismissible via menu button)

#### Conversation Sidebar

| Element | Details |
|---------|---------|
| **Conversation list** | Scrollable list of past conversations, ordered by `updated_at` DESC |
| **Active highlighting** | Yellow background + left border on selected conversation |
| **Time formatting** | "Today HH:mm", "Yesterday", "Xd ago", or "MMM D" |
| **New Chat button** | Creates conversation via `POST /api/conversations` |
| **Empty state** | MessageSquare icon + "No conversations yet" |
| **Auto-select** | On mount, reads `lastConversationId` from Zustand localStorage store and auto-selects |

#### Chat Interface

| Element | Details |
|---------|---------|
| **User messages** | Right-aligned, yellow/translucent background |
| **Assistant messages** | Left-aligned with bot avatar icon, rendered as GitHub-flavored Markdown (react-markdown + remark-gfm) with custom prose styling |
| **Streaming** | Real-time token-by-token display with animated yellow pulse indicator at message end |
| **Cold start indicator** | After 5 seconds of waiting, shows "Warming up..." status (Nebius cold start latency) |
| **Error handling** | Displays error box for API failures, handles 503 (cold start) and 429 (rate limit) |
| **Auto-scroll** | Scrolls to bottom on new messages |
| **Empty state** | Bot icon + welcome message when no messages in conversation |

#### Chat Input

| Element | Details |
|---------|---------|
| **Textarea** | Auto-expanding (max 160px), placeholder "Ask Coach K..." |
| **Send** | Enter to send, Shift+Enter for newline, or click yellow Send button |
| **Quick actions** | 4 preset chips on first message: "What should I do today?", "Build a sled push workout", "Analyze my station weaknesses", "Am I ready for race day?" |
| **Context pre-fill** | Accepts `?context=plan&planName={name}` URL params to pre-populate input (e.g., from Training page link) |
| **Loading state** | Send button shows spinner, input disabled during streaming |

#### Message Feedback

| Element | Details |
|---------|---------|
| **Thumbs up/down** | Toggle buttons below completed assistant messages |
| **Toggle behavior** | Second click on same button deselects feedback |
| **Persistence** | Sends `POST /api/messages/{id}/feedback` with `positive`, `negative`, or `null` |

#### Training Plan Detection

| Element | Details |
|---------|---------|
| **Auto-detection** | Pipeline uses heuristic: `weeks >= 2 AND days >= 3 AND sessions >= 3` in response content |
| **Inline card** | When detected, assistant message shows a "Training plan detected" card with CalendarDays icon |
| **"Review & Accept" button** | Triggers extraction via `POST /api/training-plans/extract` using base Llama 3.3 70B (not fine-tuned) |
| **Plan Review Modal** | Opens dialog with plan summary, week-by-week accordion, start date picker, and "Accept & Activate" button |
| **Plan saving** | Creates plan + weeks + days in DB via `useCreateTrainingPlan()` mutation, auto-archives previous active plan |

---

### 2.3 Training Plans

#### Plan Creation (from Chat)

| Step | Details |
|------|---------|
| **1. Detection** | Pipeline heuristic flags response as training plan |
| **2. Extraction** | Base Llama 3.3 70B converts natural language to structured JSON (Zod-validated schema) |
| **3. Review** | Modal displays: plan name, goal, duration, total sessions, week-by-week accordion with day details |
| **4. Customization** | User can change start date before accepting |
| **5. Save** | Bulk inserts plan → weeks → days hierarchy, sets `is_ai_generated: true`, links `source_conversation_id` |
| **6. Activation** | Auto-deactivates any currently active plan before activating new one |

#### Plan Review Modal

| Element | Details |
|---------|---------|
| **Summary** | 2-column grid: plan name, duration (X weeks · Y sessions) |
| **Goal** | Displayed if present |
| **Start Date** | Editable date input, defaults to today |
| **Week accordion** | Collapsible per-week view: week number, focus text, session count |
| **Day rows** | Day name (Mon-Sun), color-coded session type badge, workout title (truncated), estimated duration |
| **Rest days** | Italic "Rest day" text |
| **Session type colors** | run=blue, hiit=red, strength=green, simulation=yellow, recovery=green, station_practice=purple, general=gray |
| **Actions** | Cancel (outline) and Accept & Activate (yellow glow) buttons |
| **Success state** | Check icon + "Saved" text, auto-closes after 1.5s |
| **Error handling** | Toast notification on failure, error message displayed |

#### Plan Data Model

```
training_plans (1)
  └── training_plan_weeks (N)
       └── training_plan_days (7 per week)
            ├── day_of_week (0=Mon to 6=Sun)
            ├── session_type (run|hiit|strength|simulation|recovery|station_practice|general)
            ├── workout_title
            ├── workout_description
            ├── workout_details (JSON)
            ├── estimated_duration_minutes
            ├── is_rest_day
            ├── is_completed
            └── linked_workout_log_id (FK to workout_logs)
```

---

### 2.4 Training Calendar (`/training`)

#### Calendar View

| Element | Details |
|---------|---------|
| **Week navigation** | Previous/Next buttons with "Week X of Y" header and focus text |
| **Auto-detect current week** | Calculates from plan start date which week the user is currently in |
| **7-day grid** | Mon-Sun columns, each day is a droppable zone |
| **Today highlight** | Current day column gets yellow border accent |
| **Drag & drop** | Incomplete workouts can be dragged between days, updates `day_of_week` via PATCH API |
| **Drag overlay** | Visual card follows cursor during drag with shadow glow effect |
| **Drop target** | Destination column highlights with yellow border on hover |

#### Workout Cards (in calendar)

| Element | Details |
|---------|---------|
| **Session type badge** | Colored dot + label (uses station color palette) |
| **Workout title** | 2-line max, truncated |
| **Duration** | Bottom-right, optional |
| **Completed checkmark** | Top-right green check if `is_completed: true` |
| **Completed state** | Reduced opacity, drag disabled |
| **Rest day** | Moon icon + "Rest" text, centered, not draggable |
| **Click** | Opens workout detail drawer |

#### Workout Detail Drawer

| Element | Details |
|---------|---------|
| **Title** | Workout title or "Rest Day" |
| **Session type badge** | Styled label |
| **Description** | Full multiline workout description |
| **Estimated duration** | Formatted as "Est. X min" |
| **"Log Workout" button** | Routes to `/training/log?planDayId={id}` |
| **"Mark Done" button** | Sets `is_completed: true` via `useUpdatePlanDay()` mutation with toast notification |
| **Rest day message** | "Take it easy today. Recovery is where adaptation happens." |

#### No Plan State

| Element | Details |
|---------|---------|
| **Empty state** | CalendarDays icon + "No active training plan" message |
| **CTA** | "Ask Coach K to create one" button linking to `/coach` |

#### "Ask Coach K" Link

| Element | Details |
|---------|---------|
| **Conditional** | Only shown when active plan exists |
| **Route** | `/coach?context=plan&planName={encoded}` |
| **Styling** | Yellow accent border, MessageSquare icon |

---

### 2.5 Workout Logging (`/training/log`)

#### Form Fields

| Field | Type | Details |
|-------|------|---------|
| **Date** | `<input type="date">` | Defaults to today's ISO date |
| **Session Type** | `<Select>` dropdown | 7 options: Run, HIIT, Strength, Race Simulation, Recovery, Station Practice, General. Default: "general" |
| **Duration** | `<input type="number">` | Minutes, optional, placeholder "60" |
| **RPE** | Range slider 1-10 | Default: 5. Each value has a label (1="Very Easy" through 10="Maximal"). Visual scale with numbered indicators below slider. Active value highlighted in yellow |
| **Notes** | `<textarea>` | Free-form, placeholder "How did it go? What did you focus on?", min height 100px |

#### Plan Day Pre-Population

| Element | Details |
|---------|---------|
| **URL param** | `?planDayId={id}` |
| **Fetch** | `GET /api/training-plans/day/{dayId}` on mount |
| **Pre-fill** | Session type, duration, notes (from workout_description) |
| **Banner** | Yellow-accented "Planned Workout" banner showing workout title and description (line-clamped to 2 lines) |

#### Submission

| Element | Details |
|---------|---------|
| **Mutation** | `useCreateWorkout().mutateAsync()` via React Query |
| **Payload** | `{ date, session_type, duration_minutes, rpe_post, notes, training_plan_day_id }` |
| **Auto-complete** | If `training_plan_day_id` provided, API auto-sets `is_completed: true` on the plan day and links the workout log ID |
| **Success** | Toast notification + redirect to `/training` |
| **Error** | Toast notification + inline error box |

---

### 2.6 Dashboard (`/dashboard`)

Bento grid layout with responsive cards. Data fetched via `useDashboard()` React Query hook (single `GET /api/dashboard` call).

#### Greeting Header

| Element | Details |
|---------|---------|
| **Title** | "Hey {firstName}" extracted from display_name |
| **Subtitle** | Current training phase + division (e.g., "General Prep · Open Division") |

#### Race Countdown Card (2-col span)

| Element | Details |
|---------|---------|
| **Visual** | Caution stripe at top (Hyrox brand), large yellow countdown number |
| **Data** | Days until race (computed from `race_date`), goal time below |
| **Conditional** | Hidden if no `race_date` set in profile |

#### Weekly Stats (3-4 cards)

| Card | Data | Icon |
|------|------|------|
| **Workouts** | Count of workouts in last 7 days | Dumbbell |
| **Training Hours** | Total minutes / 60, rounded to 1 decimal | Clock |
| **Streak** | Consecutive days with logged workouts (max 30 day lookback) | Flame |
| **Avg RPE** | Average RPE across week's workouts, 1 decimal | Timer |

#### Today's Workout Card (2-col span)

| Element | Details |
|---------|---------|
| **Conditional** | Only shown when active plan exists AND today's workout is not completed |
| **Content** | Session type badge, workout title, estimated duration |
| **CTA** | Links to `/training/log?planDayId={id}` with Play icon |
| **Styling** | Yellow accent |

#### Active Plan Progress Card (2-col span)

| Element | Details |
|---------|---------|
| **Conditional** | Only shown when active plan exists |
| **Content** | Plan name, "Week X/Y" counter, progress bar with percentage |
| **CTA** | Links to `/training` |

#### Coach K CTA Card (2-col span)

| Element | Details |
|---------|---------|
| **Content** | MessageSquare icon, "Talk to Coach K" |
| **Subtitle** | Last conversation title or "Start your first session" |
| **CTA** | Links to `/coach` |

#### Recent PRs Card (2-col span)

| Element | Details |
|---------|---------|
| **Conditional** | Hidden if no personal records |
| **Content** | Trophy icon, list of exercise + value + unit |

#### Active Goals Card (2-col span)

| Element | Details |
|---------|---------|
| **Conditional** | Hidden if no active goals |
| **Content** | Goal title + progress percentage with progress bars |

---

### 2.7 Performance Tracking (`/performance`)

3-tab interface. Data fetched via raw `useEffect/fetch` calls (not yet migrated to React Query hooks).

#### Overview Tab

| Element | Details |
|---------|---------|
| **Personal Records** | Trophy icon, 2-column grid of PR cards |
| **PR card content** | Exercise name, date achieved, value + unit |
| **Improvement indicator** | Green TrendingUp icon with previous_value if present |
| **Empty state** | Trophy icon + "No PRs recorded yet" |

#### Stations Tab

| Element | Details |
|---------|---------|
| **Station list** | All 8 Hyrox stations ordered by station_order |
| **Per-station info** | Station order number, name (bold), distance/reps description |
| **Benchmark data** | Best benchmark result (if any), last test date |

#### Benchmarks Tab

| Element | Details |
|---------|---------|
| **"Log Benchmark" CTA** | Outline button with yellow text |
| **Benchmark list** | test_type + date + ChevronRight icon |
| **Empty state** | BarChart3 icon + "No benchmarks recorded yet" |
| **Note** | API exists but no benchmark creation form in UI — button is non-functional |

---

### 2.8 Profile Management (`/profile`)

#### Sections

| Section | Fields |
|---------|--------|
| **Personal Info** | Display Name (text), Weight in kg (number), Height in cm (number) |
| **Hyrox** | Division (select: Open/Pro/Doubles/Relay), Training Phase (select: 5 options), Race Date (date), Goal Time in minutes (number) |
| **Preferences** | Units (select: Metric/Imperial) |

#### Behavior

| Element | Details |
|---------|---------|
| **Data fetch** | `GET /api/profile` on mount |
| **Save** | `PATCH /api/profile` via button click |
| **Save feedback** | Button cycles through: "Save Changes" → Spinner → Check + "Saved" (2s timeout) |
| **Sign Out** | Calls `supabase.auth.signOut()`, routes to `/login` |
| **Sign Out styling** | Outline button, turns red on hover |
| **Loading state** | Skeleton title + 4 skeleton cards |

---

### 2.9 Goals System

| Feature | Status |
|---------|--------|
| **API endpoints** | `GET/POST /api/goals`, `PUT/DELETE /api/goals/:id` — all functional |
| **Dashboard display** | Active goals shown in dashboard bento grid |
| **Dedicated UI** | None — no goals page, no goal creation form, no goal editing form |
| **Data model** | title, description, goal_type, target_value, current_value, target_date, status |
| **Note** | Goals can only be created/edited via API calls; no user-facing form exists |

---

## 3. API Endpoint Inventory

### Summary: 36 endpoints across 11 route files

| Route | Methods | Auth | Description |
|-------|---------|------|-------------|
| `/api/chat` | POST | Yes | Stream coaching response via SSE |
| `/api/conversations` | GET, POST | Yes | List/create conversations |
| `/api/conversations/[id]` | GET, PUT, DELETE | Yes | Read/update/delete conversation |
| `/api/conversations/[id]/messages` | GET | Yes | Paginated message history (limit 50-100) |
| `/api/dashboard` | GET | Yes | Aggregated dashboard data (profile, stats, plan, workout, PRs, goals) |
| `/api/workouts` | GET, POST | Yes | List (paginated, date-filterable) / create workout log |
| `/api/workouts/[id]` | GET, PUT, DELETE | Yes | Read/update/soft-delete workout |
| `/api/training-plans` | GET, POST | Yes | List/create training plan (nested weeks+days) |
| `/api/training-plans/[id]` | GET, PUT, DELETE | Yes | Read (with weeks+days) / update / archive plan |
| `/api/training-plans/[id]/days/[dayId]` | PATCH | Yes | Update training plan day fields |
| `/api/training-plans/[id]/days/[dayId]/complete` | POST | Yes | Mark day complete, optionally link workout |
| `/api/training-plans/day/[dayId]` | GET | Yes | Get single plan day (ownership verified via nested chain) |
| `/api/training-plans/extract` | POST | Yes | LLM-based plan extraction from natural language |
| `/api/profile` | GET, POST, PATCH | Yes | Read/create/update athlete profile |
| `/api/goals` | GET, POST | Yes | List/create goals |
| `/api/goals/[id]` | PUT, DELETE | Yes | Update/hard-delete goal |
| `/api/personal-records` | GET | Yes | List personal records |
| `/api/benchmarks` | GET, POST | Yes | List/create benchmark tests |
| `/api/races` | GET, POST | Yes | List/create race results (with splits) |
| `/api/stations` | GET | **No** | List Hyrox stations (public, reference data) |
| `/api/messages/[id]/feedback` | POST | Yes | Submit thumbs up/down on message |

### Key API Observations

- **Streaming**: `/api/chat` returns SSE (`text/event-stream`) with `X-Conversation-Id` header
- **Soft deletes**: Workouts use `deleted_at` column; goals use hard DELETE
- **Ownership verification**: Training plan day endpoints verify ownership through `day → week → plan → athlete_profile → user` chain
- **Plan creation**: Supports full nested insert (plan + weeks + days) in single POST, auto-archives active plan
- **Unused endpoints**: `/api/benchmarks` (POST), `/api/races` (GET/POST) have no frontend callers

---

## 4. Database Schema Audit

### 17 Tables Total

#### Actively Used (10 tables — 100% coverage)

| Table | Columns | Usage | Notes |
|-------|---------|-------|-------|
| `athlete_profiles` | 22 | 90% | `avatar_url`, `preferences`, `profile_complete` unused |
| `conversations` | 5 | 100% | Fully used |
| `messages` | 12 | 85% | `pinned` column unused; `feedback` stored via API but no UI |
| `training_plans` | 14 | 100% | Full CRUD + nested queries |
| `training_plan_weeks` | 7 | 100% | Nested in plan queries |
| `training_plan_days` | 13 | 100% | Day completion, workout linking, drag-drop |
| `workout_logs` | 16 | 100% | Full CRUD with soft delete |
| `goals` | 14 | 95% | `station_id` FK never populated |
| `personal_records` | 13 | 60% | `context`, `notes`, `previous_value`, `exercise_id`, `station_id` unused |
| `knowledge_chunks` | 11 | 100% | Core RAG backbone (239 chunks) |

#### Completely Unused (6 tables — API dead code or no API)

| Table | Columns | Has API? | Status |
|-------|---------|----------|--------|
| `benchmark_tests` | 8 | Yes (GET/POST) | API exists but never called from frontend |
| `race_results` | 12 | Yes (GET/POST) | API exists but never called from frontend |
| `race_splits` | 10 | Yes (via races) | Child of unused `race_results` |
| `achievement_definitions` | 8 | No | No API, no queries anywhere |
| `athlete_achievements` | 5 | No | No API, child of unused `achievement_definitions` |
| `skill_level_benchmarks` | 9 | No | No API, no queries anywhere |

#### Reference Data (1 table — minimal usage)

| Table | Columns | Usage |
|-------|---------|-------|
| `hyrox_stations` | 11 | API returns list but frontend never calls it; referenced as FK by 5 other tables but those FKs are never populated |
| `exercise_library` | ~10 | 78 exercises seeded but never queried in code |

### Unused Columns in Active Tables (~15 columns)

| Table | Column | Notes |
|-------|--------|-------|
| `athlete_profiles` | `avatar_url` | No avatar upload or display |
| `athlete_profiles` | `preferences` | JSON stored but never read |
| `athlete_profiles` | `profile_complete` | Always set to `true`, never checked |
| `messages` | `pinned` | No pinning feature |
| `messages` | `feedback` | API writes work, but feedback is write-only (no analytics/display) |
| `personal_records` | `context` | Never populated |
| `personal_records` | `notes` | Never populated |
| `personal_records` | `previous_value` | Never populated |
| `personal_records` | `exercise_id` | FK to exercise_library, never set |
| `personal_records` | `station_id` | FK to hyrox_stations, never set |
| `goals` | `station_id` | FK to hyrox_stations, never populated |
| `workout_logs` | `rpe_pre` | Never collected in UI (only `rpe_post`) |
| `workout_logs` | `heart_rate_avg` | No HR integration |
| `workout_logs` | `completed_workout` | JSON, never populated |
| `workout_logs` | `prescribed_workout` | JSON, never populated |

---

## 5. AI / ML Pipeline

### Architecture: Hybrid RAG + Fine-Tuned LoRA

```
User Message
  │
  ├─ 1. Embed query → OpenAI text-embedding-3-small (1536 dim)
  │
  ├─ 2. Hybrid RAG search → Supabase RPC hybrid_search_chunks()
  │     ├── Semantic: cosine similarity on embedding vector
  │     ├── Full-text: PostgreSQL tsvector/tsquery
  │     └── Fusion: Reciprocal Rank Fusion (k=50), top 5 chunks
  │
  ├─ 3. Format chunks → "### Source {i}: {source_name}\n**Section**: {section}\n\n{content}"
  │
  ├─ 4. Build system prompt → Coach K persona + safety boundaries + coaching approach
  │
  ├─ 5. Build athlete context → Profile fields, computed age, days-to-race, equipment list
  │
  ├─ 6. Load history → Last 16 messages (8 turns) from messages table
  │
  ├─ 7. Assemble → [system, athlete_context, ...history, user_message]
  │
  ├─ 8. Stream to Nebius → Llama 3.3 70B LoRA (temp=0.7, max_tokens=1200)
  │
  └─ 9. Persist + detect
        ├── Save user + assistant messages to DB
        ├── Record: rag_chunks_used, tokens_in, tokens_out, latency_ms
        └── Heuristic: if plan detected → set suggested_actions = {type: "training_plan"}
```

### Model Details

| Spec | Value |
|------|-------|
| **Base model** | `meta-llama/Llama-3.3-70B-Instruct` |
| **LoRA adapter** | `hyrox-coach-v2-HafB` (924 examples, 42 training steps) |
| **Deployed model** | `meta-llama/Llama-3.3-70B-Instruct-fast-LoRa:hyrox-coach-v2-HafB` |
| **Training loss** | 1.44 → 0.95 → 0.565 |
| **Evaluation score** | 83% (273/330 checks) with tuned prompt |
| **Inference pricing** | $0.13 input / $0.40 output per 1M tokens |
| **Cold start** | 5-10 seconds first request, sub-second thereafter |

### Plan Extraction (Separate from coaching)

| Spec | Value |
|------|-------|
| **Model** | Base `meta-llama/Llama-3.3-70B-Instruct` (NOT fine-tuned) |
| **Temperature** | 0.1 (deterministic) |
| **Max tokens** | 4000 |
| **Validation** | Zod schema (`TrainingPlanSchema`) |
| **Cleanup** | Strips markdown code fences from LLM output |

### Knowledge Base (RAG)

| Spec | Value |
|------|-------|
| **Chunks** | 239 total from 15 research documents (~92K words) |
| **Avg tokens/chunk** | 482 |
| **Search** | Hybrid (semantic + full-text) via `hybrid_search_chunks()` PostgreSQL function |
| **Top-K** | 5 chunks per query |

---

## 6. Component Library

### Custom Application Components (10 total)

| Component | Location | Used By |
|-----------|----------|---------|
| `ChatMessage` | `src/components/coach/chat-message.tsx` | Coach page |
| `ChatInput` | `src/components/coach/chat-input.tsx` | Coach page |
| `ConversationSidebar` | `src/components/coach/conversation-sidebar.tsx` | Coach page |
| `TrainingPlanCard` | `src/components/coach/training-plan-card.tsx` | ChatMessage |
| `PlanReviewModal` | `src/components/coach/plan-review-modal.tsx` | TrainingPlanCard |
| `WeekCalendar` | `src/components/training/week-calendar.tsx` | Training page |
| `DroppableDay` | `src/components/training/droppable-day.tsx` | WeekCalendar |
| `DraggableWorkoutCard` | `src/components/training/draggable-workout-card.tsx` | WeekCalendar |
| `QueryProvider` | `src/components/providers/query-provider.tsx` | App layout |

### shadcn/ui Components (21 installed)

| Component | Actively Used? |
|-----------|---------------|
| Button | Yes — everywhere |
| Card | Yes — dashboard |
| Checkbox | Yes — onboarding (equipment) |
| Command | No |
| Dialog | Yes — plan review modal |
| Drawer | Yes — training day detail |
| Dropdown Menu | No |
| Input | Yes — forms |
| Label | Yes — forms |
| Popover | No |
| Progress | No (custom progress bars used instead) |
| Radio Group | No |
| Scroll Area | No |
| Select | Yes — forms |
| Separator | No |
| Sheet | No |
| Slider | No (custom range input used instead) |
| Switch | No |
| Tabs | Yes — performance page |
| Textarea | Yes — workout log, onboarding |
| Tooltip | No |

### Kokonut UI Free (22 installed)

Includes: ai-loading, ai-prompt, ai-text-loading, ai-voice, anthropic, anthropic-dark, apple-activity-card, bento-grid, card-stack, deepseek, dynamic-text, file-upload, gemini, hold-button, mistral, morphic-navbar, open-ai-dark, and more.

**Most are unused.** Only `bento-grid` pattern is referenced in the dashboard concept.

### Kokonut UI Pro (8 installed)

| Component | Used? |
|-----------|-------|
| `accordion-01` | Referenced in plan concepts |
| `card-08` | No |
| `form-04` | No |
| `form-06` | No |
| `input-02` | No |
| `input-03` | No |
| `input-07` | No |
| `login-01` | Referenced but custom login used instead |

---

## 7. State Management & Data Flow

### React Query Hooks (8 hooks)

| Hook | Endpoint | Cache Key | Used By |
|------|----------|-----------|---------|
| `useConversations()` | GET /api/conversations | `['conversations']` | Coach page |
| `useMessages(convId)` | GET /api/conversations/{id}/messages | `['messages', convId]` | Coach page |
| `useWorkouts(params)` | GET /api/workouts | `['workouts', params]` | Training page |
| `useTrainingPlans()` | GET /api/training-plans | `['training-plans']` | — |
| `useTrainingPlan(id)` | GET /api/training-plans/{id} | `['training-plan', id]` | Training page |
| `useActiveTrainingPlan()` | GET /api/training-plans + filter | `['training-plans']` | Training page |
| `useDashboard()` | GET /api/dashboard | `['dashboard']` | Dashboard page |
| `useCreateWorkout()` | POST /api/workouts | Invalidates `['workouts']` | Workout log |

### React Query Mutations (3 mutations)

| Mutation | Endpoint | Invalidates |
|----------|----------|-------------|
| `useCreateTrainingPlan()` | POST /api/training-plans | `['training-plans']` |
| `useUpdatePlanDay()` | PATCH /api/training-plans/{id}/days/{dayId} | `['training-plan', planId]` |
| `useCreateWorkout()` | POST /api/workouts | `['workouts']` |

### Zustand Store

| Store | Key | Persistence | Purpose |
|-------|-----|-------------|---------|
| `coach-store` | `activeConversationId` | Session only | Currently selected conversation |
| `coach-store` | `lastConversationId` | localStorage | Auto-select on page return |

### React Query Defaults

| Setting | Value |
|---------|-------|
| `staleTime` | 30 seconds |
| `gcTime` | 5 minutes |
| `retry` | 1 |
| `refetchOnWindowFocus` | false |

---

## 8. Cross-Page Integration

| From | To | Mechanism |
|------|----|-----------|
| **Dashboard** "Today's Workout" | **Workout Log** | Link: `/training/log?planDayId={id}` |
| **Dashboard** "Active Plan" | **Training** | Link: `/training` |
| **Dashboard** "Talk to Coach K" | **Coach** | Link: `/coach` |
| **Training** "Log Workout" button | **Workout Log** | Link: `/training/log` |
| **Training** day click → drawer "Log Workout" | **Workout Log** | Link: `/training/log?planDayId={id}` |
| **Training** "Ask Coach K about this plan" | **Coach** | Link: `/coach?context=plan&planName={encoded}` |
| **Training** "No plan" CTA | **Coach** | Link: `/coach` |
| **Coach** plan detection → Accept | **Training Plans DB** | `useCreateTrainingPlan()` mutation |
| **Coach** creates conversation | **Zustand store** | Sets `lastConversationId` |
| **Workout Log** submit with planDayId | **Training Plan Day** | Auto-sets `is_completed: true` + links `workout_log_id` |

---

## 9. What's Missing — Gap Analysis

### 9.1 Built But Not Wired (DB + API exist, no frontend)

| Feature | Tables | API | What's Missing |
|---------|--------|-----|----------------|
| **Race Results Tracking** | `race_results`, `race_splits` | GET/POST /api/races | No page, no form, no display. Users cannot record or view race results |
| **Benchmark Testing** | `benchmark_tests` | GET/POST /api/benchmarks | "Log Benchmark" button exists on Performance page but is non-functional (no creation form) |
| **Achievement System** | `achievement_definitions`, `athlete_achievements` | None | 23 achievement definitions seeded in DB but no API, no display, no earning logic |
| **Skill Level Benchmarks** | `skill_level_benchmarks` | None | 80 benchmark records seeded but no API or display |
| **Station Reference Data** | `hyrox_stations` (10 stations) | GET /api/stations | API returns data but frontend never calls it; rich data (tips, common_mistakes, weights_by_division) sits unused |
| **Exercise Library** | `exercise_library` (78 exercises) | None | Reference data exists but no API or UI |
| **Goals Management UI** | `goals` | Full CRUD | Dashboard shows goals but no creation/editing form exists anywhere |

### 9.2 Partially Implemented

| Feature | What Works | What's Missing |
|---------|------------|----------------|
| **Message Feedback** | Thumbs up/down saved to DB | No analytics dashboard, no feedback aggregation, Coach K doesn't learn from feedback |
| **RPE Tracking** | Post-workout RPE collected | Pre-workout RPE (`rpe_pre`) column exists but not collected; no RPE trend analysis |
| **Heart Rate** | `heart_rate_avg` column exists | No HR input field, no device integration |
| **Profile Avatar** | `avatar_url` column exists | No upload UI, no display |
| **Workout Detail View** | Workouts listed on Training page | No dedicated workout detail page (clicking a workout does nothing) |
| **PR Creation** | API reads records | No creation form; PRs can only be created via direct API call |
| **Performance → Stations tab** | Shows station list with benchmarks | Benchmark data is always empty since benchmark creation form doesn't exist |

### 9.3 Entirely Missing (no DB, no API, no UI)

| Feature | Expected By Users? | Complexity |
|---------|-------------------|------------|
| **Push Notifications / Reminders** | High — "train today" nudges | Medium (service worker + notification API) |
| **Social / Leaderboard** | Medium — community comparison | High (new tables, privacy, ranking) |
| **Wearable Integration** | High — Apple Watch, Garmin, Strava | High (OAuth + device APIs) |
| **Progress Photos** | Medium | Low (file upload to Supabase Storage) |
| **Workout Timer / During-Workout Mode** | High — live session tracking | Medium (new page, interval timers, rest timers) |
| **Nutrition Tracking** | Low-Medium | High (food database, meal planning) |
| **Body Composition Tracking** | Medium | Low (new table + simple form) |
| **Coach K Conversation Export** | Low | Low (generate PDF/text of chat) |
| **Multi-Language Support** | Low initially | High (i18n across all components) |
| **Offline Mode / PWA** | Medium | Medium (service worker, IndexedDB sync) |
| **Dark/Light Theme Toggle** | Low (dark-only is fine for fitness) | Low (already token-based) |
| **Email Notifications** | Medium — weekly summary | Medium (Supabase Edge Functions + email service) |
| **Payment / Subscription** | Required for monetization | High (Stripe, plan tiers, gating) |
| **Admin Dashboard** | Required for operations | Medium (separate admin routes, user management) |
| **Data Export** | Medium — users want their data | Low (CSV/JSON export of workouts, plans) |
| **Plan Modification in UI** | High — edit individual days | Medium (inline editing, form per day) |
| **Multiple Active Plans** | Low | Medium (plan switching, calendar overlay) |
| **Workout Templates** | Medium — save and reuse workouts | Low-Medium (template table + selection UI) |
| **Recovery / Readiness Score** | Medium | Medium (algorithm based on RPE trends, volume) |
| **Race Day Pacing Calculator** | High for Hyrox users | Low (compute from goal time + station benchmarks) |

---

## 10. Roadmap — Prioritized Feature Proposals

### Tier 1: Quick Wins (1-3 days each)

These require minimal new infrastructure and directly improve the user experience.

| # | Feature | Effort | Impact | Details |
|---|---------|--------|--------|---------|
| 1 | **Goals Creation/Edit Form** | 1 day | High | Add `/goals` page or modal with form: title, description, type, target value, target date. All API endpoints already exist |
| 2 | **PR Creation Form** | 1 day | High | Add form to Performance page for logging personal records. API partially exists (needs POST endpoint) |
| 3 | **Benchmark Creation Form** | 1 day | Medium | Wire up the existing "Log Benchmark" button on Performance page. API already exists |
| 4 | **Workout Detail Page** | 1 day | Medium | Clicking a workout on Training page should open a detail view showing all logged data |
| 5 | **Race Day Pacing Calculator** | 2 days | High | Static page: input goal time, outputs target splits for each station + run segment. Uses `hyrox_stations` and `skill_level_benchmarks` reference data already in DB |
| 6 | **Data Export** | 1 day | Medium | Add "Export" button on Training/Performance pages, generates CSV of workouts and PRs |
| 7 | **Conversation Export** | 1 day | Low | Add "Export Chat" button in coach sidebar, generates text/markdown of conversation |
| 8 | **Station Reference Page** | 1 day | Medium | Display `hyrox_stations` data (tips, common mistakes, weights by division) — all data already seeded |

### Tier 2: High-Impact Features (1-2 weeks each)

| # | Feature | Effort | Impact | Details |
|---|---------|--------|--------|---------|
| 9 | **Race Results Tracking** | 1 week | High | `/performance/races` page with form for overall time + per-station splits. All DB tables and APIs exist. Enables race-over-race comparison |
| 10 | **Achievement System** | 1 week | High | Wire up 23 seeded achievements. Logic: after workout log, check criteria → award badge. Display in profile/dashboard. Achievement definitions already in DB |
| 11 | **Plan Editing UI** | 1 week | High | Allow inline editing of training plan days (change workout, swap days, modify descriptions). PATCH API already exists |
| 12 | **Recovery / Readiness Score** | 1 week | Medium | Algorithm: input = last 7 days RPE + volume + sleep quality (new field). Output = 1-10 readiness score. Display on dashboard |
| 13 | **Workout Timer / Session Mode** | 2 weeks | High | Live workout page with interval timers, rest timers, exercise checklist. Real-time RPE capture during workout vs post-workout |
| 14 | **Email Weekly Summary** | 1 week | Medium | Supabase Edge Function: Monday 7am send email with last week's stats, upcoming plan, streak |
| 15 | **Wearable Import (Strava)** | 2 weeks | High | Strava OAuth + webhook for auto-importing run workouts. Map Strava activities to session types |

### Tier 3: Premium / Differentiator Features (2-4 weeks each)

| # | Feature | Effort | Impact | Details |
|---|---------|--------|--------|---------|
| 16 | **AI Plan Adaptation** | 3 weeks | Very High | Coach K analyzes workout logs + RPE trends and suggests plan modifications mid-cycle. New pipeline: weekly review → adjustment recommendations → user approval |
| 17 | **Video Form Analysis** | 4 weeks | High | Upload station exercise video → AI analyzes form → provides technique feedback. Requires vision model integration |
| 18 | **Social / Leaderboard** | 3 weeks | Medium | Anonymous leaderboard by division. Opt-in sharing of race results, PRs. Weekly challenges |
| 19 | **Multi-Athlete Coach Dashboard** | 3 weeks | Medium | Coaches can manage multiple athletes, view their plans/progress, send custom programming |
| 20 | **Push Notifications (PWA)** | 2 weeks | High | Service worker + notification API. Triggers: workout reminder, streak at risk, plan day upcoming, new Coach K insight |
| 21 | **Offline Mode** | 3 weeks | Medium | PWA with IndexedDB cache. Workouts can be logged offline, sync when reconnected |

### Tier 4: Infrastructure / Monetization (2-6 weeks each)

| # | Feature | Effort | Impact | Details |
|---|---------|--------|--------|---------|
| 22 | **Payment / Subscription (Stripe)** | 3 weeks | Critical | Free tier: limited coach conversations, basic logging. Pro tier: unlimited coaching, plan generation, advanced analytics, achievements |
| 23 | **Admin Dashboard** | 2 weeks | High (ops) | User management, usage metrics, coach pipeline monitoring, error rates, feedback review |
| 24 | **Analytics Pipeline** | 2 weeks | Medium | Track: message feedback trends, popular topics, plan completion rates, feature usage. Feed into Coach K improvements |
| 25 | **Rate Limiting & Abuse Prevention** | 1 week | High (security) | Per-user rate limits on /api/chat, CAPTCHA on auth, input sanitization audit |
| 26 | **Feedback Loop to Fine-Tuning** | 4 weeks | Very High | Aggregate positive-feedback messages → curate → add to training data → retrain Coach K v3 |
| 27 | **Multi-Language (i18n)** | 6 weeks | Medium | next-intl or similar. Start with English + Spanish + German (major Hyrox markets) |

---

### Recommended Execution Order

```
Phase 1 (Immediate — wire up existing infra)
├── #1 Goals Form
├── #2 PR Creation
├── #3 Benchmark Form
├── #5 Pacing Calculator
└── #8 Station Reference Page

Phase 2 (Short-term — high user value)
├── #9 Race Results Tracking
├── #10 Achievement System
├── #11 Plan Editing UI
├── #4 Workout Detail Page
└── #6 Data Export

Phase 3 (Medium-term — premium features)
├── #13 Workout Timer
├── #15 Strava Integration
├── #16 AI Plan Adaptation
├── #20 Push Notifications
└── #14 Email Summary

Phase 4 (Monetization & Scale)
├── #22 Stripe Payments
├── #23 Admin Dashboard
├── #25 Rate Limiting
├── #26 Feedback Loop
└── #24 Analytics
```

---

*This document serves as both a current-state reference and a strategic roadmap. Every feature in Phase 1 leverages database tables and API endpoints that already exist — the frontend just needs to be connected.*
