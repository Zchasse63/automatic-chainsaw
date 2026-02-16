# Phase 2: Final Database Schema Design — Hyrox AI Coach

> **Role**: You are a database architect planning the complete PostgreSQL schema for a Hyrox AI Coach application. Your output is a single, production-ready SQL migration file that Claude Code will execute against Supabase. You are in research/planning mode — do NOT execute anything. Produce the SQL file and a design decisions document.

---

## Project Context

This is a full-featured Hyrox AI training application with:
- AI coaching chat (fine-tuned Llama 3.3 70B via Nebius, RAG via Supabase PGVector)
- Workout logging and training plan management
- Performance analytics, benchmarks, and PR tracking
- Race result logging with per-station split times
- Goal setting and milestone tracking
- Full athlete profile with progression system

The backend is **Supabase** (PostgreSQL + Auth + PGVector). The Supabase project is already provisioned at `https://txwkfaygckwxddxjlsun.supabase.co`.

---

## What Already Exists (DO NOT recreate or modify)

### `knowledge_chunks` table (239 rows, RLS disabled — intentional)
```sql
knowledge_chunks (
  id text primary key,
  source_doc text not null,
  source_name text,
  section text,
  content text not null,
  topic_tags text[],
  chunk_index int,
  word_count int,
  est_tokens int,
  fts tsvector,
  embedding vector(1536),
  created_at timestamptz
)
```

### Existing RPC functions (DO NOT recreate)
- `hybrid_search_chunks(query_text, query_embedding, match_count, full_text_weight, semantic_weight, rrf_k)`
- `match_chunks(query_embedding, match_threshold, match_count)`

---

## Tables to Design

You need to produce the final schema covering ALL of the following. Some have draft SQL from an earlier handoff doc (included below as starting points) — review, reconcile, and expand them. Others are new and need designing from scratch.

### Core Tables (drafts exist — review, modify, finalize)

#### 1. `athlete_profiles` — Persistent athlete state
Draft:
```sql
create table athlete_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  display_name text,
  weight_kg numeric,
  height_cm numeric,
  age int,
  sex text check (sex in ('male', 'female', 'other')),
  training_history jsonb,        -- {"run_mpw": 40, "strength_days": 4, "experience": "intermediate"}
  current_phase text,            -- general_prep | specific_prep | competition_prep | taper
  race_date date,
  goal_time_minutes numeric,
  weekly_availability_hours numeric,
  equipment_available text[],
  injuries_limitations text[],
  preferences jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```
**Expand to include**: Hyrox division (open/pro/doubles/relay), hyrox_race_count (experience indicator), profile_complete boolean flag, avatar_url, units_preference (metric/imperial). Consider whether `age` should be `date_of_birth` instead (age changes yearly, DOB doesn't).

#### 2. `conversations` + `messages` — Chat history and training data collection
Draft:
```sql
create table conversations (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athlete_profiles(id) on delete cascade,
  started_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  rag_chunks_used text[],
  tokens_in int,
  tokens_out int,
  latency_ms int,
  created_at timestamptz default now()
);
```
**Expand to include**: conversation title/topic (auto-generated or user-set), pinned boolean on messages, feedback (thumbs_up/thumbs_down) on assistant messages for future training data collection, suggested_actions jsonb on assistant messages (for AI-generated action items like "Log this workout" or "Schedule a benchmark test").

#### 3. `workout_logs` — Training history
Draft:
```sql
create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athlete_profiles(id) on delete cascade,
  date date not null,
  session_type text,
  prescribed_workout jsonb,
  completed_workout jsonb,
  rpe_pre int check (rpe_pre between 1 and 10),
  rpe_post int check (rpe_post between 1 and 10),
  duration_minutes int,
  notes text,
  created_at timestamptz default now()
);
```
**Expand to include**: linked training_plan_day_id (optional FK to training plan), linked conversation_id (if workout came from AI chat), completion_status check constraint (completed/partial/skipped), heart_rate_avg (optional), calories_estimated (optional). Add soft-delete via `deleted_at timestamptz`.

#### 4. `benchmark_tests` — Structured performance tests
Draft:
```sql
create table benchmark_tests (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references athlete_profiles(id) on delete cascade,
  test_date date not null,
  test_type text,
  results jsonb,
  notes text,
  created_at timestamptz default now()
);
```
**Design decision needed**: Should this be merged with or linked to personal_records? Recommendation: Keep separate. Benchmarks = structured tests done intentionally (Cooper test, 2K time trial, station tests). PRs = best-ever performances tracked automatically from any context.

### New Tables (no drafts — design from scratch)

#### 5. `hyrox_stations` — Reference data (8 stations)
Static reference table for the 8 Hyrox workout stations. Fields needed:
- station_number (1-8)
- station_name (SkiErg, Sled Push, Sled Pull, Burpee Broad Jumps, Rowing, Farmers Carry, Sandbag Lunges, Wall Balls)
- exercise_type
- distance_or_reps (text — "1000m", "50m", "80m", "100 reps", etc.)
- weight_open_men_kg, weight_open_women_kg, weight_pro_men_kg, weight_pro_women_kg
- description
- tips (JSONB — technique tips array)

This table gets seeded with data in Phase 3.

#### 6. `exercise_library` — Reference table for exercises
Exercise definitions used across training plans and workout logs:
- name, category (run/strength/conditioning/station-specific/recovery/mobility)
- description, muscle_groups text[]
- equipment_needed text[]
- hyrox_station_id (nullable FK — links station-specific exercises to their station)
- difficulty (beginner/intermediate/advanced)
- video_url (optional, for future)
- is_active boolean

This table gets seeded with data in Phase 3.

#### 7. `race_results` — Official and simulation race data
Full race logging:
- athlete_id FK
- race_date, race_name, location
- division (open/pro/age_group), format (singles/doubles/relay)
- total_time_seconds
- is_simulation boolean
- conditions text (weather, venue notes)
- notes
- created_at

#### 8. `race_splits` — Per-station and per-run segment times
Child of race_results. Each race has up to 16 splits (8 running segments + 8 station segments):
- race_result_id FK
- split_number (1-16 — sequential order)
- split_type check (run/station)
- station_id (nullable FK to hyrox_stations — only for station splits)
- time_seconds
- transition_time_seconds (time between finishing one segment and starting next)
- heart_rate_avg (optional)
- notes

#### 9. `training_plans` — Plan metadata
- athlete_id FK
- plan_name
- duration_weeks int
- goal text
- difficulty (beginner/intermediate/advanced/custom)
- is_ai_generated boolean
- status check (active/archived/draft)
- start_date, end_date
- source_conversation_id (nullable FK — if generated from AI chat)
- created_at, updated_at

#### 10. `training_plan_weeks` — Weekly structure
Child of training_plans:
- training_plan_id FK
- week_number int
- focus text (e.g., "Base Building", "Station Technique", "Race Simulation")
- target_volume_hours numeric
- notes
- created_at

#### 11. `training_plan_days` — Daily workouts within plan
Child of training_plan_weeks:
- training_plan_week_id FK
- day_of_week int (1=Monday through 7=Sunday)
- workout_title text
- workout_description text
- workout_details jsonb (exercises, sets, reps, distances, etc.)
- session_type check (run/hiit/strength/simulation/recovery/rest)
- estimated_duration_minutes int
- is_rest_day boolean default false
- is_completed boolean default false
- linked_workout_log_id (nullable FK — links to actual workout log when completed)
- notes
- created_at

#### 12. `personal_records` — PR tracking with history
- athlete_id FK
- record_type check (station_time/exercise_weight/exercise_reps/running_pace/race_time)
- exercise_name text (or exercise_library_id FK — decide which)
- station_id (nullable FK to hyrox_stations)
- value numeric (the PR value — time in seconds, weight in kg, pace in min/km, etc.)
- value_unit text (seconds/kg/lbs/min_per_km/reps)
- date_achieved date
- context check (training/race/benchmark)
- previous_value numeric (for tracking improvement delta)
- notes
- created_at

**Design consideration**: Should we store the full PR history (every recorded value) or just current + previous? Recommendation: Store every record, then query "best" at read time. This enables historical progression charts.

#### 13. `goals` — Goal setting and tracking
- athlete_id FK
- goal_type check (race_time/station_time/running_pace/body_comp/consistency/training_volume/custom)
- title text
- description text
- target_value numeric
- target_unit text
- current_value numeric
- target_date date (nullable — some goals are open-ended)
- station_id (nullable FK — for station-specific goals)
- status check (active/completed/abandoned)
- completed_at timestamptz
- created_at, updated_at

#### 14. `achievement_definitions` — Reference table for achievements
- id, name, description, icon_name, category
- criteria jsonb (machine-readable unlock conditions)
- Examples: "First Race Logged," "Sub-90 Minute Hyrox," "30-Day Training Streak," "All Stations Benchmarked," "First AI Coaching Session"

#### 15. `athlete_achievements` — Join table
- athlete_id FK
- achievement_id FK
- earned_at timestamptz
- context jsonb (what triggered it — race_result_id, workout_log_id, etc.)

---

## Design Principles (follow all of these)

1. **UUIDs for all primary keys** — `gen_random_uuid()`
2. **`created_at` and `updated_at`** on every mutable table — with auto-update trigger
3. **`athlete_id` or `user_id` FK** on all user-owned data
4. **Normalize reference data** — stations, exercises, achievement definitions get their own tables
5. **RLS from day one** — every user-data table gets row-level security policies at creation time
6. **Soft-delete where appropriate** — `deleted_at timestamptz` on workout_logs, training_plans, goals (tables where users might want to undo)
7. **JSONB for flexible/nested data** — workout details, race conditions, training history, achievement criteria
8. **Proper indexes** — on athlete_id, user_id, date columns, FKs used in RLS subqueries, and any column used in WHERE/ORDER BY
9. **Check constraints** — for all enum-like text fields (role, sex, session_type, completion_status, etc.)
10. **Foreign key cascades** — `on delete cascade` for child tables of athlete_profiles
11. **Unique constraints** — one athlete_profile per user_id, one athlete_achievement per athlete+achievement combo

---

## RLS Policy Strategy

| Table | Policy |
|-------|--------|
| `knowledge_chunks` | RLS disabled (already set — public read, do not change) |
| `hyrox_stations` | Public read, no write via RLS (reference data) |
| `exercise_library` | Public read, no write via RLS (reference data) |
| `achievement_definitions` | Public read, no write via RLS (reference data) |
| `athlete_profiles` | CRUD restricted to `auth.uid() = user_id` |
| `conversations` | CRUD via `athlete_id in (select id from athlete_profiles where user_id = auth.uid())` |
| `messages` | Read/insert via conversation → athlete_profiles → auth.uid() chain |
| `workout_logs` | CRUD via athlete_profiles → auth.uid() |
| `benchmark_tests` | CRUD via athlete_profiles → auth.uid() |
| `race_results` | CRUD via athlete_profiles → auth.uid() |
| `race_splits` | CRUD via race_results → athlete_profiles → auth.uid() |
| `training_plans` | CRUD via athlete_profiles → auth.uid() |
| `training_plan_weeks` | CRUD via training_plans → athlete_profiles → auth.uid() |
| `training_plan_days` | CRUD via training_plan_weeks → training_plans → athlete_profiles → auth.uid() |
| `personal_records` | CRUD via athlete_profiles → auth.uid() |
| `goals` | CRUD via athlete_profiles → auth.uid() |
| `athlete_achievements` | Read/insert via athlete_profiles → auth.uid() |

**Performance note**: Deep RLS subquery chains (training_plan_days → weeks → plans → profiles → auth) can be slow. Consider using a security definer function or materialized view for the deepest chains.

---

## Deliverables

### Deliverable 1: SQL Migration File
A single `001_complete_schema.sql` file containing (in dependency order):
1. Extension enablement (`pgvector` if not already enabled)
2. Reference tables (hyrox_stations, exercise_library, achievement_definitions)
3. Core user tables (athlete_profiles)
4. Feature tables (conversations, messages, workout_logs, benchmark_tests, race_results, race_splits, training_plans, training_plan_weeks, training_plan_days, personal_records, goals, athlete_achievements)
5. All indexes
6. The `update_updated_at()` trigger function + all trigger attachments
7. All RLS enable statements + all policy definitions
8. Comments on non-obvious design decisions

### Deliverable 2: Design Decisions Document
A separate markdown file explaining:
- Any decisions you made that deviated from the drafts above, and why
- Entity-relationship summary (which tables link to what)
- Which tables require seed data (to be handled in Phase 3)
- Any performance considerations for RLS chains
- Recommendations for future schema evolution (what might need migration later)
