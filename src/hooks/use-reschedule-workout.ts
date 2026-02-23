import { useMutation, useQueryClient } from '@tanstack/react-query';

interface RescheduleInput {
  workoutId: string;
  newDate: string; // YYYY-MM-DD
}

/**
 * Mutation to reschedule a workout by updating its date.
 * Uses optimistic update for instant visual feedback during drag-drop,
 * with rollback on error.
 */
export function useRescheduleWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workoutId, newDate }: RescheduleInput) => {
      const res = await fetch(`/api/workouts/${workoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reschedule workout');
      }
      return res.json();
    },
    onMutate: async ({ workoutId, newDate }) => {
      // Cancel in-flight fetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['workouts'] });
      await queryClient.cancelQueries({ queryKey: ['calendar-data'] });

      // Snapshot all workout + calendar queries for rollback
      const workoutSnapshot = queryClient.getQueriesData<unknown[]>({ queryKey: ['workouts'] });
      const calendarSnapshot = queryClient.getQueriesData<unknown[]>({ queryKey: ['calendar-data'] });

      // Optimistically update every cached workout list
      queryClient.setQueriesData<unknown[]>(
        { queryKey: ['workouts'] },
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((w) => {
            const workout = w as Record<string, unknown>;
            return workout.id === workoutId ? { ...workout, date: newDate } : w;
          });
        }
      );

      // Optimistically update calendar-data caches
      queryClient.setQueriesData<unknown[]>(
        { queryKey: ['calendar-data'] },
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((w) => {
            const item = w as Record<string, unknown>;
            return item.id === workoutId ? { ...item, date: newDate } : w;
          });
        }
      );

      return { workoutSnapshot, calendarSnapshot };
    },
    onError: (_err, _vars, context) => {
      // Rollback to snapshots on failure
      if (context?.workoutSnapshot) {
        for (const [key, value] of context.workoutSnapshot) {
          queryClient.setQueryData(key, value);
        }
      }
      if (context?.calendarSnapshot) {
        for (const [key, value] of context.calendarSnapshot) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSettled: () => {
      // Always refetch to ensure server state is authoritative
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-data'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
