'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useWorkouts } from '@/hooks/use-workouts';
import {
  useActiveTrainingPlan,
  useTrainingPlan,
} from '@/hooks/use-training-plans';
import {
  buildPlanDayMap,
  buildWorkoutMap,
  getMonthDays,
  getCurrentWeekStart,
  toISODateString,
} from '@/lib/calendar-utils';
import { FullCalendar } from '@/components/calendar/full-calendar';
import { CalendarWeekView } from '@/components/calendar/calendar-week-view';
import { CalendarDayDetail } from '@/components/calendar/calendar-day-detail';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  CalendarRange,
  ArrowLeft,
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarPage() {
  const today = new Date();
  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getCurrentWeekStart);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Date range: union of month grid + current week (covers week view off-month navigation)
  const monthDays = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth]);
  const monthFrom = monthDays[0];
  const monthTo = monthDays[monthDays.length - 1];
  const weekEnd = useMemo(() => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [currentWeekStart]);
  const fromDate = toISODateString(currentWeekStart < monthFrom ? currentWeekStart : monthFrom);
  const toDate = toISODateString(weekEnd > monthTo ? weekEnd : monthTo);

  const { data: workouts = [] } = useWorkouts({ from: fromDate, to: toDate, limit: 100 });
  const { activePlan } = useActiveTrainingPlan();
  const { data: planDetail } = useTrainingPlan(activePlan?.id ?? null);

  const planDayMap = useMemo(
    () =>
      buildPlanDayMap(
        activePlan?.start_date ?? null,
        planDetail?.training_plan_weeks ?? []
      ),
    [activePlan?.start_date, planDetail]
  );

  const workoutMap = useMemo(() => buildWorkoutMap(workouts), [workouts]);

  // Selected day data
  const selectedPlanDay = selectedDate ? planDayMap.get(selectedDate) : undefined;
  const selectedWorkouts = selectedDate ? (workoutMap.get(selectedDate) ?? []) : [];

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function prevWeek() {
    setCurrentWeekStart((d) => {
      const next = new Date(d);
      next.setDate(d.getDate() - 7);
      return next;
    });
  }

  function nextWeek() {
    setCurrentWeekStart((d) => {
      const next = new Date(d);
      next.setDate(d.getDate() + 7);
      return next;
    });
  }

  function handleDayClick(dateStr: string) {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  }

  const detailOpen = !!selectedDate;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/training"
          className="text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-text-primary flex-1">
          Calendar
        </h1>
        {/* View toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView('week')}
            className={`p-1.5 rounded transition-colors ${
              view === 'week'
                ? 'bg-hyrox-yellow/20 text-hyrox-yellow'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
            title="Week view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('month')}
            className={`p-1.5 rounded transition-colors ${
              view === 'month'
                ? 'bg-hyrox-yellow/20 text-hyrox-yellow'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
            title="Month view"
          >
            <CalendarRange className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation row */}
      <div className="flex items-center justify-between">
        <button
          onClick={view === 'month' ? prevMonth : prevWeek}
          className="p-1.5 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <span className="font-display text-sm font-bold uppercase tracking-widest text-text-primary">
          {view === 'month'
            ? `${MONTH_NAMES[currentMonth]} ${currentYear}`
            : (() => {
                const weekEnd = new Date(currentWeekStart);
                weekEnd.setDate(currentWeekStart.getDate() + 6);
                return `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
              })()}
        </span>

        <button
          onClick={view === 'month' ? nextMonth : nextWeek}
          className="p-1.5 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar + Detail panel */}
      <div className={`flex gap-4 ${detailOpen ? 'md:grid md:grid-cols-[1fr_320px]' : ''}`}>
        <div className="min-w-0 flex-1">
          {view === 'month' ? (
            <FullCalendar
              year={currentYear}
              month={currentMonth}
              planDayMap={planDayMap}
              workoutMap={workoutMap}
              selectedDate={selectedDate}
              onDayClick={handleDayClick}
            />
          ) : (
            <CalendarWeekView
              weekStart={currentWeekStart}
              planDayMap={planDayMap}
              workoutMap={workoutMap}
              selectedDate={selectedDate}
              onDayClick={handleDayClick}
            />
          )}
        </div>

        {/* Desktop detail panel (rendered inside grid) */}
        <CalendarDayDetail
          open={detailOpen}
          date={selectedDate}
          planDay={selectedPlanDay}
          workouts={selectedWorkouts}
          planId={activePlan?.id ?? null}
          onClose={() => setSelectedDate(null)}
        />
      </div>
    </div>
  );
}
