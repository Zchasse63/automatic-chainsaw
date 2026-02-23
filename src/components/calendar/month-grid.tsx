'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayCell } from './day-cell';
import type { CalendarWorkout } from '@/hooks/use-calendar-workouts';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MonthGridProps {
  year: number;
  month: number; // 0-indexed
  grouped: Record<string, CalendarWorkout[]>;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function MonthGrid({
  year,
  month,
  grouped,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: MonthGridProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build grid: starts on Monday, 6 rows
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    // getDay: 0=Sun → we want 0=Mon
    let startOffset = (firstDay.getDay() + 6) % 7;

    const days: Date[] = [];
    // Fill in previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push(d);
    }
    // Fill in current month + next month to complete 42 cells (6 rows)
    const daysNeeded = 42 - days.length;
    for (let i = 1; i <= daysNeeded; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [year, month]);

  return (
    <div>
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onPrevMonth}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </motion.button>

        <h3 className="text-lg font-black italic tracking-tighter text-white">
          {MONTH_NAMES[month]}{' '}
          <span className="text-white/40 not-italic font-bold">{year}</span>
        </h3>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onNextMonth}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </motion.button>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-[9px] font-bold uppercase tracking-widest text-white/25 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, i) => {
          const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const workouts = grouped[dateKey] ?? [];
          const isCurrentMonth = date.getMonth() === month;
          const isToday =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();
          const isSelected = selectedDate
            ? date.getFullYear() === selectedDate.getFullYear() &&
              date.getMonth() === selectedDate.getMonth() &&
              date.getDate() === selectedDate.getDate()
            : false;

          return (
            <DayCell
              key={i}
              date={date}
              workouts={workouts}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              isSelected={isSelected}
              onSelect={onSelectDate}
            />
          );
        })}
      </div>
    </div>
  );
}
