import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface AthleteProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  date_of_birth: string | null;
  sex: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  hyrox_division: string | null;
  hyrox_race_count: number | null;
  race_date: string | null;
  goal_time_minutes: number | null;
  weekly_availability_hours: number | null;
  current_phase: string | null;
  equipment_available: string[] | null;
  injuries_limitations: string[] | null;
  training_history: Record<string, unknown> | null;
  preferences: Record<string, unknown> | null;
  units_preference: string | null;
  profile_complete: boolean | null;
}

export function useProfile() {
  return useQuery<AthleteProfile | null>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      return data.profile ?? null;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation<AthleteProfile, Error, Partial<AthleteProfile>>({
    mutationFn: async (updates) => {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }
      const data = await res.json();
      return data.profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
