import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showAchievementToast } from '@/components/achievements/achievement-toast';

interface Workout {
  id: string;
  date: string;
  session_type: string;
  duration_minutes: number | null;
  rpe_post: number | null;
  notes: string | null;
  completion_status: string | null;
  training_plan_day_id: string | null;
}

interface WorkoutParams {
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
}

export function useWorkouts(params: WorkoutParams = {}) {
  const { limit = 20, offset, from, to } = params;
  return useQuery<Workout[]>({
    // React Query v5 uses structuralSharing by default — object params are deep-compared, preventing unnecessary refetches
    queryKey: ['workouts', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (limit) searchParams.set('limit', String(limit));
      if (offset) searchParams.set('offset', String(offset));
      if (from) searchParams.set('from', from);
      if (to) searchParams.set('to', to);

      const res = await fetch(`/api/workouts?${searchParams}`);
      if (!res.ok) throw new Error('Failed to load workouts');
      const data = await res.json();
      return data.workouts;
    },
  });
}

interface CreateWorkoutInput {
  date: string;
  session_type: string;
  duration_minutes?: number;
  rpe_pre?: number;
  rpe_post?: number;
  notes?: string;
  training_plan_day_id?: string;
  completed_workout?: Record<string, unknown>;
  prescribed_workout?: Record<string, unknown>;
}

interface CreateWorkoutResponse {
  workout: Workout;
  newAchievements?: string[];
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation<CreateWorkoutResponse, Error, CreateWorkoutInput>({
    mutationFn: async (input: CreateWorkoutInput) => {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to log workout');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      if (data.newAchievements && data.newAchievements.length > 0) {
        for (const name of data.newAchievements) {
          showAchievementToast(name, 'Achievement unlocked!');
        }
      }
    },
  });
}
