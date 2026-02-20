'use client';

import { useBenchmarks } from '@/hooks/use-performance';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
} from 'recharts';

const STATION_COLORS = [
  '#3B82F6', // SkiErg - blue
  '#EF4444', // Sled Push - red
  '#F97316', // Sled Pull - orange
  '#10B981', // Burpee Broad Jump - green
  '#8B5CF6', // Rowing - purple
  '#EC4899', // Farmers Carry - pink
  '#14B8A6', // Sandbag Lunges - teal
  '#F59E0B', // Wall Balls - amber
];

interface Station {
  id: string;
  station_name: string;
  station_number: number;
}

export function StationComparisonChart() {
  const { data: benchmarks = [] } = useBenchmarks();
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: async () => {
      const res = await fetch('/api/stations');
      if (!res.ok) return [];
      const data = await res.json();
      return data.stations;
    },
  });

  // Map station benchmarks — use best time/result for each station
  const chartData = stations
    .map((station) => {
      const stationBenchmarks = benchmarks.filter(
        (b) => b.station_id === station.id
      );
      if (stationBenchmarks.length === 0) return null;

      // Try to find a time-based result
      const results = stationBenchmarks[0]?.results as Record<string, unknown> | null;
      const timeSeconds = results?.time_seconds as number | undefined;

      return {
        name: station.station_name.replace(/\s+/g, '\n'),
        shortName: station.station_name.split(' ').map(w => w[0]).join(''),
        value: timeSeconds ?? 0,
        stationNumber: station.station_number,
      };
    })
    .filter(Boolean) as Array<{ name: string; shortName: string; value: number; stationNumber: number }>;

  if (chartData.length === 0) {
    return (
      <p className="font-body text-xs text-text-tertiary text-center py-6">
        Log station benchmarks to see your performance across all 8 Hyrox stations.
      </p>
    );
  }

  return (
    <div>
      <p className="font-display text-[10px] uppercase tracking-widest text-text-tertiary mb-2">
        Station Times (seconds)
      </p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
            />
            <YAxis
              type="category"
              dataKey="shortName"
              tick={{ fontSize: 9, fill: 'var(--color-text-tertiary)' }}
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
              formatter={((value: any) => [`${value ?? 0}s`, 'Time']) as any}
              labelFormatter={(_, payload) => {
                const item = payload?.[0]?.payload;
                return item?.name?.replace(/\n/g, ' ') || '';
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.stationNumber}
                  fill={STATION_COLORS[(entry.stationNumber - 1) % STATION_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
