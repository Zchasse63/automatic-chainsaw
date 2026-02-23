import { useMemo } from 'react';
import { useWorkouts } from './use-workouts';

export interface CalendarWorkout {
  id: string;
  date: string;
  session_type: string;
  duration_minutes: number | null;
  rpe_post: number | null;
  notes: string | null;
  completion_status: string | null;
  training_plan_day_id: string | null;
  total_volume_kg: number | null;
  total_distance_km: number | null;
  training_load: number | null;
}

/**
 * Fetches workouts for a given month and groups them by date (YYYY-MM-DD).
 */
export function useCalendarWorkouts(year: number, month: number) {
  // month is 0-indexed (0=Jan, 11=Dec) to match JS Date convention
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;

  // End of month: go to next month day 0
  const endDate = new Date(year, month + 1, 0);
  const to = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  const { data: workouts, isLoading, error } = useWorkouts({
    from,
    to,
    limit: 100,
  });

  const grouped = useMemo(() => {
    const map: Record<string, CalendarWorkout[]> = {};
    if (!workouts) return map;
    for (const w of workouts) {
      const dateKey = w.date.split('T')[0]; // normalize to YYYY-MM-DD
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(w);
    }
    return map;
  }, [workouts]);

  return { grouped, workouts: workouts ?? [], isLoading, error };
}
