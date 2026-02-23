'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WeekDayRow } from './week-day-row';
import { getWeekDays, toISODateString } from '@/lib/calendar-utils';
import type { CalendarWorkout } from '@/hooks/use-calendar-workouts';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface WeekGridProps {
  weekStart: Date;
  grouped: Record<string, CalendarWorkout[]>;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export function WeekGrid({
  weekStart,
  grouped,
  onPrevWeek,
  onNextWeek,
}: WeekGridProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  // Determine the week's date range label
  const weekEnd = weekDays[6];
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const label = sameMonth
    ? `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()}–${weekEnd.getDate()}`
    : `${MONTH_NAMES[weekStart.getMonth()].slice(0, 3)} ${weekStart.getDate()} – ${MONTH_NAMES[weekEnd.getMonth()].slice(0, 3)} ${weekEnd.getDate()}`;

  return (
    <div>
      {/* Week header */}
      <div className="flex items-center justify-between mb-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onPrevWeek}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft size={16} />
        </motion.button>

        <h3 className="text-lg font-black italic tracking-tighter text-white">
          {label}{' '}
          <span className="text-white/40 not-italic font-bold">{weekStart.getFullYear()}</span>
        </h3>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onNextWeek}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          aria-label="Next week"
        >
          <ChevronRight size={16} />
        </motion.button>
      </div>

      {/* Day rows */}
      <div className="space-y-1">
        {weekDays.map((date, i) => {
          const dateKey = toISODateString(date);
          const workouts = grouped[dateKey] ?? [];
          const isToday =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();

          return (
            <WeekDayRow
              key={dateKey}
              date={date}
              workouts={workouts}
              isToday={isToday}
              index={i}
            />
          );
        })}
      </div>
    </div>
  );
}
