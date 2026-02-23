-- ============================================
-- Hyrox AI Coach — UI Redesign Schema Additions
-- Migration: 20260221_ui_redesign_tables
-- ============================================
-- Adds tables and columns required by the new UI:
--   1. daily_metrics  — biometric tracking (HRV, RHR, sleep, readiness)
--   2. workout_sets   — set-level logging within workout sessions
--   3. workout_logs   — new aggregate columns (volume, distance, load)

-- ============================================
-- 1. Daily Metrics (Biometric Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  hrv_ms smallint,                    -- Heart Rate Variability in ms
  rhr_bpm smallint,                   -- Resting Heart Rate in bpm
  sleep_hours numeric(3,1),           -- Sleep duration (e.g. 7.5)
  stress_score smallint CHECK (stress_score IS NULL OR stress_score BETWEEN 0 AND 100),
  recovery_score smallint CHECK (recovery_score IS NULL OR recovery_score BETWEEN 0 AND 100),
  readiness_score smallint CHECK (readiness_score IS NULL OR readiness_score BETWEEN 0 AND 100),
  notes text,
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'whoop', 'garmin', 'oura', 'apple_watch')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Trigger for updated_at
CREATE TRIGGER set_daily_metrics_updated_at
  BEFORE UPDATE ON daily_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);

-- RLS
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily metrics"
  ON daily_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily metrics"
  ON daily_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily metrics"
  ON daily_metrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily metrics"
  ON daily_metrics FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================
-- 2. Workout Sets (Set-Level Logging)
-- ============================================

CREATE TABLE IF NOT EXISTS workout_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id uuid REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_name text NOT NULL,
  exercise_category text CHECK (exercise_category IN (
    'Run', 'Ski Erg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump',
    'Rowing', 'Farmers Carry', 'Sandbag Lunges', 'Wall Balls',
    'strength', 'conditioning', 'mobility', 'other'
  )),
  set_number smallint NOT NULL CHECK (set_number > 0),
  reps smallint,
  weight_kg numeric(6,2),
  distance_meters numeric(8,2),
  duration_seconds integer,
  pace text,                           -- e.g. '4:12/km'
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'skipped')),
  rpe smallint CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workout_sets_log ON workout_sets(workout_log_id);
CREATE INDEX idx_workout_sets_exercise ON workout_sets(exercise_name);

-- RLS (via parent workout_log ownership)
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout sets"
  ON workout_sets FOR SELECT
  USING (
    workout_log_id IN (
      SELECT wl.id FROM workout_logs wl
      JOIN athlete_profiles ap ON ap.id = wl.athlete_id
      WHERE ap.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workout sets"
  ON workout_sets FOR INSERT
  WITH CHECK (
    workout_log_id IN (
      SELECT wl.id FROM workout_logs wl
      JOIN athlete_profiles ap ON ap.id = wl.athlete_id
      WHERE ap.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workout sets"
  ON workout_sets FOR UPDATE
  USING (
    workout_log_id IN (
      SELECT wl.id FROM workout_logs wl
      JOIN athlete_profiles ap ON ap.id = wl.athlete_id
      WHERE ap.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workout_log_id IN (
      SELECT wl.id FROM workout_logs wl
      JOIN athlete_profiles ap ON ap.id = wl.athlete_id
      WHERE ap.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own workout sets"
  ON workout_sets FOR DELETE
  USING (
    workout_log_id IN (
      SELECT wl.id FROM workout_logs wl
      JOIN athlete_profiles ap ON ap.id = wl.athlete_id
      WHERE ap.user_id = auth.uid()
    )
  );


-- ============================================
-- 3. Workout Logs — New Aggregate Columns
-- ============================================

ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS total_volume_kg numeric(10,2),
  ADD COLUMN IF NOT EXISTS total_distance_km numeric(8,2),
  ADD COLUMN IF NOT EXISTS training_load smallint CHECK (training_load IS NULL OR training_load BETWEEN 0 AND 1000);

-- RPE alias: the UI references rpe_rating — add a computed column alias
-- (rpe_post serves as the primary RPE for the session)
COMMENT ON COLUMN workout_logs.rpe_post IS 'Primary RPE rating for the session (1-10). UI displays this as rpe_rating.';
