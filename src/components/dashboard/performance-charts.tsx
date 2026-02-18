'use client';

import { useWorkouts } from '@/hooks/use-workouts';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';

export function RpeTrendChart() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: workouts = [] } = useWorkouts({ from: thirtyDaysAgo, limit: 50 });

  const chartData = workouts
    .filter((w) => w.rpe_post)
    .map((w) => ({
      date: w.date.slice(5), // MM-DD
      rpe: w.rpe_post,
    }))
    .reverse();

  if (chartData.length < 2) {
    return <p className="font-body text-xs text-text-tertiary">Not enough data for RPE trend.</p>;
  }

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} />
          <YAxis domain={[1, 10]} tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} width={24} />
          <RechartsTooltip
            contentStyle={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border-default)', borderRadius: '4px' }}
            labelStyle={{ color: 'var(--color-text-secondary)', fontSize: 11 }}
          />
          <Line type="monotone" dataKey="rpe" stroke="#D4E600" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyVolumeChart() {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: workouts = [] } = useWorkouts({ from: sixtyDaysAgo, limit: 50 });

  // Group by week
  const weekMap = new Map<string, number>();
  for (const w of workouts) {
    const d = new Date(w.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    weekMap.set(key, (weekMap.get(key) ?? 0) + (w.duration_minutes ?? 0));
  }

  const chartData = Array.from(weekMap.entries())
    .map(([week, minutes]) => ({
      week: week.slice(5),
      hours: Math.round((minutes / 60) * 10) / 10,
    }))
    .reverse();

  if (chartData.length < 2) {
    return <p className="font-body text-xs text-text-tertiary">Not enough data for volume chart.</p>;
  }

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} width={24} />
          <RechartsTooltip
            contentStyle={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border-default)', borderRadius: '4px' }}
            labelStyle={{ color: 'var(--color-text-secondary)', fontSize: 11 }}
          />
          <Bar dataKey="hours" fill="#D4E600" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
