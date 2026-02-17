'use client';

import { useDraggable } from '@dnd-kit/core';
import { Check, Moon } from 'lucide-react';
import { SESSION_TYPE_COLORS } from './week-calendar';

interface PlanDay {
  id: string;
  day_of_week: number;
  session_type: string | null;
  workout_title: string | null;
  estimated_duration_minutes: number | null;
  is_rest_day: boolean | null;
  is_completed: boolean | null;
}

interface DraggableWorkoutCardProps {
  day: PlanDay;
  isToday: boolean;
  onClick: () => void;
}

export function DraggableWorkoutCard({
  day,
  isToday,
  onClick,
}: DraggableWorkoutCardProps) {
  const isDraggable = !day.is_completed && !day.is_rest_day;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: day.id,
    disabled: !isDraggable,
  });

  if (day.is_rest_day) {
    return (
      <button
        onClick={onClick}
        className="w-full h-full min-h-[80px] flex flex-col items-center justify-center gap-1 p-1.5 cursor-pointer hover:bg-surface-2 transition-colors rounded-sm"
      >
        <Moon className="h-3.5 w-3.5 text-text-tertiary/50" />
        <span className="font-body text-[9px] text-text-tertiary/50">
          Rest
        </span>
      </button>
    );
  }

  const sessionColor =
    SESSION_TYPE_COLORS[day.session_type || 'general'] || 'bg-surface-4';

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`w-full h-full min-h-[80px] flex flex-col gap-1 p-1.5 text-left cursor-pointer hover:bg-surface-2 transition-all rounded-sm ${
        isDragging ? 'opacity-30' : ''
      } ${day.is_completed ? 'opacity-60' : ''}`}
      {...(isDraggable ? { ...listeners, ...attributes } : {})}
    >
      {/* Session type badge */}
      <div className="flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rounded-full ${sessionColor}`} />
        <span className="font-display text-[8px] uppercase tracking-widest text-text-tertiary truncate">
          {day.session_type || 'general'}
        </span>
        {day.is_completed && (
          <Check className="h-3 w-3 text-semantic-success ml-auto flex-shrink-0" />
        )}
      </div>

      {/* Title */}
      <span
        className={`font-body text-[10px] leading-tight ${
          isToday ? 'text-text-primary' : 'text-text-secondary'
        } line-clamp-2`}
      >
        {day.workout_title || 'Workout'}
      </span>

      {/* Duration */}
      {day.estimated_duration_minutes && (
        <span className="font-mono text-[9px] text-text-tertiary mt-auto">
          {day.estimated_duration_minutes}m
        </span>
      )}
    </button>
  );
}
