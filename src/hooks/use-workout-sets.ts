import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface WorkoutSet {
  id: string;
  workout_log_id: string;
  exercise_name: string;
  exercise_category: string | null;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  pace: string | null;
  status: string | null;
  rpe: number | null;
  notes: string | null;
}

export function useWorkoutSets(workoutLogId: string | undefined) {
  return useQuery<WorkoutSet[]>({
    queryKey: ['workout-sets', workoutLogId],
    queryFn: async () => {
      const res = await fetch(`/api/workout-sets?workout_log_id=${workoutLogId}`);
      if (!res.ok) throw new Error('Failed to load workout sets');
      const json = await res.json();
      return json.sets;
    },
    enabled: !!workoutLogId,
  });
}

interface CreateWorkoutSetInput {
  workout_log_id: string;
  exercise_name: string;
  exercise_category?: string;
  set_number: number;
  reps?: number;
  weight_kg?: number;
  distance_meters?: number;
  duration_seconds?: number;
  pace?: string;
  status?: string;
  rpe?: number;
  notes?: string;
}

export function useCreateWorkoutSet() {
  const queryClient = useQueryClient();
  return useMutation<WorkoutSet, Error, CreateWorkoutSetInput>({
    mutationFn: async (input: CreateWorkoutSetInput) => {
      const res = await fetch('/api/workout-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create workout set');
      }
      const json = await res.json();
      return json.set;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workout-sets', variables.workout_log_id] });
    },
  });
}

interface UpdateWorkoutSetInput {
  id: string;
  workout_log_id: string; // Required for scoped cache invalidation
  exercise_name?: string;
  exercise_category?: string;
  set_number?: number;
  reps?: number;
  weight_kg?: number;
  distance_meters?: number;
  duration_seconds?: number;
  pace?: string;
  status?: string;
  rpe?: number;
  notes?: string;
}

export function useUpdateWorkoutSet() {
  const queryClient = useQueryClient();
  return useMutation<WorkoutSet, Error, UpdateWorkoutSetInput>({
    mutationFn: async ({ workout_log_id: _wlid, ...input }: UpdateWorkoutSetInput) => {
      const res = await fetch('/api/workout-sets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update workout set');
      }
      const json = await res.json();
      return json.set;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workout-sets', variables.workout_log_id] });
    },
  });
}
