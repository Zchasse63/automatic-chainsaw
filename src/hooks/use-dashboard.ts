import { useQuery } from '@tanstack/react-query';

interface DashboardData {
  profile: {
    display_name: string | null;
    race_date: string | null;
    goal_time_minutes: number | null;
    current_phase: string | null;
    hyrox_division: string | null;
  };
  daysUntilRace: number | null;
  weeklyStats: {
    workouts: number;
    totalMinutes: number;
    avgRpe: number | null;
  };
  streak: number;
  recentPRs: Array<{
    id: string;
    record_type: string;
    exercise_name: string;
    value: number;
    value_unit: string;
    date_achieved: string;
  }>;
  goals: Array<{
    id: string;
    title: string;
    target_value: number | null;
    current_value: number | null;
    target_date: string | null;
    status: string;
  }>;
  lastConversation: {
    id: string;
    title: string | null;
    updated_at: string | null;
  } | null;
  activePlan?: {
    id: string;
    plan_name: string;
    currentWeek: number;
    totalWeeks: number;
    progressPct: number;
  } | null;
  todaysWorkout?: {
    id: string;
    session_type: string | null;
    workout_title: string | null;
    estimated_duration_minutes: number | null;
    is_completed: boolean | null;
  } | null;
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard');
      return res.json();
    },
  });
}
