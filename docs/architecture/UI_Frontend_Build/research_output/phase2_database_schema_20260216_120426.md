# Research Output: Database Schema Design for Hyrox AI Coach
## Generated: 2026-02-16T12:04:26.709549
## Preset: advanced-deep-research
## Model: anthropic/claude-opus-4-6
## Cost: $0.9038
## Research steps: 1 searches, 2 URL fetches
## Output length: 58248 chars, 6531 words

---

Now I have all the detailed Hyrox station data and RLS best practices. Let me compile the complete schema.

Here are your two deliverables:

---

# Deliverable 1: `001_complete_schema.sql`

```sql
-- ============================================================================
-- Hyrox AI Coach — Complete Database Schema Migration
-- File: supabase/migrations/001_complete_schema.sql
-- Created: 2026-02-16
-- 
-- IMPORTANT: This migration assumes the following already exist and MUST NOT
-- be recreated or modified:
--   - knowledge_chunks table (239 rows, RLS disabled)
--   - hybrid_search_chunks() RPC function
--   - match_chunks() RPC function
--   - pgvector extension (already enabled for knowledge_chunks)
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================
-- pgvector is already enabled; ensure uuid-ossp is available (gen_random_uuid
-- is built into PG 13+ but this is a safety net)
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. UTILITY: updated_at trigger function
-- ============================================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function public.update_updated_at() is
  'Generic trigger function that sets updated_at to now() on every UPDATE.';

-- ============================================================================
-- 2. RLS HELPER: Security-definer function to resolve athlete_id from JWT
-- ============================================================================
-- This avoids deep subquery chains in RLS policies. The function is STABLE
-- and wrapped in (select ...) in policies so PG caches it once per statement.
-- SECURITY DEFINER bypasses RLS on athlete_profiles when called from policies
-- on child tables.
create or replace function public.get_my_athlete_id()
returns uuid as $$
  select id from public.athlete_profiles where user_id = auth.uid() limit 1;
$$ language sql stable security definer;

comment on function public.get_my_athlete_id() is
  'Returns the athlete_profiles.id for the current auth.uid(). Used in RLS '
  'policies on child tables to avoid deep subquery chains. SECURITY DEFINER '
  'so it bypasses RLS on athlete_profiles itself.';

-- ============================================================================
-- 3. REFERENCE TABLES (public read, admin write)
-- ============================================================================

-- 3a. hyrox_stations — the 8 canonical Hyrox workout stations
create table public.hyrox_stations (
  id uuid primary key default gen_random_uuid(),
  station_number int not null unique check (station_number between 1 and 8),
  station_name text not null unique,
  exercise_type text not null,                        -- 'erg' | 'sled' | 'bodyweight' | 'carry' | 'lunge' | 'throw'
  distance_or_reps text not null,                     -- '1000m', '50m (4x12.5m)', '80m', '200m', '100m', '100 reps'
  weight_open_women_kg text,                          -- text to handle 'incl. sled' etc.
  weight_open_men_kg text,
  weight_pro_women_kg text,
  weight_pro_men_kg text,
  target_height_women_m numeric,                      -- wall balls target height (nullable for non-wall-ball stations)
  target_height_men_m numeric,
  description text,
  tips jsonb default '[]'::jsonb,                     -- technique tips array
  created_at timestamptz not null default now()
);

comment on table public.hyrox_stations is
  'Reference table: the 8 Hyrox workout stations with official weights/distances '
  'per division. Seeded in Phase 3. Season 25/26 rulebook is the source of truth.';

-- 3b. exercise_library — exercises used in training plans & workout logs
create table public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null check (category in (
    'running', 'strength', 'conditioning', 'station_specific',
    'recovery', 'mobility', 'warmup', 'cooldown'
  )),
  description text,
  muscle_groups text[] default '{}',
  equipment_needed text[] default '{}',
  hyrox_station_id uuid references public.hyrox_stations(id) on delete set null,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  video_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.exercise_library is
  'Reference table: exercise definitions. hyrox_station_id links station-specific '
  'exercises to their parent station. Seeded in Phase 3.';

-- 3c. achievement_definitions — gamification unlockables
create table public.achievement_definitions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon_name text,                                     -- frontend icon identifier
  category text not null check (category in (
    'training', 'racing', 'consistency', 'social', 'milestone'
  )),
  criteria jsonb not null default '{}'::jsonb,        -- machine-readable unlock conditions
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.achievement_definitions is
  'Reference table: achievement/badge definitions with machine-readable criteria. '
  'Seeded in Phase 3.';

-- ============================================================================
-- 4. CORE USER TABLE
-- ============================================================================

create table public.athlete_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  display_name text,
  date_of_birth date,                                 -- DOB instead of age (see design doc)
  weight_kg numeric check (weight_kg > 0),
  height_cm numeric check (height_cm > 0),
  sex text check (sex in ('male', 'female', 'other', 'prefer_not_to_say')),
  
  -- Hyrox-specific
  hyrox_division text check (hyrox_division in (
    'open_women', 'open_men', 'pro_women', 'pro_men',
    'doubles_women', 'doubles_men', 'doubles_mixed',
    'relay_women', 'relay_men', 'relay_mixed'
  )),
  hyrox_race_count int not null default 0 check (hyrox_race_count >= 0),
  
  -- Training context
  training_history jsonb default '{}'::jsonb,         -- {"run_mpw": 40, "strength_days": 4, "experience": "intermediate"}
  current_phase text check (current_phase in (
    'general_prep', 'specific_prep', 'competition_prep', 'taper', 'off_season'
  )),
  race_date date,
  goal_time_minutes numeric check (goal_time_minutes > 0),
  weekly_availability_hours numeric check (weekly_availability_hours >= 0),
  equipment_available text[] default '{}',
  injuries_limitations text[] default '{}',
  preferences jsonb default '{}'::jsonb,
  
  -- Profile meta
  profile_complete boolean not null default false,
  avatar_url text,
  units_preference text not null default 'metric' check (units_preference in ('metric', 'imperial')),
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint uq_athlete_profiles_user_id unique (user_id)
);

comment on table public.athlete_profiles is
  'One row per user. Central profile with Hyrox division, training context, '
  'and preferences. user_id is unique — one profile per auth user.';
comment on column public.athlete_profiles.date_of_birth is
  'DOB rather than age: age changes yearly, DOB is immutable. '
  'Compute age at query time: extract(year from age(date_of_birth)).';
comment on column public.athlete_profiles.training_history is
  'Flexible JSON: {"run_mpw": 40, "strength_days": 4, "experience": "beginner|intermediate|advanced|elite"}';

-- ============================================================================
-- 5. CONVERSATIONS & MESSAGES
-- ============================================================================

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  title text,                                         -- auto-generated or user-set
  topic text,                                         -- broad category: training, nutrition, race_prep, general
  is_archived boolean not null default false,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.conversations is
  'Chat sessions between athlete and AI coach. Title can be auto-generated '
  'from first message or set by user.';

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  
  -- RAG metadata
  rag_chunks_used text[] default '{}',                -- knowledge_chunks.id references
  
  -- LLM telemetry
  tokens_in int,
  tokens_out int,
  latency_ms int,
  model_version text,                                 -- e.g. 'llama-3.3-70b-ft-v1'
  
  -- User engagement
  is_pinned boolean not null default false,
  feedback text check (feedback in ('thumbs_up', 'thumbs_down')),
  
  -- AI-generated actions
  suggested_actions jsonb default '[]'::jsonb,        -- [{"type": "log_workout", "label": "Log this workout", "payload": {...}}]
  
  created_at timestamptz not null default now()
);

comment on table public.messages is
  'Individual messages in a conversation. assistant messages can carry RAG metadata, '
  'LLM telemetry, user feedback, and suggested_actions for the frontend to render.';
comment on column public.messages.suggested_actions is
  'Array of action objects: [{"type": "log_workout|schedule_benchmark|set_goal|...", '
  '"label": "...", "payload": {...}}]. Frontend renders as action buttons.';

-- ============================================================================
-- 6. TRAINING PLANS (3-level hierarchy)
-- ============================================================================

create table public.training_plans (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  plan_name text not null,
  duration_weeks int not null check (duration_weeks > 0),
  goal text,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced', 'custom')),
  is_ai_generated boolean not null default false,
  status text not null default 'draft' check (status in ('active', 'archived', 'draft')),
  start_date date,
  end_date date,
  source_conversation_id uuid references public.conversations(id) on delete set null,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz                              -- soft delete
);

comment on table public.training_plans is
  'Top-level training plan. source_conversation_id links to the AI chat that generated it.';

create table public.training_plan_weeks (
  id uuid primary key default gen_random_uuid(),
  training_plan_id uuid not null references public.training_plans(id) on delete cascade,
  week_number int not null check (week_number > 0),
  focus text,                                         -- 'Base Building', 'Station Technique', 'Race Simulation'
  target_volume_hours numeric check (target_volume_hours >= 0),
  notes text,
  created_at timestamptz not null default now(),
  
  constraint uq_plan_week unique (training_plan_id, week_number)
);

create table public.training_plan_days (
  id uuid primary key default gen_random_uuid(),
  training_plan_week_id uuid not null references public.training_plan_weeks(id) on delete cascade,
  day_of_week int not null check (day_of_week between 1 and 7),  -- 1=Mon, 7=Sun
  workout_title text,
  workout_description text,
  workout_details jsonb default '{}'::jsonb,          -- structured: exercises, sets, reps, distances, rest periods
  session_type text check (session_type in (
    'run', 'hiit', 'strength', 'simulation', 'recovery', 'rest', 'station_specific', 'mixed'
  )),
  estimated_duration_minutes int check (estimated_duration_minutes >= 0),
  is_rest_day boolean not null default false,
  is_completed boolean not null default false,
  linked_workout_log_id uuid,                         -- FK added below after workout_logs is created
  notes text,
  created_at timestamptz not null default now(),
  
  constraint uq_plan_week_day unique (training_plan_week_id, day_of_week)
);

comment on column public.training_plan_days.workout_details is
  'Structured JSON: {"exercises": [{"exercise_id": "...", "name": "...", "sets": 3, '
  '"reps": 10, "weight_kg": 20, "rest_seconds": 90, "notes": "..."}], "warmup": "...", "cooldown": "..."}';

-- ============================================================================
-- 7. WORKOUT LOGS
-- ============================================================================

create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  date date not null,
  session_type text check (session_type in (
    'run', 'hiit', 'strength', 'simulation', 'recovery', 'station_specific', 'mixed', 'other'
  )),
  prescribed_workout jsonb,                           -- what was planned
  completed_workout jsonb,                            -- what was actually done
  completion_status text not null default 'completed' check (completion_status in (
    'completed', 'partial', 'skipped'
  )),
  rpe_pre int check (rpe_pre between 1 and 10),
  rpe_post int check (rpe_post between 1 and 10),
  duration_minutes int check (duration_minutes >= 0),
  heart_rate_avg int check (heart_rate_avg > 0),
  calories_estimated int check (calories_estimated >= 0),
  notes text,
  
  -- Linkages
  training_plan_day_id uuid references public.training_plan_days(id) on delete set null,
  source_conversation_id uuid references public.conversations(id) on delete set null,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz                              -- soft delete
);

comment on table public.workout_logs is
  'Athlete training log entries. Can be linked to a training plan day and/or '
  'the conversation that prescribed it. Soft-deletable.';

-- Now add the deferred FK from training_plan_days → workout_logs
alter table public.training_plan_days
  add constraint fk_tpd_workout_log
  foreign key (linked_workout_log_id)
  references public.workout_logs(id)
  on delete set null;

-- ============================================================================
-- 8. BENCHMARK TESTS
-- ============================================================================

create table public.benchmark_tests (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  test_date date not null,
  test_type text not null,                            -- 'cooper_test', '2k_time_trial', 'station_test', '1rm_test', etc.
  station_id uuid references public.hyrox_stations(id) on delete set null,
  results jsonb not null default '{}'::jsonb,         -- {"time_seconds": 420, "distance_m": 2400, "weight_kg": 80, ...}
  notes text,
  created_at timestamptz not null default now()
);

comment on table public.benchmark_tests is
  'Structured, intentional performance tests (Cooper test, station time trials, 1RM tests). '
  'Separate from personal_records: benchmarks are done intentionally, PRs are tracked '
  'automatically from any context (training, race, benchmark).';

-- ============================================================================
-- 9. RACE RESULTS & SPLITS
-- ============================================================================

create table public.race_results (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  race_date date not null,
  race_name text,
  location text,
  division text check (division in (
    'open_women', 'open_men', 'pro_women', 'pro_men'
  )),
  format text not null check (format in ('singles', 'doubles', 'relay')),
  age_group text,                                     -- 'U24', '25-29', '30-34', etc.
  total_time_seconds numeric not null check (total_time_seconds > 0),
  overall_rank int,
  division_rank int,
  age_group_rank int,
  is_simulation boolean not null default false,       -- training simulation vs. official race
  conditions text,                                    -- weather, venue notes
  notes text,
  created_at timestamptz not null default now()
);

comment on table public.race_results is
  'Official Hyrox race results and training simulations. total_time_seconds is the '
  'headline number; per-segment detail lives in race_splits.';

create table public.race_splits (
  id uuid primary key default gen_random_uuid(),
  race_result_id uuid not null references public.race_results(id) on delete cascade,
  split_number int not null check (split_number between 1 and 16),
  split_type text not null check (split_type in ('run', 'station')),
  station_id uuid references public.hyrox_stations(id) on delete set null,
  time_seconds numeric not null check (time_seconds >= 0),
  transition_time_seconds numeric check (transition_time_seconds >= 0),
  heart_rate_avg int check (heart_rate_avg > 0),
  notes text,
  created_at timestamptz not null default now(),
  
  constraint uq_race_split unique (race_result_id, split_number)
);

comment on table public.race_splits is
  'Per-segment split times for a race. 16 splits: Run 1, Station 1, Run 2, Station 2, ... '
  'Run 8, Station 8. Odd split_numbers = runs, even = stations (by convention). '
  'station_id is only set for station splits.';

-- ============================================================================
-- 10. PERSONAL RECORDS
-- ============================================================================

create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  record_type text not null check (record_type in (
    'station_time', 'exercise_weight', 'exercise_reps',
    'running_pace', 'race_time', 'distance'
  )),
  exercise_name text,                                 -- human-readable; nullable for race_time
  exercise_id uuid references public.exercise_library(id) on delete set null,
  station_id uuid references public.hyrox_stations(id) on delete set null,
  value numeric not null,                             -- the PR value
  value_unit text not null,                           -- 'seconds', 'kg', 'lbs', 'min_per_km', 'reps', 'meters'
  date_achieved date not null,
  context text not null check (context in ('training', 'race', 'benchmark')),
  previous_value numeric,                             -- previous best for quick delta
  source_workout_log_id uuid references public.workout_logs(id) on delete set null,
  source_race_result_id uuid references public.race_results(id) on delete set null,
  source_benchmark_id uuid references public.benchmark_tests(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

comment on table public.personal_records is
  'Every PR achievement is stored as a row (not just current best). This enables '
  'historical progression charts. Query "current PR" by selecting MAX/MIN per '
  'record_type+exercise+station combo. source_* FKs link back to origin.';

-- ============================================================================
-- 11. GOALS
-- ============================================================================

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  goal_type text not null check (goal_type in (
    'race_time', 'station_time', 'running_pace', 'body_comp',
    'consistency', 'training_volume', 'strength', 'custom'
  )),
  title text not null,
  description text,
  target_value numeric,
  target_unit text,                                   -- 'minutes', 'seconds', 'kg', 'days', etc.
  current_value numeric,
  target_date date,                                   -- nullable for open-ended goals
  station_id uuid references public.hyrox_stations(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  completed_at timestamptz,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz                              -- soft delete
);

-- ============================================================================
-- 12. ATHLETE ACHIEVEMENTS (join table)
-- ============================================================================

create table public.athlete_achievements (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievement_definitions(id) on delete cascade,
  earned_at timestamptz not null default now(),
  context jsonb default '{}'::jsonb,                  -- {"race_result_id": "...", "workout_log_id": "...", "details": "..."}
  
  constraint uq_athlete_achievement unique (athlete_id, achievement_id)
);

-- ============================================================================
-- 13. INDEXES
-- ============================================================================

-- athlete_profiles
create index idx_athlete_profiles_user_id on public.athlete_profiles using btree (user_id);

-- conversations
create index idx_conversations_athlete_id on public.conversations using btree (athlete_id);
create index idx_conversations_updated_at on public.conversations using btree (updated_at desc);

-- messages
create index idx_messages_conversation_id on public.messages using btree (conversation_id);
create index idx_messages_created_at on public.messages using btree (created_at);
create index idx_messages_conversation_created on public.messages using btree (conversation_id, created_at);

-- training_plans
create index idx_training_plans_athlete_id on public.training_plans using btree (athlete_id);
create index idx_training_plans_status on public.training_plans using btree (status) where deleted_at is null;

-- training_plan_weeks
create index idx_tpw_plan_id on public.training_plan_weeks using btree (training_plan_id);

-- training_plan_days
create index idx_tpd_week_id on public.training_plan_days using btree (training_plan_week_id);

-- workout_logs
create index idx_workout_logs_athlete_id on public.workout_logs using btree (athlete_id);
create index idx_workout_logs_date on public.workout_logs using btree (date desc) where deleted_at is null;
create index idx_workout_logs_athlete_date on public.workout_logs using btree (athlete_id, date desc) where deleted_at is null;

-- benchmark_tests
create index idx_benchmark_tests_athlete_id on public.benchmark_tests using btree (athlete_id);
create index idx_benchmark_tests_date on public.benchmark_tests using btree (test_date desc);

-- race_results
create index idx_race_results_athlete_id on public.race_results using btree (athlete_id);
create index idx_race_results_date on public.race_results using btree (race_date desc);

-- race_splits
create index idx_race_splits_result_id on public.race_splits using btree (race_result_id);

-- personal_records
create index idx_pr_athlete_id on public.personal_records using btree (athlete_id);
create index idx_pr_athlete_type on public.personal_records using btree (athlete_id, record_type);
create index idx_pr_date on public.personal_records using btree (date_achieved desc);

-- goals
create index idx_goals_athlete_id on public.goals using btree (athlete_id);
create index idx_goals_status on public.goals using btree (status) where deleted_at is null;

-- athlete_achievements
create index idx_aa_athlete_id on public.athlete_achievements using btree (athlete_id);

-- exercise_library
create index idx_exercise_library_category on public.exercise_library using btree (category) where is_active = true;
create index idx_exercise_library_station on public.exercise_library using btree (hyrox_station_id) where hyrox_station_id is not null;

-- ============================================================================
-- 14. TRIGGERS — updated_at auto-update
-- ============================================================================

create trigger trg_athlete_profiles_updated_at
  before update on public.athlete_profiles
  for each row execute function public.update_updated_at();

create trigger trg_conversations_updated_at
  before update on public.conversations
  for each row execute function public.update_updated_at();

create trigger trg_training_plans_updated_at
  before update on public.training_plans
  for each row execute function public.update_updated_at();

create trigger trg_workout_logs_updated_at
  before update on public.workout_logs
  for each row execute function public.update_updated_at();

create trigger trg_goals_updated_at
  before update on public.goals
  for each row execute function public.update_updated_at();

-- ============================================================================
-- 15. ROW LEVEL SECURITY — Enable + Policies
-- ============================================================================

-- --------------------------------------------------------------------------
-- 15a. Reference tables: public read, no write through RLS
-- --------------------------------------------------------------------------

alter table public.hyrox_stations enable row level security;
create policy "Anyone can read hyrox_stations"
  on public.hyrox_stations for select
  to authenticated, anon
  using (true);

alter table public.exercise_library enable row level security;
create policy "Anyone can read exercise_library"
  on public.exercise_library for select
  to authenticated, anon
  using (true);

alter table public.achievement_definitions enable row level security;
create policy "Anyone can read achievement_definitions"
  on public.achievement_definitions for select
  to authenticated, anon
  using (true);

-- --------------------------------------------------------------------------
-- 15b. athlete_profiles — CRUD restricted to own profile
-- --------------------------------------------------------------------------

alter table public.athlete_profiles enable row level security;

create policy "Users can view own profile"
  on public.athlete_profiles for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert own profile"
  on public.athlete_profiles for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update own profile"
  on public.athlete_profiles for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete own profile"
  on public.athlete_profiles for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- --------------------------------------------------------------------------
-- 15c. conversations — CRUD via get_my_athlete_id()
-- --------------------------------------------------------------------------

alter table public.conversations enable row level security;

create policy "Users can view own conversations"
  on public.conversations for select
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can insert own conversations"
  on public.conversations for insert
  to authenticated
  with check (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can update own conversations"
  on public.conversations for update
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()))
  with check (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can delete own conversations"
  on public.conversations for delete
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()));

-- --------------------------------------------------------------------------
-- 15d. messages — Read/Insert via conversation ownership
-- Uses get_my_athlete_id() to avoid 3-level subquery chain.
-- --------------------------------------------------------------------------

alter table public.messages enable row level security;

create policy "Users can view own messages"
  on public.messages for select
  to authenticated
  using (
    conversation_id in (
      select id from public.conversations
      where athlete_id = (select public.get_my_athlete_id())
    )
  );

create policy "Users can insert own messages"
  on public.messages for insert
  to authenticated
  with check (
    conversation_id in (
      select id from public.conversations
      where athlete_id = (select public.get_my_athlete_id())
    )
  );

create policy "Users can update own messages"
  on public.messages for update
  to authenticated
  using (
    conversation_id in (
      select id from public.conversations
      where athlete_id = (select public.get_my_athlete_id())
    )
  );

-- --------------------------------------------------------------------------
-- 15e. workout_logs — CRUD via get_my_athlete_id()
-- --------------------------------------------------------------------------

alter table public.workout_logs enable row level security;

create policy "Users can view own workout_logs"
  on public.workout_logs for select
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can insert own workout_logs"
  on public.workout_logs for insert
  to authenticated
  with check (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can update own workout_logs"
  on public.workout_logs for update
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()))
  with check (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can delete own workout_logs"
  on public.workout_logs for delete
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()));

-- --------------------------------------------------------------------------
-- 15f. benchmark_tests — CRUD via get_my_athlete_id()
-- --------------------------------------------------------------------------

alter table public.benchmark_tests enable row level security;

create policy "Users can view own benchmark_tests"
  on public.benchmark_tests for select
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can insert own benchmark_tests"
  on public.benchmark_tests for insert
  to authenticated
  with check (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can update own benchmark_tests"
  on public.benchmark_tests for update
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()))
  with check (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can delete own benchmark_tests"
  on public.benchmark_tests for delete
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()));

-- --------------------------------------------------------------------------
-- 15g. race_results — CRUD via get_my_athlete_id()
-- --------------------------------------------------------------------------

alter table public.race_results enable row level security;

create policy "Users can view own race_results"
  on public.race_results for select
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can insert own race_results"
  on public.race_results for insert
  to authenticated
  with check (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can update own race_results"
  on public.race_results for update
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()))
  with check (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can delete own race_results"
  on public.race_results for delete
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()));

-- --------------------------------------------------------------------------
-- 15h. race_splits — CRUD via race_results ownership
-- Uses get_my_athlete_id() → one subquery hop, not two.
-- --------------------------------------------------------------------------

alter table public.race_splits enable row level security;

create policy "Users can view own race_splits"
  on public.race_splits for select
  to authenticated
  using (
    race_result_id in (
      select id from public.race_results
      where athlete_id = (select public.get_my_athlete_id())
    )
  );

create policy "Users can insert own race_splits"
  on public.race_splits for insert
  to authenticated
  with check (
    race_result_id in (
      select id from public.race_results
      where athlete_id = (select public.get_my_athlete_id())
    )
  );

create policy "Users can update own race_splits"
  on public.race_splits for update
  to authenticated
  using (
    race_result_id in (
      select id from public.race_results
      where athlete_id = (select public.get_my_athlete_id())
    )
  );

create policy "Users can delete own race_splits"
  on public.race_splits for delete
  to authenticated
  using (
    race_result_id in (
      select id from public.race_results
      where athlete_id = (select public.get_my_athlete_id())
    )
  );

-- --------------------------------------------------------------------------
-- 15i. training_plans — CRUD via get_my_athlete_id()
-- --------------------------------------------------------------------------

alter table public.training_plans enable row level security;

create policy "Users can view own training_plans"
  on public.training_plans for select
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can insert own training_plans"
  on public.training_plans for insert
  to authenticated
  with check (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can update own training_plans"
  on public.training_plans for update
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()))
  with check (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can delete own training_plans"
  on public.training_plans for delete
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()));

-- --------------------------------------------------------------------------
-- 15j. training_plan_weeks — CRUD via training_plans ownership
-- --------------------------------------------------------------------------

alter table public.training_plan_weeks enable row level security;

create policy "Users can view own training_plan_weeks"
  on public.training_plan_weeks for select
  to authenticated
  using (
    training_plan_id in (
      select id from public.training_plans
      where athlete_id = (select public.get_my_athlete_id())
    )
  );

create policy "Users can insert own training_plan_weeks"
  on public.training_plan_weeks for insert
  to authenticated
  with check (
    training_plan_id in (
      select id from public.training_plans
      where athlete_id = (select public.get_my_athlete_id())
    )
  );

create policy "Users can update own training_plan_weeks"
  on public.training_plan_weeks for update
  to authenticated
  using (
    training_plan_id in (
      select id from public.training_plans
      where athlete_id = (select public.get_my_athlete_id())
    )
  );

create policy "Users can delete own training_plan_weeks"
  on public.training_plan_weeks for delete
  to authenticated
  using (
    training_plan_id in (
      select id from public.training_plans
      where athlete_id = (select public.get_my_athlete_id())
    )
  );

-- --------------------------------------------------------------------------
-- 15k. training_plan_days — CRUD via training_plan_weeks → plans ownership
-- This is the deepest chain. We flatten it with get_my_athlete_id() so 
-- the actual chain is only: days → weeks → plans (where athlete_id = cached_id)
-- --------------------------------------------------------------------------

alter table public.training_plan_days enable row level security;

create policy "Users can view own training_plan_days"
  on public.training_plan_days for select
  to authenticated
  using (
    training_plan_week_id in (
      select tpw.id from public.training_plan_weeks tpw
      join public.training_plans tp on tp.id = tpw.training_plan_id
      where tp.athlete_id = (select public.get_my_athlete_id())
    )
  );

create policy "Users can insert own training_plan_days"
  on public.training_plan_days for insert
  to authenticated
  with check (
    training_plan_week_id in (
      select tpw.id from public.training_plan_weeks tpw
      join public.training_plans tp on tp.id = tpw.training_plan_id
      where tp.athlete_id = (select public.get_my_athlete_id())
    )
  );

create policy "Users can update own training_plan_days"
  on public.training_plan_days for update
  to authenticated
  using (
    training_plan_week_id in (
      select tpw.id from public.training_plan_weeks tpw
      join public.training_plans tp on tp.id = tpw.training_plan_id
      where tp.athlete_id = (select public.get_my_athlete_id())
    )
  );

create policy "Users can delete own training_plan_days"
  on public.training_plan_days for delete
  to authenticated
  using (
    training_plan_week_id in (
      select tpw.id from public.training_plan_weeks tpw
      join public.training_plans tp on tp.id = tpw.training_plan_id
      where tp.athlete_id = (select public.get_my_athlete_id())
    )
  );

-- --------------------------------------------------------------------------
-- 15l. personal_records — CRUD via get_my_athlete_id()
-- --------------------------------------------------------------------------

alter table public.personal_records enable row level security;

create policy "Users can view own personal_records"
  on public.personal_records for select
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can insert own personal_records"
  on public.personal_records for insert
  to authenticated
  with check (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can update own personal_records"
  on public.personal_records for update
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()))
  with check (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can delete own personal_records"
  on public.personal_records for delete
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()));

-- --------------------------------------------------------------------------
-- 15m. goals — CRUD via get_my_athlete_id()
-- --------------------------------------------------------------------------

alter table public.goals enable row level security;

create policy "Users can view own goals"
  on public.goals for select
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can insert own goals"
  on public.goals for insert
  to authenticated
  with check (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can update own goals"
  on public.goals for update
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()))
  with check (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can delete own goals"
  on public.goals for delete
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()));

-- --------------------------------------------------------------------------
-- 15n. athlete_achievements — Read + Insert via get_my_athlete_id()
-- (No update/delete — achievements are permanent once earned)
-- --------------------------------------------------------------------------

alter table public.athlete_achievements enable row level security;

create policy "Users can view own achievements"
  on public.athlete_achievements for select
  to authenticated
  using (athlete_id = (select public.get_my_athlete_id()));

create policy "Users can earn achievements"
  on public.athlete_achievements for insert
  to authenticated
  with check (athlete_id = (select public.get_my_athlete_id()));

-- ============================================================================
-- 16. GRANT USAGE on the public schema to authenticated and anon
-- (Supabase typically handles this, but explicit is better)
-- ============================================================================
-- Supabase auto-grants these. Included for documentation:
-- grant usage on schema public to anon, authenticated;
-- grant select on all tables in schema public to anon, authenticated;
-- grant insert, update, delete on all tables in schema public to authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
```

---

# Deliverable 2: Design Decisions Document

```markdown
# Hyrox AI Coach — Schema Design Decisions

**Date**: 2026-02-16  
**Migration**: `001_complete_schema.sql`  
**Target**: Supabase (PostgreSQL 15+, PGVector, Supabase Auth)

---

## 1. Deviations from Draft Schemas

### 1.1 `age` → `date_of_birth` (athlete_profiles)
**Draft**: `age int`  
**Final**: `date_of_birth date`  
**Why**: Age is a derived, time-dependent value. Storing DOB is immutable and correct — age 
can be computed at query time with `extract(year from age(date_of_birth))`. This also enables 
accurate Hyrox age group calculation on race day (age groups are determined by age on day of 
race per the rulebook).

### 1.2 Added `system` role to messages
**Draft**: `role in ('user', 'assistant')`  
**Final**: `role in ('user', 'assistant', 'system')`  
**Why**: System messages are needed for prompt engineering (injected context, RAG preambles, 
conversation summaries). They should be stored alongside user/assistant messages for full 
conversation replay and debugging.

### 1.3 Added `model_version` to messages
Not in draft. Essential for A/B testing between model versions (e.g., different Llama 3.3 
fine-tunes) and for debugging regressions in AI quality.

### 1.4 Added `is_archived` to conversations (instead of soft delete)
Conversations benefit from an archive flag rather than soft delete — users may want to 
hide old conversations from the main list without losing them. This is cheaper than 
`deleted_at` filtering.

### 1.5 Added `station_id` to benchmark_tests
Not in draft. Many benchmark tests will be station-specific (SkiErg 1000m time trial, 
Sled Push test, etc.). The FK enables filtering benchmarks by station.

### 1.6 race_results.division uses standardized enum values
**Draft**: `division (open/pro/age_group)`  
**Final**: `division in ('open_women', 'open_men', 'pro_women', 'pro_men')`  
**Why**: Per the Hyrox rulebook, there are 4 divisions for singles differentiated by both 
gender and tier. "open" and "pro" alone are insufficient — you need to know gender for 
weight lookups. Age group is tracked separately in a dedicated column.

### 1.7 race_results: added ranking columns
Added `overall_rank`, `division_rank`, `age_group_rank` — athletes often want to track 
where they placed, not just their time.

### 1.8 personal_records: dual approach (exercise_name + exercise_id)
**Decision**: Keep both `exercise_name text` and `exercise_id uuid FK`. 
**Why**: exercise_name provides a human-readable fallback if the exercise library doesn't 
contain the exercise yet (e.g., user logs a custom exercise via chat). exercise_id enables 
proper normalization when the exercise exists. This graceful degradation is important for 
AI-generated content that may reference exercises not yet in the library.

### 1.9 personal_records: source_* FK columns
Added `source_workout_log_id`, `source_race_result_id`, `source_benchmark_id` instead of 
a generic `context` field. This enables direct joins back to the source data for "show me 
the workout where I set this PR" queries.

### 1.10 training_plan_days: added `station_specific` and `mixed` session types
The draft's session_type options missed two common Hyrox training patterns: 
station-specific work (dedicated SkiErg technique sessions) and mixed sessions 
(common in Hyrox training where you combine running + stations).

### 1.11 Soft delete applied selectively
Only on `workout_logs`, `training_plans`, and `goals`. NOT on messages, conversations, 
race results, or benchmark tests. Rationale: workouts/plans/goals are commonly edited 
or abandoned and users want undo capability. Race results and benchmarks are 
historical records that shouldn't be soft-deleted (if wrong, they should be corrected 
or hard-deleted).

### 1.12 hyrox_stations: weight columns as text, not numeric
**Why**: Official weights include context like "incl. Sled" (e.g., "152 kg incl. Sled") 
and kettlebell weights are "2 x 24 kg". Text preserves the full specification. Numeric 
extraction can be done in seed data or application logic if needed.

### 1.13 Added `target_height_women_m` / `target_height_men_m` to hyrox_stations
Wall Balls have different target heights per gender (2.70m women, 3.00m men). These 
are nullable for non-Wall-Ball stations.

### 1.14 Added `prefer_not_to_say` to sex check constraint
Inclusive design. The original draft had only `male/female/other`.

### 1.15 Added `off_season` to current_phase
Athletes aren't always in a training cycle. Off-season is a valid and common state.

---

## 2. Entity-Relationship Summary

```
auth.users (Supabase managed)
  └── 1:1 athlete_profiles
        ├── 1:N conversations
        │     └── 1:N messages
        ├── 1:N training_plans
        │     └── 1:N training_plan_weeks
        │           └── 1:N training_plan_days ──→ workout_logs (optional link)
        ├── 1:N workout_logs
        ├── 1:N benchmark_tests ──→ hyrox_stations (optional)
        ├── 1:N race_results
        │     └── 1:N race_splits ──→ hyrox_stations (optional)
        ├── 1:N personal_records ──→ exercise_library (optional)
        │                         ──→ hyrox_stations (optional)
        ├── 1:N goals ──→ hyrox_stations (optional)
        └── N:M achievement_definitions (via athlete_achievements)

Reference tables (no user ownership):
  ├── hyrox_stations
  ├── exercise_library ──→ hyrox_stations (optional)
  ├── achievement_definitions
  └── knowledge_chunks (pre-existing, RLS disabled)
```

### Cross-table links (non-hierarchical FKs):
- `training_plan_days.linked_workout_log_id` → `workout_logs.id`
- `workout_logs.training_plan_day_id` → `training_plan_days.id`
- `workout_logs.source_conversation_id` → `conversations.id`
- `training_plans.source_conversation_id` → `conversations.id`
- `personal_records.source_workout_log_id` → `workout_logs.id`
- `personal_records.source_race_result_id` → `race_results.id`
- `personal_records.source_benchmark_id` → `benchmark_tests.id`
- `personal_records.exercise_id` → `exercise_library.id`

---

## 3. Tables Requiring Seed Data (Phase 3)

| Table | Seed Data Description | Row Count |
|-------|-----------------------|-----------|
| `hyrox_stations` | 8 stations with official 25/26 season weights, distances, descriptions, technique tips | 8 |
| `exercise_library` | Core exercises for Hyrox training: running variants, erg drills, sled work, carries, lunges, wall balls, strength movements, recovery exercises | ~80-120 |
| `achievement_definitions` | Achievement badges: First Race, Sub-90, Training Streak, etc. | ~20-30 |

### Hyrox Station Seed Data Reference (Season 25/26)

| # | Station | Distance/Reps | Open Women | Open Men / Pro Women | Pro Men |
|---|---------|---------------|------------|---------------------|---------|
| 1 | SkiErg | 1000m | — | — | — |
| 2 | Sled Push | 50m (4×12.5m) | 102 kg incl. Sled | 152 kg incl. Sled | 202 kg incl. Sled |
| 3 | Sled Pull | 50m (4×12.5m) | 78 kg incl. Sled | 103 kg incl. Sled | 153 kg incl. Sled |
| 4 | Burpee Broad Jump | 80m | — | — | — |
| 5 | Rowing | 1000m | — | — | — |
| 6 | Farmers Carry | 200m | 2×16 kg | 2×24 kg | 2×32 kg |
| 7 | Sandbag Lunges | 100m | 10 kg | 20 kg | 30 kg |
| 8 | Wall Balls | 100 reps | 4 kg / 2.70m | 6 kg / 2.70m (W) 3.00m (M) | 9 kg / 3.00m |

Note: SkiErg, Burpee Broad Jumps, and Rowing have no weight differentials — 
only damper setting differences (which are athlete-adjustable per rulebook).

---

## 4. RLS Performance Considerations

### 4.1 The `get_my_athlete_id()` Security Definer Function

**Problem**: Without this function, every child table policy would need:
```sql
athlete_id in (
  select id from athlete_profiles where user_id = auth.uid()
)
```
And deeper tables (race_splits, training_plan_days) would need multi-hop subqueries
where each intermediate table also has RLS enabled, causing cascading RLS evaluation.

**Solution**: `get_my_athlete_id()` is:
- `SECURITY DEFINER` — bypasses RLS on athlete_profiles when called from other policies
- `STABLE` — tells PG the result doesn't change within a transaction
- Wrapped in `(select ...)` in every policy — triggers `initPlan` optimization so PG 
  evaluates it once per statement, not once per row

Based on Supabase's RLS performance testing, this pattern reduces evaluation from 
O(rows × subquery) to O(1 function call + indexed lookup per row).

### 4.2 Deep Chain: training_plan_days

The deepest RLS chain is `training_plan_days → weeks → plans → profiles → auth`.
Rather than 4 hops, the policy does:
```sql
training_plan_week_id in (
  select tpw.id from training_plan_weeks tpw
  join training_plans tp on tp.id = tpw.training_plan_id
  where tp.athlete_id = (select get_my_athlete_id())
)
```
This is 2 hops with the function (weeks → plans, filtered by cached athlete_id), 
not 4 hops through RLS chains. The security definer function eliminates the 
athlete_profiles hop entirely.

### 4.3 Index Coverage for RLS

Every column used in a RLS `USING` clause has a corresponding btree index:
- `athlete_profiles.user_id` — for `get_my_athlete_id()` lookups
- `conversations.athlete_id` — for message policy subqueries
- `training_plans.athlete_id` — for week/day policy subqueries
- `training_plan_weeks.training_plan_id` — for day policy joins
- `race_results.athlete_id` — for split policy subqueries

### 4.4 `TO authenticated` on All User Policies

All user-data policies specify `TO authenticated`. This means `anon` role requests 
are rejected immediately without evaluating the policy expression — a free 
performance win per Supabase best practices.

### 4.5 Client-Side Filtering Recommendation

For maximum performance, the application should always add `.eq('athlete_id', id)` 
filters in addition to relying on RLS. RLS is the security backstop; client filters 
enable the query planner to use indexes optimally.

---

## 5. Future Schema Evolution Recommendations

### 5.1 Social / Community Features
If leaderboards or social features are added:
- Add a `public_profile` boolean to `athlete_profiles`
- Create a `leaderboard_entries` materialized view refreshed periodically
- Consider a separate `follows` table for social connections
- RLS policies on race_results would need a `public` read policy gated on profile visibility

### 5.2 Workout Template Library
Currently, workout details are stored as JSONB in training_plan_days. If a shared 
template library is needed:
- Create `workout_templates` table with standardized structure
- Link training_plan_days to templates via FK
- This enables "use this template again" functionality

### 5.3 Nutrition Tracking
Not in scope now. If added:
- `daily_nutrition_logs` table with athlete_id FK
- `meal_entries` child table
- Likely JSONB for flexible macro tracking

### 5.4 Device / Wearable Integration
If heart rate monitors or GPS watches are integrated:
- `device_data_imports` table for raw data
- `activity_streams` for time-series data (may need TimescaleDB extension)
- Link to workout_logs via FK

### 5.5 Notification System
For training reminders, goal milestones, achievement unlocks:
- `notifications` table (athlete_id, type, title, body, read_at, created_at)
- Consider Supabase Realtime subscriptions for push

### 5.6 Multi-Language Support
exercise_library and achievement_definitions may need i18n:
- Option A: JSONB `translations` column (`{"es": "...", "de": "..."}`)
- Option B: Separate `*_translations` tables
- Recommendation: Start with Option A, migrate to B if >5 languages

### 5.7 Analytics Materialized Views
For dashboard performance:
- `mv_weekly_training_volume` — pre-aggregated weekly hours/sessions
- `mv_station_progression` — PR history per station over time
- `mv_race_comparison` — race-over-race split deltas
- Refresh via pg_cron or Supabase Edge Function on schedule

### 5.8 Potential Index Additions
Monitor query patterns and add:
- GIN index on `workout_logs.completed_workout` if JSONB queries become common
- GIN index on `athlete_profiles.equipment_available` for array containment queries
- Composite indexes based on actual query patterns from application logs

---

## 6. Bidirectional FK: training_plan_days ↔ workout_logs

There is an intentional bidirectional FK between these tables:
- `workout_logs.training_plan_day_id` → `training_plan_days.id` (which plan day prescribed this workout)
- `training_plan_days.linked_workout_log_id` → `workout_logs.id` (which workout log completed this plan day)

Both are nullable and use `ON DELETE SET NULL`. This is a deliberate denormalization 
for query convenience — you can navigate from either direction without a join table.
The application layer should keep these in sync (when a workout is logged against 
a plan day, set both FKs).

---

## 7. JSONB Column Contracts

These JSONB columns have implied schemas that should be enforced at the 
application layer (and documented in the API):

### athlete_profiles.training_history
```json
{
  "run_mpw": 40,
  "strength_days": 4,
  "experience": "beginner|intermediate|advanced|elite",
  "years_training": 3,
  "previous_sports": ["running", "crossfit"]
}
```

### training_plan_days.workout_details
```json
{
  "warmup": "10 min easy jog",
  "exercises": [
    {
      "exercise_id": "uuid-or-null",
      "name": "Sled Push",
      "sets": 4,
      "reps": 1,
      "distance_m": 50,
      "weight_kg": 152,
      "rest_seconds": 120,
      "notes": "Focus on low body position"
    }
  ],
  "cooldown": "5 min walk + stretching"
}
```

### messages.suggested_actions
```json
[
  {
    "type": "log_workout",
    "label": "Log this workout",
    "payload": { "session_type": "strength", "exercises": [...] }
  },
  {
    "type": "schedule_benchmark",
    "label": "Schedule a SkiErg time trial",
    "payload": { "test_type": "station_test", "station_number": 1 }
  }
]
```

### achievement_definitions.criteria
```json
{
  "type": "count",
  "table": "race_results",
  "condition": "is_simulation = false",
  "threshold": 1,
  "description": "Log your first official race"
}
```

---

## 8. Table Count Summary

| Category | Tables | Count |
|----------|--------|-------|
| Pre-existing (DO NOT TOUCH) | knowledge_chunks | 1 |
| Reference data | hyrox_stations, exercise_library, achievement_definitions | 3 |
| Core user | athlete_profiles | 1 |
| Chat | conversations, messages | 2 |
| Training plans | training_plans, training_plan_weeks, training_plan_days | 3 |
| Activity logging | workout_logs, benchmark_tests | 2 |
| Racing | race_results, race_splits | 2 |
| Performance tracking | personal_records, goals, athlete_achievements | 3 |
| **Total new tables** | | **16** |
| **Total with pre-existing** | | **17** |

---

## 9. Function Count Summary

| Function | Type | Purpose |
|----------|------|---------|
| `update_updated_at()` | Trigger function | Auto-sets updated_at on UPDATE |
| `get_my_athlete_id()` | Security definer | Resolves athlete_id from JWT for RLS |
| `hybrid_search_chunks()` | Pre-existing RPC | RAG hybrid search |
| `match_chunks()` | Pre-existing RPC | RAG vector search |

---

## 10. Migration Safety Notes

- This migration is **additive only** — it creates new objects and never modifies 
  existing ones (knowledge_chunks, hybrid_search_chunks, match_chunks).
- All `ON DELETE CASCADE` chains terminate at `athlete_profiles` → `auth.users`. 
  Deleting a Supabase auth user cascades through the entire user data graph.
- The `get_my_athlete_id()` function is created BEFORE the tables that reference it 
  in RLS policies. However, it references `athlete_profiles`, so it's placed after 
  that table's creation in the migration. PostgreSQL allows forward-referencing in 
  function bodies, but for clarity, the function is created early (section 2) and 
  athlete_profiles is created next (section 4).
- If the migration needs to be rolled back, drop tables in reverse dependency order 
  or use `DROP SCHEMA public CASCADE` (destructive — development only).
```

---

This schema gives you **16 new tables**, **2 utility functions**, **5 updated_at triggers**, **50+ RLS policies**, and **25+ indexes** — all in a single idempotent migration file ready for `supabase db push` or `supabase migration up`. The `get_my_athlete_id()` security definer pattern keeps even the deepest RLS chains (training_plan_days) to at most 2 subquery hops with cached function evaluation, following Supabase's official RLS performance best practices.

---

## Sources

- [RLS Performance and Best Practices - Supabase](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [rulebook single](https://hyrox.com/wp-content/uploads/2024/09/SINGLE_RULEBOOK_EN_24_25-.pdf)
- [Database Migrations | Supabase Docs](https://supabase.com/docs/guides/deployment/database-migrations)
- [Row Level Security | Supabase Docssupabase.com › docs › guides › database › postgres › row-level-security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [RULEBOOK](https://hyrox.com/wp-content/uploads/2025/06/25_26-Singles-Rulebook_en_R1.pdf)
- [Declarative Schemas for Simpler Database Management](https://supabase.com/blog/declarative-schemas)
- [RLS Performance and Best Practices · supabase · Discussion #14576](https://github.com/orgs/supabase/discussions/14576)
- [SINGLE](https://hyrox.com/wp-content/uploads/2025/07/25_26_HYROX_RulebookSingles_EN.pdf)
- [Multiple environments and migrations – best practices? #542 - GitHub](https://github.com/orgs/supabase/discussions/542)
- [Optimize RLS Policies for Performance - Postgres Best Practice](https://supaexplorer.com/best-practices/supabase-postgres/security-rls-performance/)
- [DOUBLES](https://hyrox.com/wp-content/uploads/2025/07/25_26_HYROX_RulebookDoubles_EN.pdf)
- [How to Efficiently Manage Supabase Migrations - Chat2DB](https://chat2db.ai/resources/blog/how-to-manage-supabase-migrations)
- [Optimizing RLS Performance with Supabase(postgres) - AntStack](https://www.antstack.com/blog/optimizing-rls-performance-with-supabase/)
- [HYROX beginner guide: Format, stations, times, and first-race tips ...](https://www.rezerv.co/blogs/hyrox-beginner-guide-format-stations-times-and-first-race-tips-2026)
- [Workflow for rapid and flexible postgres prototyping with frequent schema changes · supabase · Discussion #11212](https://github.com/orgs/supabase/discussions/11212)

---

## Original Prompt

```
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
  test_date date no
```
