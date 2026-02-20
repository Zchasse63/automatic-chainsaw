'use client';

import { usePersonalRecords } from '@/hooks/use-performance';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';

export function PrTrendChart() {
  const { data: records = [] } = usePersonalRecords();

  if (records.length < 2) {
    return (
      <p className="font-body text-xs text-text-tertiary text-center py-6">
        Log more PRs to see trends over time.
      </p>
    );
  }

  // Group records by exercise name and sort by date
  const exerciseMap = new Map<string, Array<{ date: string; value: number }>>();
  for (const pr of records) {
    const key = pr.exercise_name || pr.record_type;
    if (!exerciseMap.has(key)) exerciseMap.set(key, []);
    exerciseMap.get(key)!.push({
      date: pr.date_achieved,
      value: pr.value,
    });
  }

  // Find the exercise with the most data points
  let bestExercise = '';
  let maxPoints = 0;
  for (const [name, points] of exerciseMap.entries()) {
    if (points.length > maxPoints) {
      maxPoints = points.length;
      bestExercise = name;
    }
  }

  const chartData = (exerciseMap.get(bestExercise) ?? [])
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => ({
      date: p.date.slice(5), // MM-DD
      value: p.value,
    }));

  if (chartData.length < 2) {
    return (
      <p className="font-body text-xs text-text-tertiary text-center py-6">
        Need more data points for {bestExercise} to show a trend.
      </p>
    );
  }

  const unit = records.find((r) => (r.exercise_name || r.record_type) === bestExercise)?.value_unit || '';

  return (
    <div>
      <p className="font-display text-[10px] uppercase tracking-widest text-text-tertiary mb-2">
        {bestExercise} ({unit})
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
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
              formatter={((value: any) => [`${value ?? 0} ${unit}`, bestExercise]) as any}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#D4E600"
              strokeWidth={2}
              dot={{ r: 3, fill: '#D4E600' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
