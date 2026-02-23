'use client';

import { useDroppable } from '@dnd-kit/core';
import { workoutColors } from '@/components/shared/workout-badge';
import type { CalendarWorkout } from '@/hooks/use-calendar-workouts';

// Map session_type to workout color keys
const SESSION_COLOR_MAP: Record<string, string> = {
  run: 'Run',
  hiit: 'HIIT',
  strength: 'Strength',
  simulation: 'Hyrox Sim',
  recovery: 'Recovery',
  station_practice: 'CrossFit',
  general: 'Sled', // amber
};

function getWorkoutColor(sessionType: string): string {
  const key = SESSION_COLOR_MAP[sessionType];
  return key ? workoutColors[key] ?? '#ffffff33' : '#ffffff33';
}

interface DayCellProps {
  date: Date;
  workouts: CalendarWorkout[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onSelect: (date: Date) => void;
}

export function DayCell({
  date,
  workouts,
  isCurrentMonth,
  isToday,
  isSelected,
  onSelect,
}: DayCellProps) {
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const { setNodeRef, isOver } = useDroppable({
    id: dateKey,
    data: { date: dateKey },
  });

  return (
    <button
      ref={setNodeRef}
      onClick={() => onSelect(date)}
      className={`relative flex flex-col items-center justify-start gap-1 py-2 rounded-xl transition-all min-h-[52px] ${
        !isCurrentMonth
          ? 'opacity-25'
          : isSelected
            ? 'bg-white/8 border border-[#39FF14]/30'
            : isOver
              ? 'bg-[#39FF14]/10 border border-[#39FF14]/40'
              : 'hover:bg-white/3 border border-transparent'
      }`}
      aria-label={`${date.toLocaleDateString()}, ${workouts.length} workouts`}
    >
      {/* Day number */}
      <span
        className={`text-xs font-bold leading-none ${
          isToday
            ? 'w-6 h-6 rounded-full bg-[#39FF14] text-black flex items-center justify-center'
            : isCurrentMonth
              ? 'text-white/70'
              : 'text-white/20'
        }`}
      >
        {date.getDate()}
      </span>

      {/* Workout dots (max 3) */}
      {workouts.length > 0 && (
        <div className="flex gap-0.5">
          {workouts.slice(0, 3).map((w) => (
            <div
              key={w.id}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: getWorkoutColor(w.session_type) }}
            />
          ))}
        </div>
      )}
    </button>
  );
}
