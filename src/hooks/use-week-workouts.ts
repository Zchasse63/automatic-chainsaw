import { useMemo } from 'react';
import { useWorkouts } from './use-workouts';
import { toISODateString } from '@/lib/calendar-utils';
import type { CalendarWorkout } from './use-calendar-workouts';

/**
 * Fetches workouts for a given week (Mon-Sun) and groups them by date.
 */
export function useWeekWorkouts(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const from = toISODateString(weekStart);
  const to = toISODateString(weekEnd);

  const { data: workouts, isLoading, error } = useWorkouts({
    from,
    to,
    limit: 50,
  });

  const grouped = useMemo(() => {
    const map: Record<string, CalendarWorkout[]> = {};
    if (!workouts) return map;
    for (const w of workouts) {
      const dateKey = w.date.split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(w);
    }
    return map;
  }, [workouts]);

  return { grouped, workouts: workouts ?? [], isLoading, error };
}
