-- ============================================
-- Hyrox AI Coach — Complete Database Schema
-- Migration: 20250216000000_complete_schema
-- ============================================
-- NOTE: knowledge_chunks table, hybrid_search_chunks(), and match_chunks()
-- already exist and are NOT modified by this migration.
-- pgvector extension is already enabled.

-- ============================================
-- 1. Helper Functions
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Reference Tables
-- ============================================

-- 2a. Hyrox Stations (8 rows — seeded in 002_seed_data.sql)
CREATE TABLE hyrox_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_number int NOT NULL UNIQUE CHECK (station_number BETWEEN 1 AND 8),
  station_name text NOT NULL UNIQUE,
  exercise_type text NOT NULL,
  distance_or_reps text NOT NULL,
  weights_by_division jsonb DEFAULT '{}'::jsonb,
  description text NOT NULL,
  tips jsonb DEFAULT '[]'::jsonb,
  common_mistakes jsonb DEFAULT '[]'::jsonb,
  muscles_worked text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 2b. Exercise Library (seeded in 002_seed_data.sql)
CREATE TABLE exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('station_specific', 'running', 'strength', 'conditioning', 'recovery', 'mobility')),
  subcategory text,
  description text NOT NULL,
  muscle_groups text[] DEFAULT '{}',
  equipment_needed text[] DEFAULT '{}',
  difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  hyrox_station_id uuid REFERENCES hyrox_stations(id),
  video_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2c. Achievement Definitions (seeded in 002_seed_data.sql)
CREATE TABLE achievement_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  icon_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('getting_started', 'consistency', 'performance', 'racing')),
  criteria jsonb NOT NULL,
  tier text NOT NULL CHECK (tier IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  created_at timestamptz DEFAULT now()
);

-- 2d. Skill Level Benchmarks (seeded in 002_seed_data.sql)
CREATE TABLE skill_level_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid REFERENCES hyrox_stations(id),
  segment_type text NOT NULL CHECK (segment_type IN ('station', 'run', 'transition')),
  skill_level text NOT NULL CHECK (skill_level IN ('elite', 'advanced', 'intermediate', 'beginner')),
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  min_seconds numeric NOT NULL,
  max_seconds numeric NOT NULL,
  median_seconds numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Unique for station benchmarks (station_id NOT NULL)
CREATE UNIQUE INDEX idx_benchmarks_station_unique
  ON skill_level_benchmarks (station_id, segment_type, skill_level, gender)
  WHERE station_id IS NOT NULL;

-- Unique for run/transition benchmarks (station_id IS NULL)
CREATE UNIQUE INDEX idx_benchmarks_non_station_unique
  ON skill_level_benchmarks (segment_type, skill_level, gender)
  WHERE station_id IS NULL;

-- ============================================
-- 3. Core User Tables
-- ============================================

CREATE TABLE athlete_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  display_name text,
  date_of_birth date,
  weight_kg numeric,
  height_cm numeric,
  sex text CHECK (sex IN ('male', 'female', 'other')),
  hyrox_division text CHECK (hyrox_division IN ('open', 'pro', 'doubles', 'relay')),
  hyrox_race_count int DEFAULT 0,
  training_history jsonb,
  current_phase text CHECK (current_phase IN ('general_prep', 'specific_prep', 'competition_prep', 'taper', 'off_season')),
  race_date date,
  goal_time_minutes numeric,
  weekly_availability_hours numeric,
  equipment_available text[] DEFAULT '{}',
  injuries_limitations text[] DEFAULT '{}',
  preferences jsonb DEFAULT '{}'::jsonb,
  units_preference text DEFAULT 'metric' CHECK (units_preference IN ('metric', 'imperial')),
  avatar_url text,
  profile_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Security definer function for efficient RLS on deep table chains
-- Avoids repeated subqueries: training_plan_days → weeks → plans → profiles → auth
-- Must be created AFTER athlete_profiles table exists (SQL language validates at creation)
CREATE OR REPLACE FUNCTION get_athlete_id_for_user()
RETURNS uuid AS $$
  SELECT id FROM athlete_profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 4. Feature Tables
-- ============================================

-- 4a. Conversations & Messages
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athlete_profiles(id) ON DELETE CASCADE NOT NULL,
  title text,
  started_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  rag_chunks_used text[],
  tokens_in int,
  tokens_out int,
  latency_ms int,
  feedback text CHECK (feedback IN ('thumbs_up', 'thumbs_down')),
  pinned boolean DEFAULT false,
  suggested_actions jsonb,
  created_at timestamptz DEFAULT now()
);

-- 4b. Workout Logs
CREATE TABLE workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athlete_profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  session_type text CHECK (session_type IN ('run', 'hiit', 'strength', 'simulation', 'recovery', 'station_practice', 'other')),
  prescribed_workout jsonb,
  completed_workout jsonb,
  rpe_pre int CHECK (rpe_pre BETWEEN 1 AND 10),
  rpe_post int CHECK (rpe_post BETWEEN 1 AND 10),
  duration_minutes int,
  completion_status text DEFAULT 'completed' CHECK (completion_status IN ('completed', 'partial', 'skipped')),
  heart_rate_avg int,
  calories_estimated int,
  training_plan_day_id uuid,
  conversation_id uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- 4c. Benchmark Tests
CREATE TABLE benchmark_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athlete_profiles(id) ON DELETE CASCADE NOT NULL,
  test_date date NOT NULL,
  test_type text NOT NULL,
  station_id uuid REFERENCES hyrox_stations(id),
  results jsonb NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 4d. Race Results & Splits
CREATE TABLE race_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athlete_profiles(id) ON DELETE CASCADE NOT NULL,
  race_date date NOT NULL,
  race_name text,
  location text,
  division text CHECK (division IN ('open', 'pro', 'age_group')),
  format text CHECK (format IN ('singles', 'doubles', 'relay')),
  total_time_seconds numeric NOT NULL,
  is_simulation boolean DEFAULT false,
  conditions text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE race_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_result_id uuid REFERENCES race_results(id) ON DELETE CASCADE NOT NULL,
  split_number int NOT NULL CHECK (split_number BETWEEN 1 AND 16),
  split_type text NOT NULL CHECK (split_type IN ('run', 'station')),
  station_id uuid REFERENCES hyrox_stations(id),
  time_seconds numeric NOT NULL,
  transition_time_seconds numeric,
  heart_rate_avg int,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (race_result_id, split_number)
);

-- 4e. Training Plans
CREATE TABLE training_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athlete_profiles(id) ON DELETE CASCADE NOT NULL,
  plan_name text NOT NULL,
  duration_weeks int NOT NULL,
  goal text,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'custom')),
  is_ai_generated boolean DEFAULT false,
  status text DEFAULT 'draft' CHECK (status IN ('active', 'archived', 'draft')),
  start_date date,
  end_date date,
  source_conversation_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE training_plan_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_plan_id uuid REFERENCES training_plans(id) ON DELETE CASCADE NOT NULL,
  week_number int NOT NULL,
  focus text,
  target_volume_hours numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (training_plan_id, week_number)
);

CREATE TABLE training_plan_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_plan_week_id uuid REFERENCES training_plan_weeks(id) ON DELETE CASCADE NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  workout_title text,
  workout_description text,
  workout_details jsonb,
  session_type text CHECK (session_type IN ('run', 'hiit', 'strength', 'simulation', 'recovery', 'rest')),
  estimated_duration_minutes int,
  is_rest_day boolean DEFAULT false,
  is_completed boolean DEFAULT false,
  linked_workout_log_id uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Deferred FKs (circular references between workout_logs and training_plan_days)
ALTER TABLE workout_logs
  ADD CONSTRAINT fk_workout_logs_training_plan_day
  FOREIGN KEY (training_plan_day_id) REFERENCES training_plan_days(id);

ALTER TABLE workout_logs
  ADD CONSTRAINT fk_workout_logs_conversation
  FOREIGN KEY (conversation_id) REFERENCES conversations(id);

ALTER TABLE training_plan_days
  ADD CONSTRAINT fk_training_plan_days_workout_log
  FOREIGN KEY (linked_workout_log_id) REFERENCES workout_logs(id);

ALTER TABLE training_plans
  ADD CONSTRAINT fk_training_plans_conversation
  FOREIGN KEY (source_conversation_id) REFERENCES conversations(id);

-- 4f. Personal Records
CREATE TABLE personal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athlete_profiles(id) ON DELETE CASCADE NOT NULL,
  record_type text NOT NULL CHECK (record_type IN ('station_time', 'exercise_weight', 'exercise_reps', 'running_pace', 'race_time')),
  exercise_name text,
  exercise_id uuid REFERENCES exercise_library(id),
  station_id uuid REFERENCES hyrox_stations(id),
  value numeric NOT NULL,
  value_unit text NOT NULL CHECK (value_unit IN ('seconds', 'kg', 'lbs', 'min_per_km', 'reps')),
  date_achieved date NOT NULL,
  context text CHECK (context IN ('training', 'race', 'benchmark')),
  previous_value numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 4g. Goals
CREATE TABLE goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athlete_profiles(id) ON DELETE CASCADE NOT NULL,
  goal_type text NOT NULL CHECK (goal_type IN ('race_time', 'station_time', 'running_pace', 'body_comp', 'consistency', 'training_volume', 'custom')),
  title text NOT NULL,
  description text,
  target_value numeric,
  target_unit text,
  current_value numeric,
  target_date date,
  station_id uuid REFERENCES hyrox_stations(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- 4h. Athlete Achievements
CREATE TABLE athlete_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athlete_profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievement_definitions(id) NOT NULL,
  earned_at timestamptz DEFAULT now(),
  context jsonb,
  UNIQUE (athlete_id, achievement_id)
);

-- ============================================
-- 5. Indexes
-- ============================================

-- Athlete profiles
CREATE INDEX idx_athlete_profiles_user_id ON athlete_profiles(user_id);

-- Conversations
CREATE INDEX idx_conversations_athlete_id ON conversations(athlete_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- Messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Workout logs
CREATE INDEX idx_workout_logs_athlete_id ON workout_logs(athlete_id);
CREATE INDEX idx_workout_logs_date ON workout_logs(date DESC);
CREATE INDEX idx_workout_logs_athlete_date ON workout_logs(athlete_id, date DESC);
CREATE INDEX idx_workout_logs_not_deleted ON workout_logs(athlete_id) WHERE deleted_at IS NULL;

-- Benchmark tests
CREATE INDEX idx_benchmark_tests_athlete_id ON benchmark_tests(athlete_id);
CREATE INDEX idx_benchmark_tests_date ON benchmark_tests(test_date DESC);

-- Race results
CREATE INDEX idx_race_results_athlete_id ON race_results(athlete_id);
CREATE INDEX idx_race_results_date ON race_results(race_date DESC);

-- Race splits
CREATE INDEX idx_race_splits_race_result_id ON race_splits(race_result_id);

-- Training plans
CREATE INDEX idx_training_plans_athlete_id ON training_plans(athlete_id);
CREATE INDEX idx_training_plans_active ON training_plans(athlete_id, status) WHERE deleted_at IS NULL;

-- Training plan weeks
CREATE INDEX idx_training_plan_weeks_plan_id ON training_plan_weeks(training_plan_id);

-- Training plan days
CREATE INDEX idx_training_plan_days_week_id ON training_plan_days(training_plan_week_id);

-- Personal records
CREATE INDEX idx_personal_records_athlete_id ON personal_records(athlete_id);
CREATE INDEX idx_personal_records_type ON personal_records(athlete_id, record_type);
CREATE INDEX idx_personal_records_station ON personal_records(station_id) WHERE station_id IS NOT NULL;

-- Goals
CREATE INDEX idx_goals_athlete_id ON goals(athlete_id);
CREATE INDEX idx_goals_active ON goals(athlete_id, status) WHERE deleted_at IS NULL;

-- Athlete achievements
CREATE INDEX idx_athlete_achievements_athlete_id ON athlete_achievements(athlete_id);

-- Exercise library
CREATE INDEX idx_exercise_library_category ON exercise_library(category);
CREATE INDEX idx_exercise_library_station ON exercise_library(hyrox_station_id) WHERE hyrox_station_id IS NOT NULL;

-- Skill level benchmarks
CREATE INDEX idx_benchmarks_station ON skill_level_benchmarks(station_id);
CREATE INDEX idx_benchmarks_lookup ON skill_level_benchmarks(skill_level, gender);

-- ============================================
-- 6. Triggers (auto-update updated_at)
-- ============================================

CREATE TRIGGER set_updated_at_athlete_profiles
  BEFORE UPDATE ON athlete_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_conversations
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_workout_logs
  BEFORE UPDATE ON workout_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_race_results
  BEFORE UPDATE ON race_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_training_plans
  BEFORE UPDATE ON training_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_goals
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 7. Row Level Security
-- ============================================

-- Reference tables: public read, no write via client
ALTER TABLE hyrox_stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON hyrox_stations FOR SELECT USING (true);

ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON exercise_library FOR SELECT USING (true);

ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON achievement_definitions FOR SELECT USING (true);

ALTER TABLE skill_level_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON skill_level_benchmarks FOR SELECT USING (true);

-- Athlete profiles: CRUD restricted to own user_id
ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON athlete_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own profile" ON athlete_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON athlete_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON athlete_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Conversations: via athlete_id → get_athlete_id_for_user()
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can create own conversations" ON conversations
  FOR INSERT WITH CHECK (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (athlete_id = get_athlete_id_for_user());

-- Messages: via conversation ownership
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (conversation_id IN (
    SELECT id FROM conversations WHERE athlete_id = get_athlete_id_for_user()
  ));
CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (conversation_id IN (
    SELECT id FROM conversations WHERE athlete_id = get_athlete_id_for_user()
  ));

-- Workout logs
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own workouts" ON workout_logs
  FOR SELECT USING (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can log workouts" ON workout_logs
  FOR INSERT WITH CHECK (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can update own workouts" ON workout_logs
  FOR UPDATE USING (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can delete own workouts" ON workout_logs
  FOR DELETE USING (athlete_id = get_athlete_id_for_user());

-- Benchmark tests
ALTER TABLE benchmark_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own benchmarks" ON benchmark_tests
  FOR SELECT USING (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can log benchmarks" ON benchmark_tests
  FOR INSERT WITH CHECK (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can update own benchmarks" ON benchmark_tests
  FOR UPDATE USING (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can delete own benchmarks" ON benchmark_tests
  FOR DELETE USING (athlete_id = get_athlete_id_for_user());

-- Race results
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own races" ON race_results
  FOR SELECT USING (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can log races" ON race_results
  FOR INSERT WITH CHECK (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can update own races" ON race_results
  FOR UPDATE USING (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can delete own races" ON race_results
  FOR DELETE USING (athlete_id = get_athlete_id_for_user());

-- Race splits: via race_results ownership
ALTER TABLE race_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own splits" ON race_splits
  FOR SELECT USING (race_result_id IN (
    SELECT id FROM race_results WHERE athlete_id = get_athlete_id_for_user()
  ));
CREATE POLICY "Users can insert own splits" ON race_splits
  FOR INSERT WITH CHECK (race_result_id IN (
    SELECT id FROM race_results WHERE athlete_id = get_athlete_id_for_user()
  ));
CREATE POLICY "Users can update own splits" ON race_splits
  FOR UPDATE USING (race_result_id IN (
    SELECT id FROM race_results WHERE athlete_id = get_athlete_id_for_user()
  ));
CREATE POLICY "Users can delete own splits" ON race_splits
  FOR DELETE USING (race_result_id IN (
    SELECT id FROM race_results WHERE athlete_id = get_athlete_id_for_user()
  ));

-- Training plans
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own plans" ON training_plans
  FOR SELECT USING (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can create plans" ON training_plans
  FOR INSERT WITH CHECK (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can update own plans" ON training_plans
  FOR UPDATE USING (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can delete own plans" ON training_plans
  FOR DELETE USING (athlete_id = get_athlete_id_for_user());

-- Training plan weeks: via training_plans ownership
ALTER TABLE training_plan_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own plan weeks" ON training_plan_weeks
  FOR SELECT USING (training_plan_id IN (
    SELECT id FROM training_plans WHERE athlete_id = get_athlete_id_for_user()
  ));
CREATE POLICY "Users can insert own plan weeks" ON training_plan_weeks
  FOR INSERT WITH CHECK (training_plan_id IN (
    SELECT id FROM training_plans WHERE athlete_id = get_athlete_id_for_user()
  ));
CREATE POLICY "Users can update own plan weeks" ON training_plan_weeks
  FOR UPDATE USING (training_plan_id IN (
    SELECT id FROM training_plans WHERE athlete_id = get_athlete_id_for_user()
  ));
CREATE POLICY "Users can delete own plan weeks" ON training_plan_weeks
  FOR DELETE USING (training_plan_id IN (
    SELECT id FROM training_plans WHERE athlete_id = get_athlete_id_for_user()
  ));

-- Training plan days: via weeks → plans chain (uses get_athlete_id_for_user for perf)
ALTER TABLE training_plan_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own plan days" ON training_plan_days
  FOR SELECT USING (training_plan_week_id IN (
    SELECT tpw.id FROM training_plan_weeks tpw
    JOIN training_plans tp ON tp.id = tpw.training_plan_id
    WHERE tp.athlete_id = get_athlete_id_for_user()
  ));
CREATE POLICY "Users can insert own plan days" ON training_plan_days
  FOR INSERT WITH CHECK (training_plan_week_id IN (
    SELECT tpw.id FROM training_plan_weeks tpw
    JOIN training_plans tp ON tp.id = tpw.training_plan_id
    WHERE tp.athlete_id = get_athlete_id_for_user()
  ));
CREATE POLICY "Users can update own plan days" ON training_plan_days
  FOR UPDATE USING (training_plan_week_id IN (
    SELECT tpw.id FROM training_plan_weeks tpw
    JOIN training_plans tp ON tp.id = tpw.training_plan_id
    WHERE tp.athlete_id = get_athlete_id_for_user()
  ));
CREATE POLICY "Users can delete own plan days" ON training_plan_days
  FOR DELETE USING (training_plan_week_id IN (
    SELECT tpw.id FROM training_plan_weeks tpw
    JOIN training_plans tp ON tp.id = tpw.training_plan_id
    WHERE tp.athlete_id = get_athlete_id_for_user()
  ));

-- Personal records
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own PRs" ON personal_records
  FOR SELECT USING (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can insert own PRs" ON personal_records
  FOR INSERT WITH CHECK (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can update own PRs" ON personal_records
  FOR UPDATE USING (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can delete own PRs" ON personal_records
  FOR DELETE USING (athlete_id = get_athlete_id_for_user());

-- Goals
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can create goals" ON goals
  FOR INSERT WITH CHECK (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (athlete_id = get_athlete_id_for_user());

-- Athlete achievements
ALTER TABLE athlete_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON athlete_achievements
  FOR SELECT USING (athlete_id = get_athlete_id_for_user());
CREATE POLICY "Users can earn achievements" ON athlete_achievements
  FOR INSERT WITH CHECK (athlete_id = get_athlete_id_for_user());
