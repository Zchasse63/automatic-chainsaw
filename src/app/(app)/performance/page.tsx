'use client';

import {
  BarChart3,
  ChevronRight,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { useBenchmarks, usePersonalRecords } from '@/hooks/use-performance';
import { useQuery } from '@tanstack/react-query';
import { BenchmarkEntry } from '@/components/training/benchmark-entry';
import { RaceResultsEntry } from '@/components/training/race-results-entry';
import { PrTrendChart } from '@/components/performance/pr-trend-chart';
import { StationComparisonChart } from '@/components/performance/station-comparison-chart';
import { VolumeByTypeChart } from '@/components/performance/volume-by-type-chart';

interface Station {
  id: string;
  station_name: string;
  station_number: number;
  distance_or_reps: string | null;
}

export default function PerformancePage() {
  const { data: records = [], isLoading: recordsLoading } = usePersonalRecords();
  const { data: benchmarks = [], isLoading: benchmarksLoading } = useBenchmarks();
  const { data: stations = [], isLoading: stationsLoading } = useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: async () => {
      const res = await fetch('/api/stations');
      if (!res.ok) return [];
      const data = await res.json();
      return data.stations;
    },
  });

  const [tab, setTab] = useState<'overview' | 'stations' | 'benchmarks'>(
    'overview'
  );

  const loading = recordsLoading || benchmarksLoading || stationsLoading;

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'stations' as const, label: 'Stations' },
    { key: 'benchmarks' as const, label: 'Benchmarks' },
  ];

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-48 bg-surface-2 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-surface-1 border border-border-default rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-text-primary">
          Performance
        </h1>
        <div className="flex gap-2">
          <BenchmarkEntry />
          <RaceResultsEntry />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface-1 border border-border-default rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-md font-display text-xs uppercase tracking-wider transition-colors ${
              tab === t.key
                ? 'bg-hyrox-yellow text-text-inverse'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* PR Trend Chart */}
          <section className="bg-surface-1 border border-border-default rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-hyrox-yellow" />
              <h2 className="font-display text-sm uppercase tracking-widest text-text-tertiary">
                PR Trends
              </h2>
            </div>
            <PrTrendChart />
          </section>

          {/* Volume by Type Chart */}
          <section className="bg-surface-1 border border-border-default rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-hyrox-yellow" />
              <h2 className="font-display text-sm uppercase tracking-widest text-text-tertiary">
                Training Volume
              </h2>
            </div>
            <VolumeByTypeChart />
          </section>

          {/* PR Board */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-hyrox-yellow" />
              <h2 className="font-display text-sm uppercase tracking-widest text-text-tertiary">
                Personal Records
              </h2>
            </div>
            {records.length === 0 ? (
              <div className="bg-surface-1 border border-border-default rounded-lg p-8 text-center">
                <Trophy className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
                <p className="font-body text-sm text-text-secondary">
                  No PRs recorded yet. Log workouts and benchmarks to track
                  progress.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {records.map((pr) => (
                  <div
                    key={pr.id}
                    className="bg-surface-1 border border-border-default rounded-lg px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-body text-sm text-text-primary">
                        {pr.exercise_name || pr.record_type}
                      </p>
                      <p className="font-mono text-xs text-text-tertiary">
                        {new Date(pr.date_achieved).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg text-hyrox-yellow">
                        {pr.value} {pr.value_unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Stations Tab */}
      {tab === 'stations' && (
        <div className="space-y-6">
          {/* Station Comparison Chart */}
          <section className="bg-surface-1 border border-border-default rounded-lg p-4">
            <StationComparisonChart />
          </section>

          {/* Station list */}
          <div className="space-y-3">
          {stations.map((station) => {
            const stationBenchmarks = benchmarks.filter(
              (b) => b.station_id === station.id
            );
            const bestBenchmark = stationBenchmarks[0];

            return (
              <div
                key={station.id}
                className="bg-surface-1 border border-border-default rounded-lg px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-text-tertiary">
                        #{station.station_number}
                      </span>
                      <h3 className="font-display text-sm font-bold text-text-primary">
                        {station.station_name}
                      </h3>
                    </div>
                    {station.distance_or_reps && (
                      <p className="font-body text-xs text-text-tertiary mt-0.5">
                        {station.distance_or_reps}
                      </p>
                    )}
                  </div>
                  {bestBenchmark ? (
                    <div className="text-right">
                      <p className="font-mono text-sm text-hyrox-yellow">
                        {bestBenchmark.test_type}
                      </p>
                      <p className="font-mono text-[10px] text-text-tertiary">
                        {new Date(bestBenchmark.test_date).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <span className="font-body text-xs text-text-tertiary">
                      No data
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Benchmarks Tab */}
      {tab === 'benchmarks' && (
        <div className="space-y-3">
          {benchmarks.length === 0 ? (
            <div className="bg-surface-1 border border-border-default rounded-lg p-8 text-center">
              <BarChart3 className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
              <p className="font-body text-sm text-text-secondary">
                No benchmarks recorded yet
              </p>
            </div>
          ) : (
            benchmarks.map((b) => (
              <div
                key={b.id}
                className="bg-surface-1 border border-border-default rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-body text-sm text-text-primary">
                    {b.test_type}
                  </p>
                  <p className="font-mono text-xs text-text-tertiary">
                    {new Date(b.test_date).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-text-tertiary" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
