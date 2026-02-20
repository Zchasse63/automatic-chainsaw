'use client';

import { useWorkouts } from '@/hooks/use-workouts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

const SESSION_COLORS: Record<string, string> = {
  run: '#3B82F6',
  hiit: '#EF4444',
  strength: '#F97316',
  simulation: '#D4E600',
  recovery: '#10B981',
  station_practice: '#8B5CF6',
  general: '#6B7280',
};

const SESSION_LABELS: Record<string, string> = {
  run: 'Run',
  hiit: 'HIIT',
  strength: 'Strength',
  simulation: 'Sim',
  recovery: 'Recovery',
  station_practice: 'Station',
  general: 'General',
};

export function VolumeByTypeChart() {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: workouts = [] } = useWorkouts({ from: sixtyDaysAgo, limit: 50 });

  if (workouts.length < 3) {
    return (
      <p className="font-body text-xs text-text-tertiary text-center py-6">
        Log more workouts to see volume by type.
      </p>
    );
  }

  // Group workouts by week and session type
  const weekMap = new Map<string, Record<string, number>>();
  const allTypes = new Set<string>();

  for (const w of workouts) {
    const d = new Date(w.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday start
    const key = weekStart.toISOString().split('T')[0];
    const type = w.session_type || 'general';
    allTypes.add(type);

    if (!weekMap.has(key)) weekMap.set(key, {});
    const week = weekMap.get(key)!;
    week[type] = (week[type] ?? 0) + (w.duration_minutes ?? 0);
  }

  const chartData = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, types]) => ({
      week: week.slice(5), // MM-DD
      ...types,
    }));

  if (chartData.length < 2) {
    return (
      <p className="font-body text-xs text-text-tertiary text-center py-6">
        Need more weeks of data to show volume trends.
      </p>
    );
  }

  const activeTypes = Array.from(allTypes);

  return (
    <div>
      <p className="font-display text-[10px] uppercase tracking-widest text-text-tertiary mb-2">
        Weekly Volume by Type (minutes)
      </p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
              width={32}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface-2)',
                border: '1px solid var(--color-border-default)',
                borderRadius: '4px',
              }}
              labelStyle={{ color: 'var(--color-text-secondary)', fontSize: 11 }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((value: any, name: any) => [
                `${value ?? 0} min`,
                SESSION_LABELS[name] || name,
              ]) as any}
            />
            <Legend
              formatter={(value: string) => SESSION_LABELS[value] || value}
              wrapperStyle={{ fontSize: 10 }}
            />
            {activeTypes.map((type) => (
              <Bar
                key={type}
                dataKey={type}
                stackId="volume"
                fill={SESSION_COLORS[type] || '#6B7280'}
                radius={[0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
