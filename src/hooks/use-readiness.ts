import { useQuery } from '@tanstack/react-query';

interface ReadinessData {
  score: number;
  components: Record<string, number>;
  weakest: string;
}

export function useReadiness() {
  return useQuery<ReadinessData>({
    queryKey: ['readiness'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/readiness');
      if (!res.ok) throw new Error('Failed to load readiness');
      return res.json();
    },
  });
}
