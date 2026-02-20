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
  Flag,
  LayoutGrid,
  CalendarRange,
  Plus,
  MessageSquare,
  CalendarCheck,
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarPage() {
  const today = new Date();
  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getCurrentWeekStart);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Date range: union of month grid + current week
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

  // Plan progress
  const totalDays =
    planDetail?.training_plan_weeks?.reduce(
      (sum, w) => sum + (w.training_plan_days?.length ?? 0),
      0
    ) ?? 0;
  const completedDays =
    planDetail?.training_plan_weeks?.reduce(
      (sum, w) =>
        sum +
        (w.training_plan_days?.filter((d) => d.is_completed)?.length ?? 0),
      0
    ) ?? 0;
  const progressPct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  // Check if we're viewing the current month/week
  const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth();
  const isCurrentWeek = (() => {
    const now = getCurrentWeekStart();
    return currentWeekStart.getTime() === now.getTime();
  })();
  const showTodayButton = view === 'month' ? !isCurrentMonth : !isCurrentWeek;

  function goToToday() {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setCurrentWeekStart(getCurrentWeekStart());
    setSelectedDate(toISODateString(now));
  }

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
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-text-primary flex-1">
          Calendar
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/training/simulation">
            <Button
              size="sm"
              variant="outline"
              className="border-hyrox-yellow text-hyrox-yellow hover:bg-hyrox-yellow/10 font-display uppercase tracking-wider text-xs"
            >
              <Flag className="h-4 w-4 mr-1" />
              Simulate
            </Button>
          </Link>
          <Link href="/training/log">
            <Button
              size="sm"
              className="bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider text-xs"
            >
              <Plus className="h-4 w-4 mr-1" />
              Log
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Plan Info */}
      {activePlan && planDetail && (
        <div className="bg-surface-1 border border-border-default rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-text-primary truncate">
                {activePlan.plan_name}
              </h3>
              {activePlan.goal && (
                <p className="font-body text-xs text-text-secondary mt-0.5 truncate">
                  {activePlan.goal}
                </p>
              )}
            </div>
            <div className="text-right shrink-0 ml-3">
              <span className="font-mono text-xs text-text-tertiary">
                {completedDays}/{totalDays} sessions
              </span>
            </div>
          </div>
          <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-hyrox-yellow rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-mono text-[10px] text-text-tertiary">
              {progressPct}% complete
            </span>
            <Link
              href={`/coach?context=plan&planName=${encodeURIComponent(activePlan.plan_name)}`}
              className="flex items-center gap-1 font-display text-[10px] uppercase tracking-wider text-hyrox-yellow hover:text-hyrox-yellow-hover transition-colors"
            >
              <MessageSquare className="h-3 w-3" />
              Ask Coach K
            </Link>
          </div>
        </div>
      )}

      {/* No plan CTA */}
      {!activePlan && (
        <div className="bg-surface-1 border border-border-default rounded-lg p-4 text-center">
          <p className="font-body text-sm text-text-secondary mb-2">
            No active training plan
          </p>
          <Link href="/coach">
            <Button
              variant="outline"
              size="sm"
              className="border-hyrox-yellow text-hyrox-yellow hover:bg-hyrox-yellow/10 font-display uppercase tracking-wider text-xs"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Ask Coach K
            </Button>
          </Link>
        </div>
      )}

      {/* View toggle + Today button + Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={view === 'month' ? prevMonth : prevWeek}
            className="p-1.5 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="font-display text-sm font-bold uppercase tracking-widest text-text-primary min-w-[140px] text-center">
            {view === 'month'
              ? `${MONTH_NAMES[currentMonth]} ${currentYear}`
              : (() => {
                  const we = new Date(currentWeekStart);
                  we.setDate(currentWeekStart.getDate() + 6);
                  return `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                })()}
          </span>

          <button
            onClick={view === 'month' ? nextMonth : nextWeek}
            className="p-1.5 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {showTodayButton && (
            <button
              onClick={goToToday}
              className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-display uppercase tracking-wider text-hyrox-yellow hover:bg-hyrox-yellow/10 transition-colors"
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              Today
            </button>
          )}
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

        {/* Desktop detail panel */}
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
