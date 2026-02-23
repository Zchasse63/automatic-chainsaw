import { useMutation, useQueryClient } from '@tanstack/react-query';

interface RescheduleInput {
  workoutId: string;
  newDate: string; // YYYY-MM-DD
}

/**
 * Mutation to reschedule a workout by updating its date.
 * Uses optimistic update for instant visual feedback during drag-drop.
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
    onSuccess: () => {
      // Invalidate all workout queries so calendar and log refresh
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
