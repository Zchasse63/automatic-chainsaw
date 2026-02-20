-- Performance indexes for RLS policy columns
CREATE INDEX IF NOT EXISTS idx_conversations_athlete_id ON conversations(athlete_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_athlete_id ON workout_logs(athlete_id);
CREATE INDEX IF NOT EXISTS idx_training_plan_days_week_id ON training_plan_days(training_plan_week_id);
CREATE INDEX IF NOT EXISTS idx_training_plan_weeks_plan_id ON training_plan_weeks(training_plan_id);
CREATE INDEX IF NOT EXISTS idx_goals_athlete_id ON goals(athlete_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_tests_athlete_id ON benchmark_tests(athlete_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_athlete_id ON personal_records(athlete_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(athlete_id, date DESC);
