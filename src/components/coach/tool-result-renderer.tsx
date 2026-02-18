'use client';

import {
  CheckCircle2,
  Calendar,
  Dumbbell,
  Target,
  TrendingUp,
  Timer,
  Trophy,
  ClipboardList,
} from 'lucide-react';

interface ToolResultRendererProps {
  toolName: string;
  result: unknown;
}

export function ToolResultRenderer({ toolName, result }: ToolResultRendererProps) {
  const data = result as Record<string, unknown>;

  switch (toolName) {
    case 'create_workout_log':
      return <WorkoutLoggedCard data={data} />;
    case 'get_today_workout':
      return <TodayWorkoutCard data={data} />;
    case 'get_training_plan':
      return <TrainingPlanCard data={data} />;
    case 'update_training_plan_day':
      return <DayUpdatedCard data={data} />;
    case 'log_benchmark':
      return <BenchmarkCard data={data} />;
    case 'get_athlete_stats':
      return <StatsCard data={data} />;
    case 'set_goal':
      return <GoalCard data={data} />;
    case 'get_progress_summary':
      return <ProgressCard data={data} />;
    case 'calculate_race_pacing':
      return <PacingCard data={data} />;
    default:
      return null;
  }
}

function CardWrapper({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-2 border border-border-default rounded-lg p-4 my-2">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-hyrox-yellow" />
        <span className="font-display text-xs uppercase tracking-wider text-text-secondary">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function WorkoutLoggedCard({ data }: { data: Record<string, unknown> }) {
  const workout = data.workout as Record<string, unknown> | undefined;
  if (!data.success || !workout) return null;

  return (
    <CardWrapper icon={CheckCircle2} label="Workout Logged">
      <div className="flex items-center gap-4 text-sm">
        <span className="font-body text-text-primary capitalize">
          {String(workout.session_type ?? '').replace(/_/g, ' ')}
        </span>
        {!!workout.duration_minutes && (
          <span className="font-mono text-text-secondary">
            {String(workout.duration_minutes)} min
          </span>
        )}
        {!!workout.rpe_post && (
          <span className="font-mono text-text-secondary">
            RPE {String(workout.rpe_post)}
          </span>
        )}
      </div>
    </CardWrapper>
  );
}

function TodayWorkoutCard({ data }: { data: Record<string, unknown> }) {
  const workout = data.workout as Record<string, unknown> | null;
  if (!workout) {
    return (
      <CardWrapper icon={Calendar} label="Today's Workout">
        <p className="font-body text-sm text-text-secondary">
          {String(data.message ?? 'No workout scheduled today.')}
        </p>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper icon={Calendar} label="Today's Workout">
      <div className="space-y-1">
        <p className="font-body text-sm font-medium text-text-primary">
          {String(workout.workout_title ?? 'Workout')}
        </p>
        <div className="flex gap-3 text-xs text-text-secondary">
          <span className="capitalize">
            {String(workout.session_type ?? '').replace(/_/g, ' ')}
          </span>
          {!!workout.estimated_duration_minutes && (
            <span>{String(workout.estimated_duration_minutes)} min</span>
          )}
        </div>
        {!!workout.workout_description && (
          <p className="font-body text-xs text-text-tertiary mt-1 line-clamp-3">
            {String(workout.workout_description)}
          </p>
        )}
      </div>
    </CardWrapper>
  );
}

function TrainingPlanCard({ data }: { data: Record<string, unknown> }) {
  const plan = data.plan as Record<string, unknown> | null;
  if (!plan) {
    return (
      <CardWrapper icon={ClipboardList} label="Training Plan">
        <p className="font-body text-sm text-text-secondary">
          {String(data.message ?? 'No active training plan.')}
        </p>
      </CardWrapper>
    );
  }

  const weeks = (plan.weeks as Array<Record<string, unknown>>) ?? [];

  return (
    <CardWrapper icon={ClipboardList} label="Training Plan">
      <div className="space-y-2">
        <p className="font-body text-sm font-medium text-text-primary">
          {String(plan.plan_name)}
        </p>
        {!!plan.goal && (
          <p className="font-body text-xs text-text-secondary">
            Goal: {String(plan.goal)}
          </p>
        )}
        <p className="font-mono text-xs text-text-tertiary">
          {String(plan.duration_weeks)} weeks — {weeks.length} loaded
        </p>
      </div>
    </CardWrapper>
  );
}

function DayUpdatedCard({ data }: { data: Record<string, unknown> }) {
  if (!data.success) return null;
  const day = data.day as Record<string, unknown>;

  return (
    <CardWrapper icon={Calendar} label="Day Updated">
      <p className="font-body text-sm text-text-primary">
        {String(day?.workout_title ?? 'Updated')} —{' '}
        <span className="capitalize">
          {String(day?.session_type ?? '').replace(/_/g, ' ')}
        </span>
      </p>
    </CardWrapper>
  );
}

function BenchmarkCard({ data }: { data: Record<string, unknown> }) {
  if (!data.success) return null;
  const benchmark = data.benchmark as Record<string, unknown>;

  return (
    <CardWrapper icon={Trophy} label="Benchmark Logged">
      <div className="flex items-center gap-4 text-sm">
        <span className="font-body text-text-primary">
          {String(benchmark?.test_type ?? '')}
        </span>
        <span className="font-mono text-text-secondary">
          {String(benchmark?.test_date ?? '')}
        </span>
      </div>
    </CardWrapper>
  );
}

function StatsCard({ data }: { data: Record<string, unknown> }) {
  const stats = data.weeklyStats as Record<string, unknown> | undefined;
  const profile = data.profile as Record<string, unknown> | undefined;

  return (
    <CardWrapper icon={Dumbbell} label="Athlete Stats">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="font-mono text-lg text-text-primary">
            {String(stats?.workouts ?? 0)}
          </p>
          <p className="font-body text-[10px] text-text-tertiary uppercase">
            This Week
          </p>
        </div>
        <div>
          <p className="font-mono text-lg text-text-primary">
            {String(stats?.totalMinutes ?? 0)}
          </p>
          <p className="font-body text-[10px] text-text-tertiary uppercase">
            Minutes
          </p>
        </div>
        <div>
          <p className="font-mono text-lg text-text-primary">
            {stats?.avgRpe ? String(stats.avgRpe) : '—'}
          </p>
          <p className="font-body text-[10px] text-text-tertiary uppercase">
            Avg RPE
          </p>
        </div>
      </div>
      {!!profile?.race_date && (
        <p className="font-body text-xs text-text-secondary mt-2">
          Division: {String(profile.hyrox_division ?? 'Open')} — Goal:{' '}
          {!!profile.goal_time_minutes
            ? `${String(profile.goal_time_minutes)} min`
            : 'Not set'}
        </p>
      )}
    </CardWrapper>
  );
}

function GoalCard({ data }: { data: Record<string, unknown> }) {
  if (!data.success) return null;
  const goal = data.goal as Record<string, unknown>;

  return (
    <CardWrapper icon={Target} label="Goal Set">
      <div className="space-y-1">
        <p className="font-body text-sm font-medium text-text-primary">
          {String(goal?.title ?? '')}
        </p>
        {!!goal?.target_value && (
          <p className="font-mono text-xs text-text-secondary">
            Target: {String(goal.target_value)}
          </p>
        )}
        {!!goal?.target_date && (
          <p className="font-body text-xs text-text-tertiary">
            By: {String(goal.target_date)}
          </p>
        )}
      </div>
    </CardWrapper>
  );
}

function ProgressCard({ data }: { data: Record<string, unknown> }) {
  const byType = (data.workoutsByType as Record<string, number>) ?? {};

  return (
    <CardWrapper icon={TrendingUp} label="Progress Summary">
      <div className="space-y-2">
        <div className="flex gap-4 text-sm">
          <span className="font-mono text-text-primary">
            {String(data.totalWorkouts ?? 0)} workouts
          </span>
          <span className="font-mono text-text-secondary">
            {String(data.totalHours ?? 0)}h
          </span>
          {data.planAdherencePct !== null && data.planAdherencePct !== undefined && (
            <span className="font-mono text-hyrox-yellow">
              {String(data.planAdherencePct)}% adherence
            </span>
          )}
        </div>
        {Object.keys(byType).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(byType).map(([type, count]) => (
              <span
                key={type}
                className="px-2 py-0.5 bg-surface-1 rounded text-[10px] font-mono text-text-tertiary capitalize"
              >
                {type.replace(/_/g, ' ')}: {count}
              </span>
            ))}
          </div>
        )}
      </div>
    </CardWrapper>
  );
}

function PacingCard({ data }: { data: Record<string, unknown> }) {
  const runSplits = data.run_splits as Record<string, unknown> | undefined;
  const stationSplits = (data.station_splits as Array<Record<string, unknown>>) ?? [];

  return (
    <CardWrapper icon={Timer} label="Race Pacing">
      <div className="space-y-3">
        <div className="flex gap-4 text-sm">
          <span className="font-body text-text-primary">
            Target: {String(data.target_minutes ?? '')} min
          </span>
          <span className="font-mono text-hyrox-yellow">
            {String(runSplits?.pace_per_km ?? '')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {stationSplits.slice(0, 8).map((s, i) => (
            <div key={i} className="flex justify-between text-xs py-0.5">
              <span className="font-body text-text-secondary truncate mr-2">
                {String(s.station)}
              </span>
              <span className="font-mono text-text-primary">
                {String(s.target_minutes)}m
              </span>
            </div>
          ))}
        </div>
      </div>
    </CardWrapper>
  );
}
