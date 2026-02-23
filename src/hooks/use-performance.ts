import { useQuery } from '@tanstack/react-query';

interface BenchmarkResult {
  id: string;
  test_type: string;
  station_id: string | null;
  station_name: string | null;
  results: Record<string, unknown>;
  notes: string | null;
  test_date: string;
}

interface PersonalRecord {
  id: string;
  record_type: string;
  exercise_name: string;
  value: number;
  value_unit: string;
  date_achieved: string;
}

export function useBenchmarks(type?: string) {
  return useQuery<BenchmarkResult[]>({
    queryKey: ['benchmarks', type],
    queryFn: async () => {
      const params = type ? `?type=${type}` : '';
      const res = await fetch(`/api/benchmarks${params}`);
      if (!res.ok) throw new Error('Failed to load benchmarks');
      const data = await res.json();
      return data.benchmarks;
    },
  });
}

export function usePersonalRecords() {
  return useQuery<PersonalRecord[]>({
    queryKey: ['personal-records'],
    queryFn: async () => {
      const res = await fetch('/api/personal-records');
      if (!res.ok) throw new Error('Failed to load PRs');
      const data = await res.json();
      return data.records;
    },
  });
}

export function useRaces() {
  return useQuery({
    queryKey: ['races'],
    queryFn: async () => {
      const res = await fetch('/api/races');
      if (!res.ok) throw new Error('Failed to load races');
      const data = await res.json();
      return data.races;
    },
  });
}
