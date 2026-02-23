import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toISODateString } from '@/lib/calendar-utils';

/**
 * Unified calendar item — merges workout_logs + training_plan_days
 * from the /api/calendar-data endpoint.
 */
export interface CalendarItem {
  id: string;
  date: string;
  session_type: string;
  title: string | null;
  description: string | null;
  duration_minutes: number | null;
  rpe_post: number | null;
  notes: string | null;
  completion_status: string | null;
  source: 'planned' | 'logged' | 'both';
  is_rest_day: boolean;
  training_plan_day_id: string | null;
  total_volume_kg: number | null;
  total_distance_km: number | null;
  training_load: number | null;
}

async function fetchCalendarData(from: string, to: string): Promise<CalendarItem[]> {
  const res = await fetch(`/api/calendar-data?from=${from}&to=${to}`);
  if (!res.ok) {
    throw new Error('Failed to fetch calendar data');
  }
  const json = await res.json();
  return json.items ?? [];
}

/**
 * Fetches merged calendar data (planned + logged workouts) for a month.
 * Returns items grouped by YYYY-MM-DD date key.
 */
export function useCalendarData(year: number, month: number) {
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = new Date(year, month + 1, 0);
  const to = toISODateString(endDate);

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['calendar-data', from, to],
    queryFn: () => fetchCalendarData(from, to),
    staleTime: 30_000,
  });

  const grouped = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    if (!items) return map;
    for (const item of items) {
      const key = item.date;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, [items]);

  return { grouped, items: items ?? [], isLoading, error };
}

/**
 * Fetches merged calendar data (planned + logged workouts) for a week.
 * Returns items grouped by YYYY-MM-DD date key.
 */
export function useWeekCalendarData(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const from = toISODateString(weekStart);
  const to = toISODateString(weekEnd);

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['calendar-data', from, to],
    queryFn: () => fetchCalendarData(from, to),
    staleTime: 30_000,
  });

  const grouped = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    if (!items) return map;
    for (const item of items) {
      const key = item.date;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, [items]);

  return { grouped, items: items ?? [], isLoading, error };
}
