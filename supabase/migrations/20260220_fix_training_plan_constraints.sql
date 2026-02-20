-- Fix training_plan_days.day_of_week CHECK constraint
-- The entire app uses 0-indexed days (0=Monday through 6=Sunday)
-- but the original schema defined BETWEEN 1 AND 7
ALTER TABLE training_plan_days
  DROP CONSTRAINT IF EXISTS training_plan_days_day_of_week_check;

ALTER TABLE training_plan_days
  ADD CONSTRAINT training_plan_days_day_of_week_check
  CHECK (day_of_week BETWEEN 0 AND 6);

-- Fix training_plan_days.session_type CHECK constraint
-- Original only allowed: run, hiit, strength, simulation, recovery, rest
-- App also uses: station_practice, general
ALTER TABLE training_plan_days
  DROP CONSTRAINT IF EXISTS training_plan_days_session_type_check;

ALTER TABLE training_plan_days
  ADD CONSTRAINT training_plan_days_session_type_check
  CHECK (session_type IN (
    'run', 'hiit', 'strength', 'simulation', 'recovery',
    'rest', 'station_practice', 'general'
  ));

-- Fix workout_logs.session_type CHECK constraint
-- Original allowed: run, hiit, strength, simulation, recovery, station_practice, other
-- App uses 'general' everywhere but DB only had 'other'
-- Keep both for backward compatibility with existing rows
ALTER TABLE workout_logs
  DROP CONSTRAINT IF EXISTS workout_logs_session_type_check;

ALTER TABLE workout_logs
  ADD CONSTRAINT workout_logs_session_type_check
  CHECK (session_type IN (
    'run', 'hiit', 'strength', 'simulation', 'recovery',
    'station_practice', 'general', 'other'
  ));
