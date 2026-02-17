'use client';

import { Button } from '@/components/ui/button';
import {
  Calendar,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  MessageSquare,
  Play,
  Target,
  Timer,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { useDashboard } from '@/hooks/use-dashboard';

const SESSION_LABELS: Record<string, string> = {
  run: 'Run',
  hiit: 'HIIT',
  strength: 'Strength',
  simulation: 'Simulation',
  recovery: 'Recovery',
  station_practice: 'Station Practice',
  general: 'General',
};

export default function DashboardPage() {
  const { data, isLoading: loading } = useDashboard();

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-48 bg-surface-2 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-40 bg-surface-1 border border-border-default rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const firstName = data.profile.display_name?.split(' ')[0] || 'Athlete';

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-text-primary">
          Hey {firstName}
        </h1>
        <p className="font-body text-text-secondary mt-1">
          {data.profile.current_phase
            ? `${data.profile.current_phase.replace(/_/g, ' ')} phase`
            : "Let's get after it"}
          {data.profile.hyrox_division &&
            ` — ${data.profile.hyrox_division} division`}
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Race Countdown — spans 2 cols on mobile */}
        {data.daysUntilRace !== null && (
          <div className="col-span-2 bg-surface-1 border border-border-default rounded-lg p-6 relative overflow-hidden">
            <div className="caution-stripe absolute top-0 left-0 right-0" />
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-display text-xs uppercase tracking-widest text-text-tertiary">
                  Race Day
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display text-5xl font-black text-hyrox-yellow">
                    {data.daysUntilRace}
                  </span>
                  <span className="font-display text-lg uppercase tracking-wider text-text-secondary">
                    days
                  </span>
                </div>
                {data.profile.goal_time_minutes && (
                  <p className="font-body text-xs text-text-tertiary mt-1">
                    Goal: {data.profile.goal_time_minutes} min
                  </p>
                )}
              </div>
              <Calendar className="h-10 w-10 text-hyrox-yellow/20" />
            </div>
          </div>
        )}

        {/* Weekly Workouts */}
        <div className="bg-surface-1 border border-border-default rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="h-4 w-4 text-hyrox-yellow" />
            <span className="font-display text-[10px] uppercase tracking-widest text-text-tertiary">
              This Week
            </span>
          </div>
          <p className="font-display text-3xl font-black text-text-primary">
            {data.weeklyStats.workouts}
          </p>
          <p className="font-body text-xs text-text-tertiary mt-0.5">
            workouts
          </p>
        </div>

        {/* Training Hours */}
        <div className="bg-surface-1 border border-border-default rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-hyrox-yellow" />
            <span className="font-display text-[10px] uppercase tracking-widest text-text-tertiary">
              Hours
            </span>
          </div>
          <p className="font-display text-3xl font-black text-text-primary">
            {(data.weeklyStats.totalMinutes / 60).toFixed(1)}
          </p>
          <p className="font-body text-xs text-text-tertiary mt-0.5">
            this week
          </p>
        </div>

        {/* Streak */}
        <div className="bg-surface-1 border border-border-default rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-4 w-4 text-hyrox-yellow" />
            <span className="font-display text-[10px] uppercase tracking-widest text-text-tertiary">
              Streak
            </span>
          </div>
          <p className="font-display text-3xl font-black text-text-primary">
            {data.streak}
          </p>
          <p className="font-body text-xs text-text-tertiary mt-0.5">
            {data.streak === 1 ? 'day' : 'days'}
          </p>
        </div>

        {/* Average RPE */}
        <div className="bg-surface-1 border border-border-default rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="h-4 w-4 text-hyrox-yellow" />
            <span className="font-display text-[10px] uppercase tracking-widest text-text-tertiary">
              Avg RPE
            </span>
          </div>
          <p className="font-display text-3xl font-black text-text-primary">
            {data.weeklyStats.avgRpe ?? '—'}
          </p>
          <p className="font-body text-xs text-text-tertiary mt-0.5">
            this week
          </p>
        </div>

        {/* Today's Workout */}
        {data.todaysWorkout && !data.todaysWorkout.is_completed && (
          <Link
            href={`/training/log?planDayId=${data.todaysWorkout.id}`}
            className="col-span-2 bg-hyrox-yellow/5 border border-hyrox-yellow/20 rounded-lg p-5 hover:bg-hyrox-yellow/10 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-[10px] uppercase tracking-widest text-hyrox-yellow mb-1">
                  Today&apos;s Workout
                </p>
                <p className="font-display text-base font-bold uppercase tracking-wider text-text-primary group-hover:text-hyrox-yellow transition-colors">
                  {data.todaysWorkout.workout_title || 'Workout'}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  {data.todaysWorkout.session_type && (
                    <span className="font-display text-[10px] uppercase tracking-wider text-text-tertiary">
                      {SESSION_LABELS[data.todaysWorkout.session_type] || data.todaysWorkout.session_type}
                    </span>
                  )}
                  {data.todaysWorkout.estimated_duration_minutes && (
                    <span className="font-mono text-xs text-text-tertiary">
                      {data.todaysWorkout.estimated_duration_minutes} min
                    </span>
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-hyrox-yellow/10 flex items-center justify-center">
                <Play className="h-5 w-5 text-hyrox-yellow" />
              </div>
            </div>
          </Link>
        )}

        {/* Active Plan Progress */}
        {data.activePlan && (
          <Link
            href="/training"
            className="col-span-2 bg-surface-1 border border-border-default rounded-lg p-5 hover:border-hyrox-yellow/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-display text-[10px] uppercase tracking-widest text-text-tertiary">
                  Training Plan
                </p>
                <p className="font-display text-sm font-bold uppercase tracking-wider text-text-primary group-hover:text-hyrox-yellow transition-colors">
                  {data.activePlan.plan_name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-text-tertiary">
                  Week {data.activePlan.currentWeek}/{data.activePlan.totalWeeks}
                </span>
                <ChevronRight className="h-4 w-4 text-text-tertiary" />
              </div>
            </div>
            <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-hyrox-yellow rounded-full transition-all"
                style={{ width: `${data.activePlan.progressPct}%` }}
              />
            </div>
            <p className="font-mono text-[10px] text-text-tertiary mt-1">
              {data.activePlan.progressPct}% complete
            </p>
          </Link>
        )}

        {/* Ask Coach K — CTA */}
        <Link
          href="/coach"
          className="col-span-2 bg-hyrox-yellow/5 border border-hyrox-yellow/20 rounded-lg p-5 hover:bg-hyrox-yellow/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-hyrox-yellow/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-hyrox-yellow" />
            </div>
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wider text-text-primary group-hover:text-hyrox-yellow transition-colors">
                Ask Coach K
              </p>
              <p className="font-body text-xs text-text-tertiary">
                {data.lastConversation
                  ? `Last chat: ${data.lastConversation.title || 'Untitled'}`
                  : 'Start your first coaching session'}
              </p>
            </div>
          </div>
        </Link>

        {/* Recent PRs */}
        {data.recentPRs.length > 0 && (
          <div className="col-span-2 bg-surface-1 border border-border-default rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-hyrox-yellow" />
              <span className="font-display text-[10px] uppercase tracking-widest text-text-tertiary">
                Recent PRs
              </span>
            </div>
            <div className="space-y-2">
              {data.recentPRs.map((pr) => (
                <div
                  key={pr.id}
                  className="flex items-center justify-between"
                >
                  <span className="font-body text-sm text-text-primary">
                    {pr.exercise_name || pr.record_type}
                  </span>
                  <span className="font-mono text-sm text-hyrox-yellow">
                    {pr.value} {pr.value_unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Goals */}
        {data.goals.length > 0 && (
          <div className="col-span-2 bg-surface-1 border border-border-default rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-hyrox-yellow" />
              <span className="font-display text-[10px] uppercase tracking-widest text-text-tertiary">
                Goals
              </span>
            </div>
            <div className="space-y-3">
              {data.goals.map((goal) => {
                const progress =
                  goal.target_value && goal.current_value
                    ? Math.min(
                        (goal.current_value / goal.target_value) * 100,
                        100
                      )
                    : 0;
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body text-sm text-text-primary">
                        {goal.title}
                      </span>
                      <span className="font-mono text-xs text-text-tertiary">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-hyrox-yellow rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Empty state for new users */}
      {data.weeklyStats.workouts === 0 &&
        data.recentPRs.length === 0 &&
        data.goals.length === 0 && (
          <div className="bg-surface-1 border border-border-default rounded-lg p-8 text-center space-y-4">
            <h2 className="font-display text-xl font-bold uppercase tracking-wider text-text-primary">
              Welcome to Your Training Hub
            </h2>
            <p className="font-body text-text-secondary max-w-md mx-auto">
              Your dashboard will come alive as you train. Get started with
              one of these:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/coach">
                <Button className="bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider text-xs">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat with Coach K
                </Button>
              </Link>
            </div>
          </div>
        )}
    </div>
  );
}
