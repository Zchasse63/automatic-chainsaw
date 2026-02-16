'use client';

import { Button } from '@/components/ui/button';
import {
  BarChart3,
  ChevronRight,
  Plus,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface PR {
  id: string;
  record_type: string;
  exercise_name: string | null;
  station_id: string | null;
  value: number;
  value_unit: string;
  date_achieved: string;
  previous_value: number | null;
}

interface Benchmark {
  id: string;
  test_type: string;
  station_id: string | null;
  results: Record<string, unknown>;
  test_date: string;
  notes: string | null;
}

interface Station {
  id: string;
  name: string;
  station_order: number;
  distance_or_reps: string | null;
}

export default function PerformancePage() {
  const [records, setRecords] = useState<PR[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'stations' | 'benchmarks'>(
    'overview'
  );

  useEffect(() => {
    async function load() {
      const [prRes, bRes, sRes] = await Promise.all([
        fetch('/api/personal-records'),
        fetch('/api/benchmarks'),
        fetch('/api/stations'),
      ]);
      if (prRes.ok) setRecords((await prRes.json()).records);
      if (bRes.ok) setBenchmarks((await bRes.json()).benchmarks);
      if (sRes.ok) setStations((await sRes.json()).stations);
      setLoading(false);
    }
    load();
  }, []);

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
      <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-text-primary">
        Performance
      </h1>

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
                      {pr.previous_value && (
                        <p className="font-mono text-[10px] text-semantic-success">
                          <TrendingUp className="h-3 w-3 inline mr-0.5" />
                          from {pr.previous_value}
                        </p>
                      )}
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
                        #{station.station_order}
                      </span>
                      <h3 className="font-display text-sm font-bold text-text-primary">
                        {station.name}
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
      )}

      {/* Benchmarks Tab */}
      {tab === 'benchmarks' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="border-hyrox-yellow text-hyrox-yellow hover:bg-hyrox-yellow/10 font-display uppercase tracking-wider text-xs"
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Benchmark
            </Button>
          </div>
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
