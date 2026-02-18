'use client';

import { SESSION_TYPE_COLORS } from '@/components/training/week-calendar';
import { Check, Plus } from 'lucide-react';

interface PlanDay {
  id: string;
  day_of_week: number;
  session_type: string | null;
  workout_title: string | null;
  estimated_duration_minutes: number | null;
  is_rest_day: boolean | null;
  is_completed: boolean | null;
}

interface Workout {
  id: string;
  date: string;
  session_type: string;
  duration_minutes: number | null;
}

interface CalendarDayCellProps {
  date: Date;
  planDay: PlanDay | undefined;
  workouts: Workout[];
  isSelected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
  onClick: () => void;
}

export function CalendarDayCell({
  date,
  planDay,
  workouts,
  isSelected,
  isToday,
  isCurrentMonth,
  onClick,
}: CalendarDayCellProps) {
  const dateNum = date.getDate();
  const hasWorkouts = workouts.length > 0;
  const hasUnplannedWorkout = hasWorkouts && !planDay;
  const isCompleted = planDay?.is_completed || (hasWorkouts && !!planDay);
  const isRestDay = planDay?.is_rest_day;

  const sessionType = planDay?.session_type ?? (workouts[0]?.session_type || null);
  const dotColor = sessionType ? (SESSION_TYPE_COLORS[sessionType] ?? 'bg-surface-4') : null;

  return (
    <button
      onClick={onClick}
      className={[
        'relative flex flex-col items-start p-1 min-h-[60px] rounded transition-colors text-left',
        isCurrentMonth ? 'text-text-primary' : 'text-text-tertiary',
        isSelected
          ? 'bg-hyrox-yellow/20 ring-1 ring-hyrox-yellow'
          : 'hover:bg-surface-2',
        isToday ? 'ring-1 ring-hyrox-yellow' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Date number */}
      <span
        className={[
          'font-mono text-xs leading-none mb-1',
          isToday ? 'text-hyrox-yellow font-bold' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {dateNum}
      </span>

      {/* Session type dot / pill */}
      {dotColor && !isRestDay && (
        <span
          className={`w-2 h-2 rounded-full ${dotColor} mb-0.5`}
          aria-hidden="true"
        />
      )}

      {/* Rest day label */}
      {isRestDay && (
        <span className="font-display text-[9px] uppercase tracking-wider text-text-tertiary">
          Rest
        </span>
      )}

      {/* Completion check */}
      {isCompleted && !isRestDay && (
        <Check className="h-3 w-3 text-coach-green absolute bottom-1 right-1" />
      )}

      {/* Unplanned workout indicator */}
      {hasUnplannedWorkout && (
        <Plus className="h-3 w-3 text-text-tertiary absolute bottom-1 right-1" />
      )}
    </button>
  );
}
