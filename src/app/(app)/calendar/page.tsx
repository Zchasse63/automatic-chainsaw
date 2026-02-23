'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Calendar } from 'lucide-react';
import { MonthGrid } from '@/components/calendar/month-grid';
import { WeekGrid } from '@/components/calendar/week-grid';
import { DayDetail } from '@/components/calendar/day-detail';
import { CalendarLegend } from '@/components/calendar/calendar-legend';
import { ViewToggle, type CalendarView } from '@/components/calendar/view-toggle';
import { DraggableWorkout } from '@/components/calendar/draggable-workout';
import { useCalendarData, useWeekCalendarData } from '@/hooks/use-calendar-data';
import type { CalendarItem } from '@/hooks/use-calendar-data';
import { useRescheduleWorkout } from '@/hooks/use-reschedule-workout';
import { getCurrentWeekStart, toISODateString } from '@/lib/calendar-utils';
import { QuickAddModal } from '@/components/calendar/quick-add-modal';

function getInitialView(): CalendarView {
  if (typeof window === 'undefined') return 'week';
  return (localStorage.getItem('calendar-view') as CalendarView) || 'week';
}

export default function CalendarPage() {
  const now = new Date();
  const [calendarView, setCalendarView] = useState<CalendarView>(getInitialView);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [weekStart, setWeekStart] = useState<Date>(getCurrentWeekStart);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<CalendarItem | null>(null);

  // Quick-add modal state
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null);

  const handleViewChange = useCallback((view: CalendarView) => {
    setCalendarView(view);
    localStorage.setItem('calendar-view', view);
    setSelectedDate(null);
  }, []);

  // Data hooks — both run so cache is warm when toggling
  const { grouped: monthGrouped, isLoading: monthLoading } = useCalendarData(year, month);
  const { grouped: weekGrouped, isLoading: weekLoading } = useWeekCalendarData(weekStart);

  const reschedule = useRescheduleWorkout();

  // Drag sensors with activation constraint to distinguish tap from drag
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  // Month navigation
  const handlePrevMonth = useCallback(() => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }, [month]);

  const handleNextMonth = useCallback(() => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }, [month]);

  // Week navigation
  const handlePrevWeek = useCallback(() => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate((prev) => {
      if (
        prev &&
        prev.getFullYear() === date.getFullYear() &&
        prev.getMonth() === date.getMonth() &&
        prev.getDate() === date.getDate()
      ) {
        return null;
      }
      return date;
    });
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.workout) {
      setActiveWorkout(data.workout as CalendarItem);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveWorkout(null);
      const { active, over } = event;
      if (!over || !active) return;

      const workoutData = active.data.current?.workout as CalendarItem | undefined;
      const targetDate = over.data.current?.date as string | undefined;

      if (!workoutData || !targetDate) return;

      // Only allow rescheduling logged workouts (not planned-only items)
      if (workoutData.source === 'planned') return;

      const currentDate = workoutData.date.split('T')[0];
      if (currentDate === targetDate) return;

      reschedule.mutate({
        workoutId: workoutData.id,
        newDate: targetDate,
      });
    },
    [reschedule]
  );

  // Handle quick-add from "+" buttons
  const handleAddWorkout = useCallback((dateKey: string) => {
    setQuickAddDate(dateKey);
  }, []);

  // Get workouts for selected date (month view)
  const selectedDateKey = selectedDate ? toISODateString(selectedDate) : null;
  const selectedWorkouts = selectedDateKey ? monthGrouped[selectedDateKey] ?? [] : [];

  const isLoading = calendarView === 'week' ? weekLoading : monthLoading;
  const grouped = calendarView === 'week' ? weekGrouped : monthGrouped;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28 }}
      className="flex-1 overflow-y-auto px-6 pt-6 pb-32 bg-bg-deep min-h-screen"
    >
      {/* Header */}
      <header className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
              Training <span className="text-[#39FF14]">Calendar</span>
            </h2>
            <p className="text-white/40 text-sm mt-1">Plan &middot; Track &middot; Reschedule</p>
          </div>
          <ViewToggle view={calendarView} onViewChange={handleViewChange} />
        </div>
      </header>

      {/* Legend */}
      <div className="mb-4">
        <CalendarLegend />
      </div>

      {/* Calendar content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait">
          {calendarView === 'week' ? (
            /* ── Week View ── */
            <motion.div
              key="week"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-bg-card rounded-3xl p-4 border border-white/5 mb-4"
            >
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-8 bg-white/5 rounded w-48 mx-auto" />
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="h-14 bg-white/3 rounded-2xl" />
                  ))}
                </div>
              ) : (
                <WeekGrid
                  weekStart={weekStart}
                  grouped={weekGrouped}
                  onPrevWeek={handlePrevWeek}
                  onNextWeek={handleNextWeek}
                  onAddWorkout={handleAddWorkout}
                />
              )}
            </motion.div>
          ) : (
            /* ── Month View ── */
            <motion.div
              key="month"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-bg-card rounded-3xl p-4 border border-white/5 mb-4"
            >
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-8 bg-white/5 rounded w-40 mx-auto" />
                  <div className="grid grid-cols-7 gap-1">
                    {[...Array(42)].map((_, i) => (
                      <div key={i} className="h-[52px] bg-white/3 rounded-xl" />
                    ))}
                  </div>
                </div>
              ) : (
                <MonthGrid
                  year={year}
                  month={month}
                  grouped={monthGrouped}
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Day Detail (bottom sheet — month view only) */}
        <AnimatePresence>
          {calendarView === 'month' && selectedDate && (
            <DayDetail
              date={selectedDate}
              workouts={selectedWorkouts}
              onClose={() => setSelectedDate(null)}
              onAddWorkout={handleAddWorkout}
            />
          )}
        </AnimatePresence>

        {/* Drag overlay */}
        <DragOverlay>
          {activeWorkout && (
            <div className="opacity-80 pointer-events-none">
              <DraggableWorkout
                workout={activeWorkout}
                index={0}
                compact={calendarView === 'week'}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Empty state when no workouts */}
      {!isLoading && Object.keys(grouped).length === 0 && !selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center py-8"
        >
          <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
            <Calendar size={24} className="text-white/20" />
          </div>
          <p className="text-sm text-white/40 font-bold">
            No workouts this {calendarView === 'week' ? 'week' : 'month'}
          </p>
          <p className="text-xs text-white/20 mt-1">Logged and planned workouts will appear here</p>
        </motion.div>
      )}

      {/* Quick-add workout modal */}
      <QuickAddModal
        dateKey={quickAddDate}
        onClose={() => setQuickAddDate(null)}
      />
    </motion.div>
  );
}
