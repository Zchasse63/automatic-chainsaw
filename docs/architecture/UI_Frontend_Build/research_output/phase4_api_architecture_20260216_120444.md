# Research Output: API & Data Flow Architecture for Hyrox AI Coach
## Generated: 2026-02-16T12:04:44.055419
## Preset: advanced-deep-research
## Model: anthropic/claude-opus-4-6
## Cost: $0.9862
## Research steps: 2 searches, 3 URL fetches
## Output length: 52785 chars, 6797 words

---

Now I have a comprehensive understanding of the current state of Next.js 16, Supabase SSR, and TanStack Query v5. Let me produce the complete specification document.

---

# Phase 4: API & Data Flow Architecture — Hyrox AI Coach

## Complete Specification Document

---

## Table of Contents

- **Deliverable 1**: API Specification Document
- **Deliverable 2**: State Management Plan
- **Deliverable 3**: Auth & Middleware Spec
- **Deliverable 4**: Error Handling Playbook

---

# Deliverable 1: API Specification Document

## 1.0 Conventions & Shared Types

### Base URL
All API routes are relative to the application root: `/api/...`

### Authentication Pattern
All authenticated endpoints extract the user from the Supabase JWT passed via the `Authorization: Bearer <token>` header or the `sb-*` session cookies. Route Handlers use `@supabase/ssr`'s `createServerClient` to get a validated session.

### Shared Response Envelope

```typescript
// Success responses return data directly (no envelope wrapper)
// Error responses use a consistent shape:
type ApiError = {
  error: {
    code: string           // Machine-readable: "PROFILE_NOT_FOUND", "VALIDATION_ERROR"
    message: string        // Human-readable message
    details?: unknown      // Optional structured details (validation errors, etc.)
  }
}

// Pagination
type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
    has_next: boolean
  }
}

// Common HTTP status codes used:
// 200 - Success
// 201 - Created
// 204 - No Content (successful delete)
// 400 - Validation error
// 401 - Not authenticated
// 403 - Forbidden (RLS violation)
// 404 - Not found
// 409 - Conflict (duplicate)
// 429 - Rate limited
// 500 - Server error
// 503 - Upstream service unavailable
```

### Shared Domain Types

```typescript
// ─── Enums ───
type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'
type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'
type HyroxDivision = 'men_open' | 'women_open' | 'men_pro' | 'women_pro' 
  | 'men_doubles' | 'women_doubles' | 'mixed_doubles'
type WorkoutType = 'run' | 'strength' | 'hyrox_sim' | 'cross_training' 
  | 'recovery' | 'mobility' | 'race'
type RPE = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
type GoalStatus = 'active' | 'completed' | 'abandoned'
type GoalType = 'race_time' | 'station_time' | 'benchmark' | 'consistency' | 'custom'
type BenchmarkType = 'ski_erg_1000m' | 'row_1000m' | 'sled_push' | 'sled_pull' 
  | 'burpee_broad_jump' | 'farmers_carry' | 'lunges' | 'wall_balls' 
  | '1k_run' | '5k_run' | '10k_run' | 'deadlift_1rm' | 'back_squat_1rm' | 'custom'
type PlanStatus = 'active' | 'completed' | 'archived'
type FeedbackType = 'thumbs_up' | 'thumbs_down'

// ─── Timestamps ───
// All timestamps are ISO 8601 strings: "2026-02-16T12:00:00.000Z"
```

---

## Group 1: Authentication

### Design Decision
Authentication is handled **entirely client-side** via the Supabase Auth SDK (`@supabase/supabase-js`). There are no custom API routes for auth. The only server-side auth concern is:

1. **`proxy.ts`** — Refreshes JWT tokens on every request via `supabase.auth.getClaims()`
2. **`/auth/callback` Route Handler** — Exchanges OAuth/magic-link codes for sessions
3. **Database trigger** — Auto-creates a `profiles` row on `auth.users` INSERT

### 1.1 Auth Callback Route

```
GET /auth/callback
```

**Purpose**: Handles OAuth redirect and email confirmation code exchange.

| Field | Value |
|-------|-------|
| Auth | Public |
| Params | `code` (query string) — the auth code from Supabase |
| Response | 302 redirect to `/dashboard` (success) or `/auth/error` (failure) |

**Server-side logic**:
1. Extract `code` from `searchParams`
2. Call `supabase.auth.exchangeCodeForSession(code)`
3. Redirect to `/dashboard` on success, `/auth/error?message=...` on failure

### 1.2 Auth Flows (Client-Side — Document for Reference)

| Flow | SDK Method | Notes |
|------|-----------|-------|
| Sign up (email/pw) | `supabase.auth.signUp({ email, password })` | Sends confirmation email. `emailRedirectTo` → `/auth/callback` |
| Sign in (email/pw) | `supabase.auth.signInWithPassword({ email, password })` | Returns session immediately |
| Sign in (OAuth) | `supabase.auth.signInWithOAuth({ provider: 'google' })` | Redirects to provider → `/auth/callback` |
| Sign out | `supabase.auth.signOut()` | Clears session cookies |
| Password reset | `supabase.auth.resetPasswordForEmail(email)` | Sends reset email |
| Update password | `supabase.auth.updateUser({ password })` | After reset flow |
| Get session | `supabase.auth.getClaims()` | Server: validates JWT. **Never use `getSession()` server-side.** |

### 1.3 First-Login Hook (Database Trigger)

A Postgres trigger on `auth.users` INSERT creates the initial profile row:

```sql
-- Trigger function: handle_new_user()
-- Creates a row in public.profiles with:
--   id = auth.users.id
--   email = auth.users.email
--   display_name = extracted from email (before @)
--   onboarding_completed = false
--   created_at = now()
```

This ensures a `profiles` row always exists when a user first authenticates. The onboarding flow then updates this row with athlete data.

---

## Group 2: Athlete Profile

### Design Decision: API Routes vs. Direct Supabase Client

**Recommendation: Use API Route Handlers**, not direct Supabase client calls. Reasons:

| Consideration | API Route | Direct Client SDK |
|--------------|-----------|-------------------|
| **Validation** | Server-side Zod validation before DB write | Client-side only; RLS can't validate business rules |
| **Derived fields** | Calculate `race_countdown` server-side | Must duplicate logic client-side |
| **Side effects** | Cascade updates (e.g., recalculate plan on profile change) | Need separate calls |
| **Security** | Validate/sanitize input server-side | Rely entirely on RLS |
| **Complexity** | One more network hop | Slightly faster |

**Verdict**: API routes for mutations (POST/PUT/DELETE). For reads, use direct Supabase client in Server Components with RLS as primary protection, falling back to API route if derived fields are needed. The `GET /api/profile` endpoint exists for client components that need profile data.

### 2.1 GET /api/profile

```
GET /api/profile
```

**Purpose**: Get the authenticated user's full profile.

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `profiles` |
| Rate limit | 60/min |

**Response 200**:
```typescript
type ProfileResponse = {
  id: string                          // UUID (matches auth.users.id)
  email: string
  display_name: string
  avatar_url: string | null
  
  // Athlete data
  age: number | null
  gender: Gender | null
  height_cm: number | null
  weight_kg: number | null
  fitness_level: FitnessLevel | null
  hyrox_division: HyroxDivision | null
  hyrox_experience: number | null     // Number of Hyrox races completed
  
  // Training context
  weekly_run_km: number | null
  strength_days_per_week: number | null
  training_hours_per_week: number | null
  
  // Race info
  race_date: string | null            // ISO date "2026-06-08"
  race_location: string | null
  goal_time_minutes: number | null
  race_countdown_days: number | null  // Derived: calculated from race_date
  
  // Weaknesses & notes
  weaknesses: string[] | null         // e.g. ["sled_push", "wall_balls"]
  injuries: string | null             // Free text
  notes: string | null
  
  // Meta
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}
```

**Error Responses**:
- `401` — Not authenticated
- `404` — Profile not found (should never happen due to trigger, but guard)

### 2.2 POST /api/profile

```
POST /api/profile
```

**Purpose**: Complete initial profile setup (onboarding). Updates the auto-created profile row.

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `profiles` |
| Rate limit | 10/min |

**Request Body**:
```typescript
type CreateProfileRequest = {
  display_name?: string
  age?: number                        // 13-100
  gender?: Gender
  height_cm?: number                  // 100-250
  weight_kg?: number                  // 30-300
  fitness_level?: FitnessLevel
  hyrox_division?: HyroxDivision
  hyrox_experience?: number           // 0-100
  weekly_run_km?: number              // 0-300
  strength_days_per_week?: number     // 0-7
  training_hours_per_week?: number    // 0-40
  race_date?: string                  // ISO date, must be in the future
  race_location?: string
  goal_time_minutes?: number          // 30-240
  weaknesses?: string[]
  injuries?: string
  notes?: string
}
```

**Server-side logic**:
1. Validate with Zod schema
2. If `race_date` provided, validate it's in the future
3. Set `onboarding_completed = true`
4. Update profile row (upsert on `user_id`)
5. Return complete profile

**Response 200**: `ProfileResponse`

**Error Responses**:
- `400` — Validation error (with field-level details)
- `401` — Not authenticated
- `409` — Profile already completed (idempotent — re-run is fine, but flag it)

### 2.3 PUT /api/profile

```
PUT /api/profile
```

**Purpose**: Update profile fields. Partial update (PATCH semantics).

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `profiles` |
| Rate limit | 30/min |

**Request Body**: Same as `CreateProfileRequest` — all fields optional. Only provided fields are updated.

**Server-side logic**:
1. Validate with Zod schema (partial)
2. If `race_date` updated, recalculate `race_countdown_days`
3. Update `updated_at`
4. Return complete profile

**Response 200**: `ProfileResponse`

**Error Responses**:
- `400` — Validation error
- `401` — Not authenticated

### 2.4 DELETE /api/profile

```
DELETE /api/profile
```

**Purpose**: Delete the user's account and all associated data.

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | All user tables (cascade) |
| Rate limit | 1/hour |

**Server-side logic**:
1. Uses `SUPABASE_SERVICE_ROLE_KEY` to call `supabase.auth.admin.deleteUser(userId)`
2. All user data cascades via `ON DELETE CASCADE` foreign keys
3. Return 204

**Response 204**: No content

**Error Responses**:
- `401` — Not authenticated
- `500` — Deletion failed

---

## Group 3: AI Coaching Chat

### 3.1 POST /api/chat

```
POST /api/chat
```

**Purpose**: The core product — send a message and receive a streaming AI coaching response. Implements the full 9-step coaching pipeline.

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `profiles`, `conversations`, `messages`, `hyrox_knowledge_chunks` (via RPC) |
| Writes | `messages`, `conversations` (updated_at) |
| Rate limit | 20/min per user |
| Response type | `text/event-stream` (SSE) |

**Request Body**:
```typescript
type ChatRequest = {
  conversation_id: string    // UUID — must belong to user
  message: string            // 1-5000 characters
}
```

**Server-side logic** (THE CRITICAL PATH — implements steps 1-9):

```
Step 1: Validate request, verify conversation ownership
Step 2: Embed user message via OpenAI text-embedding-3-small
Step 3: Hybrid search via supabase.rpc("hybrid_search_chunks", {
          query_text: message,
          query_embedding: embedding,
          match_count: 5,
          full_text_weight: 1.0,
          semantic_weight: 1.0,
          rrf_k: 50
        })
Step 4: Format chunks → context string
Step 5: Build system prompt via SYSTEM_PROMPT_TEMPLATE.replace("{context}", context)
Step 6: Load athlete profile, calculate race_countdown
Step 7: Load last 5-8 conversation turns from messages table
Step 8: Assemble messages array:
         [system_prompt, ?athlete_profile_system_msg, ...history, user_message]
Step 9: Call Nebius streaming API:
         POST https://api.tokenfactory.nebius.com/v1/chat/completions
         {
           model: NEBIUS_MODEL,
           messages: assembled,
           temperature: 0.7,
           max_tokens: 1200,
           stream: true,
           stream_options: { include_usage: true }
         }
Step 10: Stream to client via SSE
Step 11: After stream completes, save both messages to DB
```

**SSE Stream Format**:
```
data: {"token": "Hey"}\n\n
data: {"token": " there"}\n\n
data: {"token": ","}\n\n
data: {"token": " let"}\n\n
...
data: {"token": "", "usage": {"prompt_tokens": 847, "completion_tokens": 312}}\n\n
data: [DONE]\n\n
```

**Response Headers**:
```
Content-Type: text/event-stream
Cache-Control: no-cache, no-transform
Connection: keep-alive
X-Accel-Buffering: no
```

**Error SSE Events** (sent as SSE, not HTTP error codes, since stream has started):
```
data: {"error": {"code": "EMBEDDING_FAILED", "message": "Proceeding without context"}}\n\n
data: {"error": {"code": "MODEL_UNAVAILABLE", "message": "Coach K is temporarily unavailable"}}\n\n
data: [DONE]\n\n
```

**Pre-stream HTTP Error Responses**:
- `400` — Invalid request (empty message, invalid conversation_id)
- `401` — Not authenticated
- `403` — Conversation doesn't belong to user
- `404` — Conversation not found
- `429` — Rate limited

**Post-stream DB Write** (fire-and-forget, don't block the user):
```typescript
type MessageRecord = {
  id: string                // UUID
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  rag_chunks_used: string[] | null   // chunk IDs used for this response
  tokens_in: number | null
  tokens_out: number | null
  latency_ms: number | null          // Time from request to last token
  model: string | null               // NEBIUS_MODEL value
  feedback: FeedbackType | null
  created_at: string
}
```

### 3.2 POST /api/conversations

```
POST /api/conversations
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `conversations` |
| Rate limit | 30/min |

**Request Body**:
```typescript
type CreateConversationRequest = {
  title?: string    // Optional — auto-generated from first message if omitted
}
```

**Response 201**:
```typescript
type ConversationResponse = {
  id: string
  user_id: string
  title: string              // Default: "New conversation"
  is_pinned: boolean         // Default: false
  message_count: number      // Default: 0
  created_at: string
  updated_at: string
}
```

### 3.3 GET /api/conversations

```
GET /api/conversations?page=1&per_page=20
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `conversations` |
| Rate limit | 60/min |

**Query Parameters**:
```typescript
{
  page?: number         // Default: 1
  per_page?: number     // Default: 20, max: 50
}
```

**Response 200**: `PaginatedResponse<ConversationResponse>`

**Ordering**: Pinned first, then by `updated_at` DESC.

### 3.4 GET /api/conversations/:id/messages

```
GET /api/conversations/:id/messages?page=1&per_page=50
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `messages` |
| Rate limit | 60/min |

**Query Parameters**:
```typescript
{
  page?: number        // Default: 1
  per_page?: number    // Default: 50, max: 100
}
```

**Response 200**:
```typescript
type MessageResponse = {
  id: string
  role: 'user' | 'assistant'
  content: string
  feedback: FeedbackType | null
  created_at: string
}
// Wrapped in PaginatedResponse<MessageResponse>
```

**Ordering**: `created_at` ASC (oldest first — natural chat order). Pagination loads from most recent backward (page 1 = newest messages).

### 3.5 PUT /api/conversations/:id

```
PUT /api/conversations/:id
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `conversations` |
| Rate limit | 30/min |

**Request Body**:
```typescript
type UpdateConversationRequest = {
  title?: string
  is_pinned?: boolean
}
```

**Response 200**: `ConversationResponse`

### 3.6 DELETE /api/conversations/:id

```
DELETE /api/conversations/:id
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `conversations`, `messages` (cascade) |
| Rate limit | 10/min |

**Response 204**: No content

### 3.7 POST /api/messages/:id/feedback

```
POST /api/messages/:id/feedback
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `messages` |
| Rate limit | 60/min |

**Request Body**:
```typescript
type FeedbackRequest = {
  feedback: FeedbackType   // 'thumbs_up' | 'thumbs_down'
}
```

**Server-side logic**:
1. Verify message belongs to user's conversation
2. Update `messages.feedback` field
3. Toggle behavior: if same feedback value sent again, clear it (set to null)

**Response 200**:
```typescript
{ feedback: FeedbackType | null }
```

---

## Group 4: Workout Logging

### 4.1 POST /api/workouts

```
POST /api/workouts
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `workouts`, potentially `personal_records` |
| Rate limit | 30/min |

**Request Body**:
```typescript
type CreateWorkoutRequest = {
  workout_type: WorkoutType
  title: string                          // 1-200 chars
  date: string                           // ISO date "2026-02-16"
  duration_minutes: number               // 1-600
  rpe: RPE | null
  notes: string | null                   // Max 2000 chars
  
  // Structured data (optional, based on workout_type)
  distance_km: number | null
  calories: number | null
  heart_rate_avg: number | null
  heart_rate_max: number | null
  
  // Exercise details
  exercises: WorkoutExercise[] | null
  
  // Link to training plan day (if completing a planned workout)
  training_plan_day_id: string | null
}

type WorkoutExercise = {
  exercise_id: string | null          // Reference to exercises table, or null for custom
  exercise_name: string               // Display name
  sets: ExerciseSet[]
  notes: string | null
}

type ExerciseSet = {
  set_number: number
  reps: number | null
  weight_kg: number | null
  distance_m: number | null
  duration_seconds: number | null
  completed: boolean
}
```

**Server-side logic**:
1. Validate with Zod
2. Insert workout
3. **Check for new PRs**: Compare relevant metrics against `personal_records` table
4. If new PR detected: insert/update `personal_records` row, return `new_prs` in response
5. If `training_plan_day_id` provided: mark that day as completed

**Response 201**:
```typescript
type WorkoutResponse = {
  id: string
  user_id: string
  workout_type: WorkoutType
  title: string
  date: string
  duration_minutes: number
  rpe: RPE | null
  notes: string | null
  distance_km: number | null
  calories: number | null
  heart_rate_avg: number | null
  heart_rate_max: number | null
  exercises: WorkoutExercise[] | null
  training_plan_day_id: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
  
  // Included on create only
  new_prs?: PersonalRecordResponse[]
}
```

### 4.2 GET /api/workouts

```
GET /api/workouts?page=1&per_page=20&from=2026-01-01&to=2026-02-16&type=run
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `workouts` |
| Rate limit | 60/min |

**Query Parameters**:
```typescript
{
  page?: number
  per_page?: number       // Default: 20, max: 50
  from?: string           // ISO date — inclusive
  to?: string             // ISO date — inclusive
  type?: WorkoutType      // Filter by workout type
}
```

**Response 200**: `PaginatedResponse<WorkoutResponse>` (without `exercises` for list — lightweight)

**Ordering**: `date` DESC, `created_at` DESC

**Note**: Soft-deleted workouts (`is_deleted = true`) are excluded.

### 4.3 GET /api/workouts/:id

```
GET /api/workouts/:id
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `workouts` |
| Rate limit | 60/min |

**Response 200**: Full `WorkoutResponse` including `exercises` array.

### 4.4 PUT /api/workouts/:id

```
PUT /api/workouts/:id
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `workouts`, potentially `personal_records` |
| Rate limit | 30/min |

**Request Body**: Same as `CreateWorkoutRequest`, all fields optional.

**Server-side logic**:
1. Validate
2. Update workout
3. Re-check PRs (may need to recalculate if metrics changed)

**Response 200**: `WorkoutResponse`

### 4.5 DELETE /api/workouts/:id

```
DELETE /api/workouts/:id
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `workouts` |
| Rate limit | 10/min |

**Server-side logic**: Soft-delete — sets `is_deleted = true`, `deleted_at = now()`. Does NOT recalculate PRs (preserves history).

**Response 204**: No content

---

## Group 5: Training Plans

### 5.1 POST /api/training-plans

```
POST /api/training-plans
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `training_plans`, `training_plan_weeks`, `training_plan_days` |
| Rate limit | 10/min |

**Request Body**:
```typescript
type CreateTrainingPlanRequest = {
  title: string                    // 1-200 chars
  description: string | null
  start_date: string               // ISO date
  end_date: string                 // ISO date
  source: 'manual' | 'ai_generated'
  weeks: TrainingPlanWeekInput[]
}

type TrainingPlanWeekInput = {
  week_number: number              // 1-52
  theme: string | null             // e.g. "Base Building", "Peak Week"
  days: TrainingPlanDayInput[]
}

type TrainingPlanDayInput = {
  day_of_week: number              // 0=Sunday, 6=Saturday
  date: string                     // ISO date
  workout_type: WorkoutType
  title: string
  description: string | null
  duration_minutes: number | null
  exercises: PlannedExercise[] | null
  is_rest_day: boolean
}

type PlannedExercise = {
  exercise_name: string
  sets: number
  reps: string                     // "8-10" or "5"
  weight_prescription: string | null  // "70% 1RM" or "bodyweight"
  rest_seconds: number | null
  notes: string | null
}
```

**Server-side logic**:
1. Validate all dates (end_date > start_date, dates within range)
2. If user has another `active` plan: prompt confirmation or auto-archive
3. Insert plan + weeks + days in a transaction
4. Set status to `active`

**Response 201**:
```typescript
type TrainingPlanResponse = {
  id: string
  user_id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  status: PlanStatus
  source: 'manual' | 'ai_generated'
  progress_percent: number           // Derived: completed_days / total_days * 100
  total_days: number
  completed_days: number
  created_at: string
  updated_at: string
}

// Full plan response includes weeks:
type TrainingPlanDetailResponse = TrainingPlanResponse & {
  weeks: TrainingPlanWeekResponse[]
}

type TrainingPlanWeekResponse = {
  id: string
  week_number: number
  theme: string | null
  days: TrainingPlanDayResponse[]
}

type TrainingPlanDayResponse = {
  id: string
  day_of_week: number
  date: string
  workout_type: WorkoutType
  title: string
  description: string | null
  duration_minutes: number | null
  exercises: PlannedExercise[] | null
  is_rest_day: boolean
  is_completed: boolean
  completed_at: string | null
  workout_id: string | null         // Link to actual workout log if completed
}
```

### 5.2 GET /api/training-plans

```
GET /api/training-plans?status=active
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `training_plans` |
| Rate limit | 60/min |

**Query Parameters**:
```typescript
{
  status?: PlanStatus    // Filter by status
}
```

**Response 200**: `TrainingPlanResponse[]` (without weeks — list view)

### 5.3 GET /api/training-plans/:id

```
GET /api/training-plans/:id
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `training_plans`, `training_plan_weeks`, `training_plan_days` |
| Rate limit | 60/min |

**Response 200**: `TrainingPlanDetailResponse` (full plan with all weeks and days)

### 5.4 PUT /api/training-plans/:id

```
PUT /api/training-plans/:id
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `training_plans` |
| Rate limit | 30/min |

**Request Body**:
```typescript
type UpdateTrainingPlanRequest = {
  title?: string
  description?: string
  status?: PlanStatus
}
```

**Response 200**: `TrainingPlanResponse`

### 5.5 DELETE /api/training-plans/:id

```
DELETE /api/training-plans/:id
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `training_plans` |
| Rate limit | 10/min |

**Server-side logic**: Sets `status = 'archived'` (soft delete — training data is never destroyed).

**Response 204**: No content

### 5.6 PUT /api/training-plans/:id/days/:dayId

```
PUT /api/training-plans/:id/days/:dayId
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `training_plan_days` |
| Rate limit | 30/min |

**Request Body**:
```typescript
type UpdatePlanDayRequest = {
  workout_type?: WorkoutType
  title?: string
  description?: string
  duration_minutes?: number
  exercises?: PlannedExercise[]
  is_rest_day?: boolean
}
```

**Response 200**: `TrainingPlanDayResponse`

### 5.7 POST /api/training-plans/:id/days/:dayId/complete

```
POST /api/training-plans/:id/days/:dayId/complete
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `training_plan_days`, `workouts`, potentially `personal_records` |
| Rate limit | 30/min |

**Request Body**:
```typescript
type CompletePlanDayRequest = {
  // Full workout data — same as CreateWorkoutRequest minus training_plan_day_id
  duration_minutes: number
  rpe: RPE | null
  notes: string | null
  distance_km: number | null
  exercises: WorkoutExercise[] | null
}
```

**Server-side logic**:
1. Create a workout log with `training_plan_day_id` set
2. Mark day as `is_completed = true`, `completed_at = now()`
3. Link `workout_id` on the plan day
4. Check for PRs
5. Recalculate plan `progress_percent`

**Response 201**: `WorkoutResponse` (with `new_prs` if any)

---

## Group 6: Benchmarks & PRs

### 6.1 POST /api/benchmarks

```
POST /api/benchmarks
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `benchmarks`, `personal_records` |
| Rate limit | 30/min |

**Request Body**:
```typescript
type CreateBenchmarkRequest = {
  benchmark_type: BenchmarkType
  value: number                     // Time in seconds, weight in kg, etc.
  unit: 'seconds' | 'kg' | 'meters' | 'reps'
  date: string                      // ISO date
  notes: string | null
}
```

**Server-side logic**:
1. Insert benchmark record
2. Compare against existing PR for this benchmark type
3. If new PR: update `personal_records` table
4. Return benchmark with PR status

**Response 201**:
```typescript
type BenchmarkResponse = {
  id: string
  benchmark_type: BenchmarkType
  value: number
  unit: string
  date: string
  notes: string | null
  is_pr: boolean                    // Was this a new PR?
  created_at: string
}
```

### 6.2 GET /api/benchmarks

```
GET /api/benchmarks?type=ski_erg_1000m&page=1&per_page=20
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `benchmarks` |
| Rate limit | 60/min |

**Query Parameters**:
```typescript
{
  type?: BenchmarkType
  page?: number
  per_page?: number    // Default: 20
}
```

**Response 200**: `PaginatedResponse<BenchmarkResponse>`

### 6.3 GET /api/personal-records

```
GET /api/personal-records
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `personal_records` |
| Rate limit | 60/min |

**Response 200**:
```typescript
type PersonalRecordResponse = {
  id: string
  benchmark_type: BenchmarkType
  value: number
  unit: string
  achieved_at: string               // ISO date
  previous_value: number | null     // What the old PR was
  improvement_percent: number | null
}

// Returns: PersonalRecordResponse[]
```

### 6.4 GET /api/personal-records/history

```
GET /api/personal-records/history?type=ski_erg_1000m
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `benchmarks` |
| Rate limit | 60/min |

**Query Parameters**:
```typescript
{
  type: BenchmarkType   // Required
}
```

**Response 200**:
```typescript
type PRHistoryPoint = {
  date: string
  value: number
  was_pr: boolean       // Was this value a PR at the time?
}

// Returns: PRHistoryPoint[]
```

**Ordering**: `date` ASC (for chart rendering)

---

## Group 7: Race Results

### 7.1 POST /api/races

```
POST /api/races
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `race_results`, `race_splits` |
| Rate limit | 10/min |

**Request Body**:
```typescript
type CreateRaceRequest = {
  race_name: string                  // "Hyrox London 2026"
  race_date: string                  // ISO date
  location: string | null
  division: HyroxDivision
  overall_time_seconds: number       // Total time in seconds
  overall_rank: number | null
  division_rank: number | null
  notes: string | null
  
  splits: RaceSplitInput[]
}

type RaceSplitInput = {
  station_order: number             // 1-8
  station_name: string              // "Ski Erg", "Sled Push", etc.
  station_time_seconds: number
  run_time_seconds: number          // The 1km run before this station
  transition_time_seconds: number | null
}
```

**Response 201**:
```typescript
type RaceResultResponse = {
  id: string
  race_name: string
  race_date: string
  location: string | null
  division: HyroxDivision
  overall_time_seconds: number
  overall_time_formatted: string    // Derived: "1:12:34"
  overall_rank: number | null
  division_rank: number | null
  notes: string | null
  total_run_time_seconds: number    // Derived: sum of all run splits
  total_station_time_seconds: number // Derived: sum of all station splits
  created_at: string
  updated_at: string
}
```

### 7.2 GET /api/races

```
GET /api/races
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `race_results` |
| Rate limit | 60/min |

**Response 200**: `RaceResultResponse[]`

**Ordering**: `race_date` DESC

### 7.3 GET /api/races/:id

```
GET /api/races/:id
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `race_results`, `race_splits` |
| Rate limit | 60/min |

**Response 200**:
```typescript
type RaceDetailResponse = RaceResultResponse & {
  splits: RaceSplitResponse[]
}

type RaceSplitResponse = {
  id: string
  station_order: number
  station_name: string
  station_time_seconds: number
  station_time_formatted: string    // "3:45"
  run_time_seconds: number
  run_time_formatted: string        // "4:30"
  transition_time_seconds: number | null
  cumulative_time_seconds: number   // Derived: running total at this point
}
```

### 7.4 PUT /api/races/:id

```
PUT /api/races/:id
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `race_results`, `race_splits` |
| Rate limit | 10/min |

**Request Body**: Same as `CreateRaceRequest`, all fields optional. If `splits` provided, replaces all splits (delete + re-insert).

**Response 200**: `RaceDetailResponse`

### 7.5 DELETE /api/races/:id

```
DELETE /api/races/:id
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `race_results`, `race_splits` (cascade) |
| Rate limit | 10/min |

**Response 204**: No content

---

## Group 8: Goals & Achievements

### 8.1 POST /api/goals

```
POST /api/goals
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `goals` |
| Rate limit | 20/min |

**Request Body**:
```typescript
type CreateGoalRequest = {
  goal_type: GoalType
  title: string                     // "Break 80 minutes"
  description: string | null
  target_value: number              // e.g. 4800 (80 min in seconds)
  target_unit: string               // "seconds", "kg", "count"
  current_value: number | null      // Starting value
  target_date: string | null        // ISO date (optional deadline)
}
```

**Response 201**:
```typescript
type GoalResponse = {
  id: string
  goal_type: GoalType
  title: string
  description: string | null
  target_value: number
  target_unit: string
  current_value: number
  progress_percent: number          // Derived: current/target * 100 (capped at 100)
  target_date: string | null
  status: GoalStatus
  completed_at: string | null
  created_at: string
  updated_at: string
}
```

### 8.2 GET /api/goals

```
GET /api/goals?status=active
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `goals` |
| Rate limit | 60/min |

**Query Parameters**:
```typescript
{
  status?: GoalStatus    // Default: 'active'
}
```

**Response 200**: `GoalResponse[]`

### 8.3 PUT /api/goals/:id

```
PUT /api/goals/:id
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `goals`, potentially `user_achievements` |
| Rate limit | 30/min |

**Request Body**:
```typescript
type UpdateGoalRequest = {
  title?: string
  description?: string
  target_value?: number
  current_value?: number
  target_date?: string
  status?: GoalStatus
}
```

**Server-side logic**:
1. If `current_value >= target_value`: auto-set `status = 'completed'`, `completed_at = now()`
2. If goal completed: check for achievement unlocks (e.g., "First Goal Completed")
3. Return achievement unlocks in response if any

**Response 200**:
```typescript
type GoalUpdateResponse = GoalResponse & {
  achievements_unlocked?: AchievementResponse[]
}
```

### 8.4 DELETE /api/goals/:id

```
DELETE /api/goals/:id
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Writes | `goals` |
| Rate limit | 10/min |

**Server-side logic**: Sets `status = 'abandoned'` (soft delete).

**Response 204**: No content

### 8.5 GET /api/achievements

```
GET /api/achievements
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `user_achievements`, `achievement_definitions` |
| Rate limit | 60/min |

**Response 200**:
```typescript
type AchievementResponse = {
  id: string
  definition_id: string
  title: string
  description: string
  icon: string                     // Icon name or emoji
  category: string                 // "training", "racing", "consistency", etc.
  earned_at: string
}

// Returns: AchievementResponse[]
```

### 8.6 GET /api/achievements/available

```
GET /api/achievements/available
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `achievement_definitions`, `user_achievements` |
| Rate limit | 60/min |

**Response 200**:
```typescript
type AchievementDefinitionResponse = {
  id: string
  title: string
  description: string
  icon: string
  category: string
  criteria: string                 // Human-readable criteria
  is_earned: boolean
  earned_at: string | null
  progress: number | null          // 0-100, null if not trackable
}

// Returns: AchievementDefinitionResponse[]
```

---

## Group 9: Dashboard Aggregates

### Design Decision: Single Aggregate vs. Multiple Endpoints

**Recommendation: Single aggregate endpoint** with parallel server-side queries.

| Approach | Pros | Cons |
|----------|------|------|
| **Single `/api/dashboard`** | One request, one loading state, easy to cache as unit, reduces client waterfall | Slower if any sub-query is slow, all-or-nothing cache |
| **Multiple endpoints** | Individual caching, partial updates, parallel from client | Multiple loading states, client waterfall risk, more complex |

**Verdict**: Use a single endpoint. Server-side, run all queries in parallel with `Promise.all()`. The dashboard is the landing page — it must load fast with a single request. For partial updates after mutations, use TanStack Query's `invalidateQueries` to refetch just this one endpoint (fast server-side re-aggregation).

### 9.1 GET /api/dashboard

```
GET /api/dashboard
```

| Field | Value |
|-------|-------|
| Auth | Authenticated |
| Reads | `profiles`, `training_plans`, `training_plan_days`, `workouts`, `personal_records`, `goals`, `benchmarks`, `race_results` |
| Rate limit | 60/min |
| Cache | stale-while-revalidate: 30s |

**Response 200**:
```typescript
type DashboardResponse = {
  // Race countdown
  race: {
    race_date: string | null
    race_location: string | null
    countdown_days: number | null
    goal_time_minutes: number | null
  } | null

  // Today's workout from active training plan
  today_workout: {
    plan_id: string
    plan_title: string
    day: TrainingPlanDayResponse
  } | null

  // Weekly training summary (current week: Mon-Sun)
  weekly_summary: {
    week_start: string              // ISO date
    workouts_completed: number
    total_duration_minutes: number
    average_rpe: number | null
    workout_types: Record<WorkoutType, number>  // Count per type
  }

  // Training streak
  streak: {
    current_days: number            // Consecutive days with a logged workout
    longest_days: number
    last_workout_date: string | null
  }

  // Recent PRs (last 30 days)
  recent_prs: PersonalRecordResponse[]    // Max 5

  // Active goals progress
  active_goals: GoalResponse[]            // Max 5

  // Estimated race time (based on latest benchmarks)
  estimated_race_time: {
    estimated_seconds: number | null
    confidence: 'low' | 'medium' | 'high'
    based_on: string[]              // Which benchmarks were used
    last_calculated: string
  } | null
  
  // Quick stats
  stats: {
    total_workouts: number
    total_races: number
    member_since: string
  }
}
```

**Server-side logic**: Run 8+ queries in parallel:
```
Promise.all([
  getProfile(userId),
  getActivePlanTodayWorkout(userId),
  getWeeklySummary(userId),
  getStreak(userId),
  getRecentPRs(userId),
  getActiveGoals(userId),
  estimateRaceTime(userId),
  getQuickStats(userId),
])
```

**Race time estimation logic** (simplified):
- If user has benchmarks for ≥4 stations: weighted sum with known correlations
- Confidence based on recency and completeness of benchmark data
- This is a server-side calculation, NOT an AI call

---

## Group 10: Reference Data

### 10.1 GET /api/stations

```
GET /api/stations
```

| Field | Value |
|-------|-------|
| Auth | Public |
| Reads | `hyrox_stations` |
| Cache | `Cache-Control: public, max-age=86400, s-maxage=86400` (24h) |

**Response 200**:
```typescript
type StationResponse = {
  id: string
  station_order: number
  name: string                      // "Ski Erg"
  description: string
  distance_or_reps: string          // "1000m" or "100m"
  equipment: string[]
  tips: string[]
  muscles_targeted: string[]
  preceding_run_km: number          // Always 1.0
}

// Returns: StationResponse[]
```

### 10.2 GET /api/exercises

```
GET /api/exercises?category=strength
```

| Field | Value |
|-------|-------|
| Auth | Public |
| Reads | `exercises` |
| Cache | `Cache-Control: public, max-age=86400` |

**Query Parameters**:
```typescript
{
  category?: string     // "strength", "cardio", "mobility", "hyrox_specific"
  search?: string       // Text search on name
}
```

**Response 200**:
```typescript
type ExerciseResponse = {
  id: string
  name: string
  category: string
  description: string
  muscles_targeted: string[]
  equipment: string[]
  video_url: string | null
}

// Returns: ExerciseResponse[]
```

### 10.3 GET /api/benchmarks/reference

```
GET /api/benchmarks/reference
```

| Field | Value |
|-------|-------|
| Auth | Public |
| Reads | `benchmark_references` |
| Cache | `Cache-Control: public, max-age=86400` |

**Response 200**:
```typescript
type BenchmarkReferenceResponse = {
  benchmark_type: BenchmarkType
  station_name: string
  unit: string
  levels: {
    beginner: { male: number, female: number }
    intermediate: { male: number, female: number }
    advanced: { male: number, female: number }
    elite: { male: number, female: number }
  }
}

// Returns: BenchmarkReferenceResponse[]
```

---

## Rate Limiting Strategy

| Tier | Limit | Applies To |
|------|-------|-----------|
| **Chat** | 20 requests/min per user | `POST /api/chat` |
| **Write** | 30 requests/min per user | All POST/PUT endpoints |
| **Read** | 60 requests/min per user | All GET endpoints |
| **Destructive** | 10 requests/min per user | All DELETE endpoints |
| **Account** | 1 request/hour per user | `DELETE /api/profile` |

**Implementation**: Use Vercel's Edge Config + in-memory rate limiter, or `upstash/ratelimit` with Redis. For v1, a simple in-memory `Map<userId, {count, windowStart}>` in the Route Handler is acceptable given single-user nature.

---

# Deliverable 2: State Management Plan

## 2.1 Library Choices

### Server State: TanStack Query v5

**Why TanStack Query over alternatives**:

| Option | Verdict | Reason |
|--------|---------|--------|
| **TanStack Query v5** | ✅ Chosen | Mature, excellent cache invalidation, optimistic updates, SSR/hydration support, devtools |
| SWR | ❌ | Simpler but weaker mutation/invalidation story; no built-in optimistic update primitives |
| Supabase Realtime | ❌ for v1 | Overkill for single-user app; SSE handles chat streaming; adds complexity |
| React Server Components only | ❌ | Chat UI needs client-side state management; RSCs can't handle streaming chat |

**Configuration**:
```typescript
// Shared QueryClient config
{
  defaultOptions: {
    queries: {
      staleTime: 60_000,              // 1 min default
      gcTime: 5 * 60_000,             // 5 min garbage collection
      retry: 1,                        // Retry once on failure
      refetchOnWindowFocus: false,     // Disable for mobile-first UX
    },
    mutations: {
      retry: 0,                        // Don't retry mutations
    }
  }
}
```

### Client State: Zustand

**Why Zustand over alternatives**:

| Option | Verdict | Reason |
|--------|---------|--------|
| **Zustand** | ✅ Chosen | Minimal API, no boilerplate, works outside React (timers), tiny bundle (~1KB) |
| React Context | ❌ | Re-render problems with frequently updating state (chat stream, timers) |
| Jotai | Considered | Good for atomic state but Zustand is simpler for our slice-based needs |
| Redux Toolkit | ❌ | Too heavy for this use case |

**Zustand Stores**:

```typescript
// 1. Chat Store — manages streaming state
type ChatStore = {
  activeConversationId: string | null
  streamingMessage: string           // Accumulating streamed tokens
  isStreaming: boolean
  error: string | null
  
  setActiveConversation: (id: string) => void
  appendToken: (token: string) => void
  startStreaming: () => void
  stopStreaming: () => void
  setError: (error: string | null) => void
  reset: () => void
}

// 2. Onboarding Store — multi-step form state
type OnboardingStore = {
  currentStep: number                // 0-4
  formData: Partial<CreateProfileRequest>
  
  setStep: (step: number) => void
  updateFormData: (data: Partial<CreateProfileRequest>) => void
  reset: () => void
}

// 3. Workout Timer Store — for live workout logging
type WorkoutTimerStore = {
  isRunning: boolean
  startedAt: number | null           // Date.now()
  elapsed: number                    // Seconds
  
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => number                 // Returns final elapsed
  reset: () => void
}

// 4. UI Store — global UI state
type UIStore = {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  toasts: Toast[]
  
  toggleSidebar: () => void
  setTheme: (theme: string) => void
  addToast: (toast: Toast) => void
  removeToast: (id: string) => void
}
```

### Auth State: Supabase Auth + React Context

Supabase Auth manages the session. We wrap it in a thin React Context for consuming in components:

```typescript
type AuthContext = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>
  signOut: () => Promise<void>
}
```

---

## 2.2 Query Key Schema

Consistent, hierarchical query keys for cache management:

```typescript
const queryKeys = {
  // Profile
  profile: ['profile'] as const,
  
  // Conversations
  conversations: {
    all: ['conversations'] as const,
    list: (page: number) => ['conversations', 'list', page] as const,
    detail: (id: string) => ['conversations', id] as const,
    messages: (id: string, page: number) => ['conversations', id, 'messages', page] as const,
  },
  
  // Workouts
  workouts: {
    all: ['workouts'] as const,
    list: (filters: WorkoutFilters) => ['workouts', 'list', filters] as const,
    detail: (id: string) => ['workouts', id] as const,
  },
  
  // Training Plans
  trainingPlans: {
    all: ['training-plans'] as const,
    list: (status?: PlanStatus) => ['training-plans', 'list', status] as const,
    detail: (id: string) => ['training-plans', id] as const,
  },
  
  // Benchmarks & PRs
  benchmarks: {
    all: ['benchmarks'] as const,
    list: (type?: BenchmarkType) => ['benchmarks', 'list', type] as const,
    references: ['benchmarks', 'references'] as const,
  },
  personalRecords: {
    all: ['personal-records'] as const,
    history: (type: BenchmarkType) => ['personal-records', 'history', type] as const,
  },
  
  // Races
  races: {
    all: ['races'] as const,
    detail: (id: string) => ['races', id] as const,
  },
  
  // Goals & Achievements
  goals: {
    all: ['goals'] as const,
    list: (status?: GoalStatus) => ['goals', 'list', status] as const,
  },
  achievements: {
    earned: ['achievements', 'earned'] as const,
    available: ['achievements', 'available'] as const,
  },
  
  // Dashboard
  dashboard: ['dashboard'] as const,
  
  // Reference (public, long cache)
  stations: ['stations'] as const,
  exercises: {
    all: ['exercises'] as const,
    list: (category?: string) => ['exercises', 'list', category] as const,
  },
}
```

---

## 2.3 Cache Configuration Per Data Type

```typescript
const cacheConfig = {
  // ─── Long-lived (rarely changes) ───
  profile:            { staleTime: 5 * 60_000 },     // 5 min
  stations:           { staleTime: Infinity },         // Never stale (static)
  exercises:          { staleTime: Infinity },         // Never stale (static)
  benchmarkRefs:      { staleTime: Infinity },         // Never stale (static)
  achievements:       { staleTime: 5 * 60_000 },      // 5 min

  // ─── Medium-lived ───
  conversationList:   { staleTime: 60_000 },           // 1 min
  workoutList:        { staleTime: 60_000 },           // 1 min
  trainingPlanList:   { staleTime: 60_000 },           // 1 min
  goalList:           { staleTime: 60_000 },           // 1 min
  raceList:           { staleTime: 2 * 60_000 },       // 2 min
  personalRecords:    { staleTime: 60_000 },           // 1 min

  // ─── Short-lived (frequently changes) ───
  dashboard:          { staleTime: 30_000 },           // 30s
  conversationMsgs:   { staleTime: 0 },                // Always refetch (chat is live)

  // ─── No cache ───
  chat:               { staleTime: 0, gcTime: 0 },    // Streaming, no cache
}
```

---

## 2.4 Cache Invalidation Map

When a mutation succeeds, which queries need to be invalidated?

```
┌──────────────────────────────────┬──────────────────────────────────────────┐
│ Mutation                         │ Invalidate                               │
├──────────────────────────────────┼──────────────────────────────────────────┤
│ Update profile                   │ profile, dashboard                       │
│                                  │                                          │
│ Send chat message                │ conversations.messages(id),              │
│                                  │ conversations.list                       │
│                                  │                                          │
│ Create conversation              │ conversations.list                       │
│                                  │                                          │
│ Delete conversation              │ conversations.all (full prefix)          │
│                                  │                                          │
│ Log workout                      │ workouts.all, dashboard,                 │
│                                  │ personalRecords.all, trainingPlans.all   │
│                                  │                                          │
│ Update/delete workout            │ workouts.all, dashboard,                 │
│                                  │ personalRecords.all                      │
│                                  │                                          │
│ Complete plan day                │ trainingPlans.detail(id), workouts.all,  │
│                                  │ dashboard, personalRecords.all           │
│                                  │                                          │
│ Log benchmark                    │ benchmarks.all, personalRecords.all,     │
│                                  │ dashboard                                │
│                                  │                                          │
│ Log race                         │ races.all, dashboard                     │
│                                  │                                          │
│ Update goal                      │ goals.all, achievements.all, dashboard   │
│                                  │                                          │
│ Create/update/archive plan       │ trainingPlans.all, dashboard             │
│                                  │                                          │
│ Submit message feedback          │ conversations.messages(convId)           │
└──────────────────────────────────┴──────────────────────────────────────────┘
```

---

## 2.5 Optimistic Updates

Only apply optimistic updates where the UI feels laggy without them and the success probability is very high:

| Mutation | Optimistic? | Strategy |
|----------|-------------|----------|
| Send chat message | ✅ Yes | Append user message to message list immediately, show streaming placeholder |
| Toggle message feedback | ✅ Yes | Toggle icon immediately, rollback on error |
| Mark plan day complete | ✅ Yes | Check the checkbox immediately, rollback on error |
| Update goal progress | ✅ Yes | Update progress bar immediately |
| Log workout | ❌ No | Form submission — show loading spinner, redirect on success |
| Delete conversation | ❌ No | Show confirmation dialog, then loading state |
| Create training plan | ❌ No | Complex multi-write — show loading overlay |

---

## 2.6 Data Flow Diagrams

### Chat Message Flow

```
┌─────────────┐
│ User types   │
│ message      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ ChatInput component                  │
│ 1. Zustand: chatStore.startStreaming │
│ 2. Optimistic: append user msg      │
│ 3. POST /api/chat (SSE fetch)       │
└──────────────┬──────────────────────┘
               │
               ▼ (SSE stream)
┌─────────────────────────────────────┐
│ Stream handler (client)              │
│ 1. For each token:                   │
│    chatStore.appendToken(token)      │
│ 2. On [DONE]:                        │
│    chatStore.stopStreaming()          │
│    queryClient.invalidateQueries(    │
│      conversations.messages(id))     │
│    queryClient.invalidateQueries(    │
│      conversations.list)             │
│ 3. On error:                         │
│    chatStore.setError(msg)           │
│    Show retry button                 │
└─────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ ChatMessages component               │
│ - Renders from TanStack Query cache  │
│   (messages from DB) +               │
│   Zustand streaming buffer           │
│ - After invalidation: DB messages    │
│   include the new pair               │
│ - Streaming buffer clears            │
└─────────────────────────────────────┘
```

### Log Workout Flow

```
┌─────────────────┐
│ WorkoutForm      │
│ (client comp)    │
└──────┬──────────┘
       │ Submit
       ▼
┌─────────────────────────────────────┐
│ useMutation('logWorkout')            │
│ 1. Show loading state on button      │
│ 2. POST /api/workouts                │
└──────────────┬──────────────────────┘
               │
               ▼ (server)
┌─────────────────────────────────────┐
│ Route Handler                        │
│ 1. Zod validate                      │
│ 2. Insert workout                    │
│ 3. Check PRs                         │
│ 4. If PR: insert personal_records    │
│ 5. Return { workout, new_prs }       │
└──────────────┬──────────────────────┘
               │
               ▼ (client onSuccess)
┌─────────────────────────────────────┐
│ onSuccess handler                    │
│ 1. invalidateQueries([              │
│      'workouts',                     │
│      'dashboard',                    │
│      'personal-records',             │
│      'training-plans'                │
│    ])                                │

---

## Sources

- [Next.js 16 Route Handlers Explained: 3 Advanced Use Cases - Strapi](https://strapi.io/blog/nextjs-16-route-handlers-explained-3-advanced-usecases)
- [Use Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [Does TanStack (React) Query work with the Next.js App router (React Server Components) · TanStack query · Discussion #5725](https://github.com/TanStack/query/discussions/5725)
- [Getting Started: Route Handlers | Next.js](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Build a User Management App with Next.js | Supabase Docs](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [The Complete Guide to TanStack Query in Next.js App Router](https://ihsaninh.com/blog/the-complete-guide-to-tanstack-query-next.js-app-router)
- [Next.js 16](https://nextjs.org/blog/next-16)
- [Supabase Auth with the Next.js App Router](https://docs-9t0nr0rx3-supabase.vercel.app/docs/guides/auth/auth-helpers/nextjs)
- [Advanced Server Rendering | TanStack Query React Docs](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- [Route Handlers | Next.js 16 日本語ドキュメント](https://nextjsjp.org/docs/app/getting-started/route-handlers)
- [The Right Way to do Auth with the Next.js App Router - UPDATED](https://www.youtube.com/watch?v=v6UvgfSIjQ0)
- [React Query with Next.js Server Components](https://www.youtube.com/watch?v=AnRshBKUApg)
- [Routing: Middleware | Next.js](https://docsarchive.dev/nextjs/13.5/using-app-router/building-your-application/routing/middleware/)
- [supabase/apps/docs/content/guides/auth/auth-helpers/nextjs-pages.mdx at master · supabase/supabase](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/auth-helpers/nextjs-pages.mdx)
- [Announcing TanStack Query v5](https://tanstack.com/blog/announcing-tanstack-query-v5)
- [Server Actions And...](https://auth0.com/blog/whats-new-nextjs-16/)
- [How to handle createServerClient & createBrowserClient in NextJS ...](https://github.com/orgs/supabase/discussions/22628)
- [Nebius Token Factory](https://nebius.com/services/token-factory)
- [Next.js 16 Middleware DEPRECATED - Authentication In Proxy Or Data Access Layer?](https://www.youtube.com/watch?v=zNgCFXZLoRk)
- [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Introduction - Nebius Token Factory documentation](https://docs.tokenfactory.nebius.com/api-reference/introduction)
- [File-system conventions: proxy.js](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Migrating to the SSR package from Auth Helpers | Supabase Docs](https://supabase.com/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers)
- [Nebius Token Factory | Models | Mastra Docs](https://mastra.ai/models/providers/nebius)
- [using @supabase/ssr clients with nextjs #21303](https://github.com/orgs/supabase/discussions/21303)
- [Nebius Token Factory | Models](https://mastra.ai/models/v1/providers/nebius)
- [What Next.js is Actually Trying...](https://www.buildwithmatija.com/blog/nextjs16-middleware-change)
- [Issues · supabase/ssr](https://github.com/supabase/ssr/issues)
- [Exploring Nebius Token Factory | Open LLMs, AI Agents, Batch Inference, Fine-Tuning and more...](https://www.youtube.com/watch?v=Qfh4SdaLhNY)

---

## Original Prompt

```
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

- When the athlete hasn't shared their fitness level, experienc
```
