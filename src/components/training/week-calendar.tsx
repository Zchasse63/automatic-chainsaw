'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { DraggableWorkoutCard } from './draggable-workout-card';
import { DroppableDay } from './droppable-day';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useUpdatePlanDay } from '@/hooks/use-training-plans';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const SESSION_TYPE_COLORS: Record<string, string> = {
  run: 'bg-station-ski',
  hiit: 'bg-station-push',
  strength: 'bg-station-carry',
  simulation: 'bg-hyrox-yellow',
  recovery: 'bg-coach-green',
  station_practice: 'bg-station-burpee',
  general: 'bg-surface-4',
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

interface PlanWeek {
  id: string;
  week_number: number;
  focus: string | null;
  training_plan_days: PlanDay[];
}

interface WeekCalendarProps {
  weeks: PlanWeek[];
  planId: string;
  startDate: string;
  totalWeeks: number;
  onDayClick: (day: PlanDay) => void;
}

export function WeekCalendar({
  weeks,
  planId,
  startDate,
  totalWeeks,
  onDayClick,
}: WeekCalendarProps) {
  const updateDay = useUpdatePlanDay();
  const [activeDrag, setActiveDrag] = useState<PlanDay | null>(null);

  // Calculate current week from start date
  const startMs = new Date(startDate).getTime();
  const daysSinceStart = Math.floor((Date.now() - startMs) / 86_400_000);
  const autoWeek = Math.max(1, Math.min(totalWeeks, Math.floor(daysSinceStart / 7) + 1));

  const [currentWeekNum, setCurrentWeekNum] = useState(autoWeek);

  const currentWeek = weeks.find((w) => w.week_number === currentWeekNum);
  const days = currentWeek?.training_plan_days ?? [];

  // Map days by day_of_week for the grid
  const dayMap = new Map<number, PlanDay>();
  days.forEach((d) => dayMap.set(d.day_of_week, d));

  // What day of week is today (0=Mon)
  const jsDay = new Date().getDay(); // 0=Sun
  const todayDow = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Mon

  // Are we viewing the current active week?
  const isCurrentWeek = currentWeekNum === autoWeek;

  function handleDragStart(event: DragStartEvent) {
    const dayId = event.active.id as string;
    const day = days.find((d) => d.id === dayId);
    if (day) setActiveDrag(day);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const dayId = active.id as string;
    const newDow = Number(over.id);
    const day = days.find((d) => d.id === dayId);
    if (!day || day.day_of_week === newDow) return;

    updateDay.mutate({
      planId,
      dayId,
      data: { day_of_week: newDow },
    });
  }

  return (
    <div className="space-y-3">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentWeekNum((w) => Math.max(1, w - 1))}
          disabled={currentWeekNum <= 1}
          className="p-1.5 rounded-sm text-text-tertiary hover:text-text-primary hover:bg-surface-2 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="text-center">
          <span className="font-display text-sm font-bold uppercase tracking-wider text-text-primary">
            Week {currentWeekNum} of {totalWeeks}
          </span>
          {currentWeek?.focus && (
            <p className="font-body text-xs text-text-secondary mt-0.5">
              {currentWeek.focus}
            </p>
          )}
        </div>

        <button
          onClick={() =>
            setCurrentWeekNum((w) => Math.min(totalWeeks, w + 1))
          }
          disabled={currentWeekNum >= totalWeeks}
          className="p-1.5 rounded-sm text-text-tertiary hover:text-text-primary hover:bg-surface-2 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar grid */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {DAY_NAMES.map((name, i) => (
            <div
              key={name}
              className={`text-center py-1.5 font-display text-[10px] uppercase tracking-widest ${
                isCurrentWeek && i === todayDow
                  ? 'text-hyrox-yellow'
                  : 'text-text-tertiary'
              }`}
            >
              {name}
            </div>
          ))}

          {/* Day cells */}
          {Array.from({ length: 7 }, (_, dow) => {
            const day = dayMap.get(dow);
            return (
              <DroppableDay
                key={dow}
                dow={dow}
                isToday={isCurrentWeek && dow === todayDow}
              >
                {day ? (
                  <DraggableWorkoutCard
                    day={day}
                    isToday={isCurrentWeek && dow === todayDow}
                    onClick={() => onDayClick(day)}
                  />
                ) : (
                  <div className="h-full min-h-[80px] flex items-center justify-center">
                    <span className="font-body text-[10px] text-text-tertiary/50">
                      —
                    </span>
                  </div>
                )}
              </DroppableDay>
            );
          })}
        </div>

        <DragOverlay>
          {activeDrag && (
            <div className="bg-surface-3 border border-hyrox-yellow rounded-sm p-2 shadow-glow-md opacity-90">
              <span className="font-body text-xs text-text-primary">
                {activeDrag.workout_title || 'Workout'}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
