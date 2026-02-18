'use client';

import { getMonthDays, toISODateString } from '@/lib/calendar-utils';
import { CalendarDayCell } from './calendar-day-cell';

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

interface FullCalendarProps {
  year: number;
  month: number; // 0-indexed
  planDayMap: Map<string, PlanDay>;
  workoutMap: Map<string, Workout[]>;
  selectedDate: string | null;
  onDayClick: (dateStr: string) => void;
}

export function FullCalendar({
  year,
  month,
  planDayMap,
  workoutMap,
  selectedDate,
  onDayClick,
}: FullCalendarProps) {
  const days = getMonthDays(year, month);
  const today = toISODateString(new Date());

  return (
    <div className="bg-surface-1 border border-border-default rounded-lg overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border-default">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="p-2 text-center font-display text-[10px] uppercase tracking-widest text-text-tertiary"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px bg-border-default">
        {days.map((date) => {
          const dateStr = toISODateString(date);
          const isCurrentMonth = date.getMonth() === month;
          return (
            <div key={dateStr} className="bg-surface-1">
              <CalendarDayCell
                date={date}
                planDay={planDayMap.get(dateStr)}
                workouts={workoutMap.get(dateStr) ?? []}
                isSelected={selectedDate === dateStr}
                isToday={dateStr === today}
                isCurrentMonth={isCurrentMonth}
                onClick={() => onDayClick(dateStr)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
