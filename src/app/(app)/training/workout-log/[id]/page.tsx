'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Flame,
  Gauge,
  MessageSquare,
  StickyNote,
} from 'lucide-react';

const SESSION_LABELS: Record<string, string> = {
  run: 'Run',
  hiit: 'HIIT',
  strength: 'Strength',
  simulation: 'Simulation',
  recovery: 'Recovery',
  station_practice: 'Station Practice',
  general: 'General',
};

const RPE_LABELS: Record<number, string> = {
  1: 'Very Light',
  2: 'Light',
  3: 'Light',
  4: 'Moderate',
  5: 'Moderate',
  6: 'Hard',
  7: 'Hard',
  8: 'Very Hard',
  9: 'Very Hard',
  10: 'Maximal',
};

function getRpeColor(rpe: number) {
  if (rpe <= 3) return 'text-coach-green';
  if (rpe <= 5) return 'text-hyrox-yellow';
  if (rpe <= 7) return 'text-station-pull';
  return 'text-station-push';
}

interface Workout {
  id: string;
  date: string;
  session_type: string;
  duration_minutes: number | null;
  rpe_pre: number | null;
  rpe_post: number | null;
  notes: string | null;
  completion_status: string | null;
  prescribed_workout: Record<string, unknown> | null;
  completed_workout: Record<string, unknown> | null;
  heart_rate_avg: number | null;
  calories_estimated: number | null;
  created_at: string;
}

export default function WorkoutLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: workout, isLoading } = useQuery<Workout>({
    queryKey: ['workout', id],
    queryFn: async () => {
      const res = await fetch(`/api/workouts/${id}`);
      if (!res.ok) throw new Error('Failed to load workout');
      const data = await res.json();
      return data.workout;
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-5 w-24 bg-surface-2 rounded animate-pulse" />
        <div className="h-8 w-48 bg-surface-2 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-surface-1 border border-border-default rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <Link
          href="/training"
          className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-display text-xs uppercase tracking-wider">Back</span>
        </Link>
        <div className="bg-surface-1 border border-border-default rounded-lg p-8 text-center">
          <p className="font-body text-sm text-text-secondary">Workout not found</p>
        </div>
      </div>
    );
  }

  const displayDate = new Date(workout.date + 'T00:00:00');
  const formattedDate = displayDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/training"
        className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-display text-xs uppercase tracking-wider">Back to Training</span>
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="font-display text-xs uppercase tracking-wider px-2.5 py-1 rounded-sm bg-surface-2 text-text-secondary">
            {SESSION_LABELS[workout.session_type] || workout.session_type || 'General'}
          </span>
          {workout.completion_status && workout.completion_status !== 'completed' && (
            <span className="font-display text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-station-pull/20 text-station-pull">
              {workout.completion_status}
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-text-primary">
          Workout Log
        </h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Date */}
        <div className="bg-surface-1 border border-border-default rounded-lg p-4 flex items-center gap-3">
          <Calendar className="h-5 w-5 text-text-tertiary shrink-0" />
          <div>
            <p className="font-display text-[10px] uppercase tracking-widest text-text-tertiary">Date</p>
            <p className="font-body text-sm text-text-primary">{formattedDate}</p>
          </div>
        </div>

        {/* Duration */}
        <div className="bg-surface-1 border border-border-default rounded-lg p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-text-tertiary shrink-0" />
          <div>
            <p className="font-display text-[10px] uppercase tracking-widest text-text-tertiary">Duration</p>
            <p className="font-body text-sm text-text-primary">
              {workout.duration_minutes ? `${workout.duration_minutes} min` : '—'}
            </p>
          </div>
        </div>

        {/* RPE Post */}
        {workout.rpe_post && (
          <div className="bg-surface-1 border border-border-default rounded-lg p-4 flex items-center gap-3">
            <Gauge className="h-5 w-5 text-text-tertiary shrink-0" />
            <div>
              <p className="font-display text-[10px] uppercase tracking-widest text-text-tertiary">RPE</p>
              <p className={`font-mono text-lg font-bold ${getRpeColor(workout.rpe_post)}`}>
                {workout.rpe_post}
                <span className="font-body text-xs text-text-tertiary ml-1.5">
                  {RPE_LABELS[workout.rpe_post] || ''}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Heart Rate */}
        {workout.heart_rate_avg && (
          <div className="bg-surface-1 border border-border-default rounded-lg p-4 flex items-center gap-3">
            <Gauge className="h-5 w-5 text-text-tertiary shrink-0" />
            <div>
              <p className="font-display text-[10px] uppercase tracking-widest text-text-tertiary">Avg HR</p>
              <p className="font-mono text-lg font-bold text-text-primary">
                {workout.heart_rate_avg}
                <span className="font-body text-xs text-text-tertiary ml-1"> bpm</span>
              </p>
            </div>
          </div>
        )}

        {/* Calories */}
        {workout.calories_estimated && (
          <div className="bg-surface-1 border border-border-default rounded-lg p-4 flex items-center gap-3">
            <Flame className="h-5 w-5 text-text-tertiary shrink-0" />
            <div>
              <p className="font-display text-[10px] uppercase tracking-widest text-text-tertiary">Calories</p>
              <p className="font-mono text-lg font-bold text-text-primary">
                {workout.calories_estimated}
                <span className="font-body text-xs text-text-tertiary ml-1"> kcal</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {workout.notes && (
        <div className="bg-surface-1 border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <StickyNote className="h-4 w-4 text-text-tertiary" />
            <span className="font-display text-[10px] uppercase tracking-widest text-text-tertiary">
              Notes
            </span>
          </div>
          <p className="font-body text-sm text-text-secondary whitespace-pre-wrap">
            {workout.notes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={`/coach?context=log&workoutId=${workout.id}`} className="flex-1">
          <Button
            variant="outline"
            className="w-full border-hyrox-yellow text-hyrox-yellow hover:bg-hyrox-yellow/10 font-display uppercase tracking-wider text-xs"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Discuss with Coach K
          </Button>
        </Link>
      </div>
    </div>
  );
}
