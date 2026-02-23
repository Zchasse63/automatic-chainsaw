import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface DailyMetric {
  id: string;
  date: string;
  hrv_ms: number | null;
  rhr_bpm: number | null;
  sleep_hours: number | null;
  stress_score: number | null;
  recovery_score: number | null;
  readiness_score: number | null;
  notes: string | null;
  source: string | null;
}

interface DailyMetricsParams {
  from?: string;
  to?: string;
  limit?: number;
}

export function useDailyMetrics(params: DailyMetricsParams = {}) {
  const { from, to, limit } = params;
  return useQuery<DailyMetric[]>({
    queryKey: ['daily-metrics', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (from) searchParams.set('from', from);
      if (to) searchParams.set('to', to);
      if (limit) searchParams.set('limit', String(limit));

      const res = await fetch(`/api/daily-metrics?${searchParams}`);
      if (!res.ok) throw new Error('Failed to load daily metrics');
      const json = await res.json();
      return json.metrics;
    },
  });
}

interface CreateDailyMetricInput {
  date: string;
  hrv_ms?: number;
  rhr_bpm?: number;
  sleep_hours?: number;
  stress_score?: number;
  recovery_score?: number;
  readiness_score?: number;
  notes?: string;
  source?: string;
}

export function useCreateDailyMetric() {
  const queryClient = useQueryClient();
  return useMutation<DailyMetric, Error, CreateDailyMetricInput>({
    mutationFn: async (input: CreateDailyMetricInput) => {
      const res = await fetch('/api/daily-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save daily metric');
      }
      const json = await res.json();
      return json.metric;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
