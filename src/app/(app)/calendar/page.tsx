'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Calendar } from 'lucide-react';
import { MonthGrid } from '@/components/calendar/month-grid';
import { DayDetail } from '@/components/calendar/day-detail';
import { CalendarLegend } from '@/components/calendar/calendar-legend';
import { DraggableWorkout } from '@/components/calendar/draggable-workout';
import { useCalendarWorkouts } from '@/hooks/use-calendar-workouts';
import { useRescheduleWorkout } from '@/hooks/use-reschedule-workout';
import type { CalendarWorkout } from '@/hooks/use-calendar-workouts';

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<CalendarWorkout | null>(null);

  const { grouped, isLoading } = useCalendarWorkouts(year, month);
  const reschedule = useRescheduleWorkout();

  // Drag sensors with activation constraint to distinguish tap from drag
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

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

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate((prev) => {
      if (
        prev &&
        prev.getFullYear() === date.getFullYear() &&
        prev.getMonth() === date.getMonth() &&
        prev.getDate() === date.getDate()
      ) {
        return null; // Toggle off
      }
      return date;
    });
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.workout) {
      setActiveWorkout(data.workout as CalendarWorkout);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveWorkout(null);
      const { active, over } = event;
      if (!over || !active) return;

      const workoutData = active.data.current?.workout as CalendarWorkout | undefined;
      const targetDate = over.data.current?.date as string | undefined;

      if (!workoutData || !targetDate) return;

      // Don't reschedule to the same date
      const currentDate = workoutData.date.split('T')[0];
      if (currentDate === targetDate) return;

      reschedule.mutate({
        workoutId: workoutData.id,
        newDate: targetDate,
      });
    },
    [reschedule]
  );

  // Get workouts for selected date
  const selectedDateKey = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : null;
  const selectedWorkouts = selectedDateKey ? grouped[selectedDateKey] ?? [] : [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28 }}
      className="flex-1 overflow-y-auto px-6 pt-14 pb-32 bg-bg-deep min-h-screen"
    >
      {/* Header */}
      <header className="mb-6">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
          Training <span className="text-[#39FF14]">Calendar</span>
        </h2>
        <p className="text-white/40 text-sm mt-1">Plan &middot; Track &middot; Reschedule</p>
      </header>

      {/* Legend */}
      <div className="mb-5">
        <CalendarLegend />
      </div>

      {/* Calendar content */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Month Grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
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
              grouped={grouped}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
          )}
        </motion.div>

        {/* Day Detail (bottom sheet) */}
        <AnimatePresence>
          {selectedDate && (
            <DayDetail
              date={selectedDate}
              workouts={selectedWorkouts}
              onClose={() => setSelectedDate(null)}
            />
          )}
        </AnimatePresence>

        {/* Drag overlay */}
        <DragOverlay>
          {activeWorkout && (
            <div className="opacity-80 pointer-events-none">
              <DraggableWorkout workout={activeWorkout} index={0} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Empty state when no workouts this month */}
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
          <p className="text-sm text-white/40 font-bold">No workouts this month</p>
          <p className="text-xs text-white/20 mt-1">Logged workouts will appear here</p>
        </motion.div>
      )}
    </motion.div>
  );
}
