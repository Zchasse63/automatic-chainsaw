'use client';

import { useQuery } from '@tanstack/react-query';

interface ReadinessData {
  score: number;
  components: Record<string, number>;
  weakest: string;
}

export function RaceReadiness() {
  const { data } = useQuery<ReadinessData>({
    queryKey: ['race-readiness'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/readiness');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const score = data?.score ?? 0;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#D4E600' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="bg-surface-1 border border-border-default rounded-lg p-4">
      <p className="font-display text-xs uppercase tracking-wider text-text-secondary mb-3">
        Race Readiness
      </p>
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-surface-2)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r={radius}
              fill="none" stroke={color} strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-2xl font-bold text-text-primary">{score}</span>
          </div>
        </div>
        {data?.components && (
          <div className="flex-1 space-y-1">
            {Object.entries(data.components).slice(0, 5).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="font-body text-text-secondary capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="font-mono text-text-primary">{val}%</span>
              </div>
            ))}
            {data.weakest && (
              <p className="font-body text-[10px] text-semantic-error mt-1">
                Focus: {data.weakest.replace(/_/g, ' ')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
