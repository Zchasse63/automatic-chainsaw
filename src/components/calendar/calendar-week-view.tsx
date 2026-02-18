'use client';

import { getWeekDays, toISODateString } from '@/lib/calendar-utils';
import { SESSION_TYPE_COLORS } from '@/components/training/week-calendar';
import { Check } from 'lucide-react';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SESSION_LABELS: Record<string, string> = {
  run: 'Run',
  hiit: 'HIIT',
  strength: 'Strength',
  simulation: 'Simulation',
  recovery: 'Recovery',
  station_practice: 'Station',
  general: 'General',
};

interface PlanDay {
  id: string;
  day_of_week: number;
  session_type: string | null;
  workout_title: string | null;
  workout_description: string | null;
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

interface CalendarWeekViewProps {
  weekStart: Date;
  planDayMap: Map<string, PlanDay>;
  workoutMap: Map<string, Workout[]>;
  selectedDate: string | null;
  onDayClick: (dateStr: string) => void;
}

export function CalendarWeekView({
  weekStart,
  planDayMap,
  workoutMap,
  selectedDate,
  onDayClick,
}: CalendarWeekViewProps) {
  const days = getWeekDays(weekStart);
  const today = toISODateString(new Date());

  return (
    <div className="bg-surface-1 border border-border-default rounded-lg overflow-hidden">
      {/* Day header row */}
      <div className="grid grid-cols-7 border-b border-border-default">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="p-2 text-center font-display text-[10px] uppercase tracking-widest text-text-tertiary"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Week cells */}
      <div className="grid grid-cols-7 gap-px bg-border-default">
        {days.map((date, idx) => {
          const dateStr = toISODateString(date);
          const planDay = planDayMap.get(dateStr);
          const workouts = workoutMap.get(dateStr) ?? [];
          const isToday = dateStr === today;
          const isSelected = selectedDate === dateStr;
          const sessionType = planDay?.session_type ?? workouts[0]?.session_type ?? null;
          const dotColor = sessionType ? (SESSION_TYPE_COLORS[sessionType] ?? 'bg-surface-4') : null;
          const isCompleted = planDay?.is_completed || (workouts.length > 0 && !!planDay);

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={[
                'flex flex-col p-2 min-h-24 text-left transition-colors bg-surface-1',
                isSelected ? 'bg-hyrox-yellow/20' : 'hover:bg-surface-2',
                isToday ? 'ring-inset ring-1 ring-hyrox-yellow' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* Date */}
              <span
                className={[
                  'font-mono text-xs mb-1',
                  isToday ? 'text-hyrox-yellow font-bold' : 'text-text-secondary',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {DAY_NAMES[idx]} {date.getDate()}
              </span>

              {/* Session type badge */}
              {dotColor && sessionType && !planDay?.is_rest_day && (
                <span
                  className={`font-display text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm text-white ${dotColor} mb-1 self-start`}
                >
                  {SESSION_LABELS[sessionType] ?? sessionType}
                </span>
              )}

              {/* Workout title */}
              {planDay?.workout_title && !planDay.is_rest_day && (
                <span className="font-body text-xs text-text-primary line-clamp-2 leading-tight">
                  {planDay.workout_title}
                </span>
              )}

              {/* Rest day */}
              {planDay?.is_rest_day && (
                <span className="font-display text-[9px] uppercase tracking-wider text-text-tertiary">
                  Rest
                </span>
              )}

              {/* Duration */}
              {planDay?.estimated_duration_minutes && !planDay.is_rest_day && (
                <span className="font-mono text-[10px] text-text-tertiary mt-auto">
                  {planDay.estimated_duration_minutes}m
                </span>
              )}

              {/* Completion check */}
              {isCompleted && !planDay?.is_rest_day && (
                <Check className="h-3 w-3 text-coach-green mt-auto self-end" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
