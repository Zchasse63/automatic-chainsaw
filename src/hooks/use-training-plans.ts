import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TrainingPlan {
  id: string;
  plan_name: string;
  goal: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  duration_weeks: number | null;
  is_ai_generated: boolean | null;
  source_conversation_id: string | null;
  created_at: string;
}

interface TrainingPlanDay {
  id: string;
  day_of_week: number;
  session_type: string | null;
  workout_title: string | null;
  workout_description: string | null;
  workout_details: Record<string, unknown> | null;
  estimated_duration_minutes: number | null;
  is_rest_day: boolean | null;
  is_completed: boolean | null;
  linked_workout_log_id: string | null;
  notes: string | null;
}

interface TrainingPlanWeek {
  id: string;
  week_number: number;
  focus: string | null;
  notes: string | null;
  target_volume_hours: number | null;
  training_plan_days: TrainingPlanDay[];
}

interface TrainingPlanDetail extends TrainingPlan {
  training_plan_weeks: TrainingPlanWeek[];
}

export function useTrainingPlans() {
  return useQuery<TrainingPlan[]>({
    queryKey: ['training-plans'],
    queryFn: async () => {
      const res = await fetch('/api/training-plans');
      if (!res.ok) throw new Error('Failed to load training plans');
      const data = await res.json();
      return data.plans;
    },
  });
}

export function useTrainingPlan(id: string | null) {
  return useQuery<TrainingPlanDetail>({
    queryKey: ['training-plan', id],
    queryFn: async () => {
      const res = await fetch(`/api/training-plans/${id}`);
      if (!res.ok) throw new Error('Failed to load training plan');
      const data = await res.json();
      return data.plan;
    },
    enabled: !!id,
  });
}

export function useActiveTrainingPlan() {
  const { data: plans, ...rest } = useTrainingPlans();
  const activePlan = plans?.find((p) => p.status === 'active') ?? null;
  return { activePlan, plans, ...rest };
}

interface CreateTrainingPlanInput {
  plan_name: string;
  goal?: string;
  duration_weeks: number;
  start_date?: string;
  end_date?: string;
  source_conversation_id?: string;
  is_ai_generated?: boolean;
  weeks?: {
    week_number: number;
    focus?: string;
    notes?: string;
    target_volume_hours?: number;
    days: {
      day_of_week: number;
      session_type?: string;
      workout_title?: string;
      workout_description?: string;
      workout_details?: Record<string, unknown>;
      estimated_duration_minutes?: number;
      is_rest_day?: boolean;
    }[];
  }[];
}

export function useCreateTrainingPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTrainingPlanInput) => {
      const res = await fetch('/api/training-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create training plan');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdatePlanDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      planId,
      dayId,
      data,
    }: {
      planId: string;
      dayId: string;
      data: Partial<TrainingPlanDay>;
    }) => {
      const res = await fetch(
        `/api/training-plans/${planId}/days/${dayId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error('Failed to update plan day');
      return res.json();
    },
    onSuccess: () => {
      // ['training-plans'] refreshes the plan list; ['training-plan'] prefix-matches all ['training-plan', id] detail queries
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
      queryClient.invalidateQueries({ queryKey: ['training-plan'] });
    },
  });
}
