'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useCreateWorkout } from '@/hooks/use-workouts';
import { Button } from '@/components/ui/button';
import { RpeSlider } from '@/components/training/rpe-slider';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Flag,
  Pause,
  Play,
  RotateCcw,
  Timer,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────

interface Station {
  id: string;
  station_name: string;
  station_number: number;
  distance_or_reps: string | null;
}

interface Split {
  type: 'run' | 'station';
  label: string;
  stationNumber?: number;
  distance?: string;
  time_ms: number;
}

type SimPhase = 'setup' | 'active' | 'transition' | 'logging' | 'results';

// ── Hyrox segments: run → station alternating ─────────────

function buildSegments(stations: Station[]) {
  const segments: Array<{
    type: 'run' | 'station';
    label: string;
    stationNumber?: number;
    distance?: string;
  }> = [];
  for (const station of stations) {
    segments.push({
      type: 'run',
      label: `Run ${station.station_number}`,
      distance: '1 km',
    });
    segments.push({
      type: 'station',
      label: station.station_name,
      stationNumber: station.station_number,
      distance: station.distance_or_reps ?? undefined,
    });
  }
  return segments;
}

// ── Timer hook (lean) ─────────────────────────────────────

function useSimTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef(0);
  const accRef = useRef(0);
  const rafRef = useRef(0);

  const tick = useCallback(() => {
    setElapsed(accRef.current + (performance.now() - startRef.current));
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (running) rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, tick]);

  const start = useCallback(() => {
    startRef.current = performance.now();
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    accRef.current += performance.now() - startRef.current;
    setRunning(false);
  }, []);

  const resume = useCallback(() => {
    startRef.current = performance.now();
    setRunning(true);
  }, []);

  const lap = useCallback(() => {
    const now = performance.now();
    const current = accRef.current + (now - startRef.current);
    return current;
  }, []);

  const reset = useCallback(() => {
    accRef.current = 0;
    startRef.current = 0;
    setElapsed(0);
    setRunning(false);
  }, []);

  return { elapsed, running, start, pause, resume, lap, reset };
}

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Station colors ────────────────────────────────────────

const STATION_COLORS: Record<number, string> = {
  1: 'bg-blue-600',    // SkiErg
  2: 'bg-red-600',     // Sled Push
  3: 'bg-orange-500',  // Sled Pull
  4: 'bg-green-600',   // Burpee Broad Jump
  5: 'bg-purple-600',  // Rowing
  6: 'bg-pink-600',    // Farmers Carry
  7: 'bg-teal-600',    // Sandbag Lunges
  8: 'bg-amber-500',   // Wall Balls
};

// ── Component ─────────────────────────────────────────────

export default function SimulationPage() {
  const router = useRouter();
  const createWorkout = useCreateWorkout();
  const timer = useSimTimer();

  const [phase, setPhase] = useState<SimPhase>('setup');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [splits, setSplits] = useState<Split[]>([]);
  const [rpe, setRpe] = useState(7);
  const [notes, setNotes] = useState('');
  const [segmentStartMs, setSegmentStartMs] = useState(0);

  const { data: stations = [], isLoading } = useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: async () => {
      const res = await fetch('/api/stations');
      if (!res.ok) return [];
      const data = await res.json();
      return data.stations;
    },
  });

  const segments = buildSegments(stations);
  const currentSegment = segments[currentIndex];
  const totalSegments = segments.length; // 16 (8 runs + 8 stations)
  const progressPct = totalSegments > 0 ? (currentIndex / totalSegments) * 100 : 0;

  function handleStart() {
    setPhase('active');
    setSegmentStartMs(0);
    timer.start();
  }

  function handleNextSegment() {
    const currentMs = timer.lap();
    const segmentMs = currentMs - segmentStartMs;

    const split: Split = {
      type: currentSegment.type,
      label: currentSegment.label,
      stationNumber: currentSegment.stationNumber,
      distance: currentSegment.distance,
      time_ms: segmentMs,
    };
    setSplits((prev) => [...prev, split]);

    if (currentIndex + 1 >= totalSegments) {
      // Race complete
      timer.pause();
      setPhase('logging');
      return;
    }

    setSegmentStartMs(currentMs);
    setCurrentIndex((i) => i + 1);

    // Brief transition screen
    setPhase('transition');
    setTimeout(() => setPhase('active'), 1500);
  }

  async function handleSubmit() {
    const totalMs = splits.reduce((sum, s) => sum + s.time_ms, 0);
    const durationMinutes = Math.round(totalMs / 60000);

    await createWorkout.mutateAsync({
      date: new Date().toISOString().split('T')[0],
      session_type: 'simulation',
      duration_minutes: durationMinutes,
      rpe_post: rpe,
      notes: notes || 'Hyrox race simulation',
      completed_workout: {
        type: 'hyrox_simulation',
        total_time_ms: totalMs,
        splits: splits.map((s) => ({
          type: s.type,
          label: s.label,
          time_ms: s.time_ms,
        })),
      },
    });
    setPhase('results');
  }

  // ── Loading ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-6 w-6 border-2 border-hyrox-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────

  if (phase === 'results') {
    const totalMs = splits.reduce((sum, s) => sum + s.time_ms, 0);
    const runSplits = splits.filter((s) => s.type === 'run');
    const stationSplits = splits.filter((s) => s.type === 'station');
    const totalRun = runSplits.reduce((sum, s) => sum + s.time_ms, 0);
    const totalStation = stationSplits.reduce((sum, s) => sum + s.time_ms, 0);

    return (
      <div className="min-h-screen bg-surface-0 px-4 py-8">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="text-center space-y-2">
            <Flag className="h-12 w-12 text-hyrox-yellow mx-auto" />
            <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-text-primary">
              Simulation Complete
            </h1>
            <p className="font-mono text-4xl font-bold text-hyrox-yellow">
              {formatTime(totalMs)}
            </p>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-1 border border-border-default rounded-lg p-3 text-center">
              <p className="font-mono text-sm text-text-primary">{formatTime(totalRun)}</p>
              <p className="font-body text-[10px] text-text-tertiary uppercase">Running</p>
            </div>
            <div className="bg-surface-1 border border-border-default rounded-lg p-3 text-center">
              <p className="font-mono text-sm text-text-primary">{formatTime(totalStation)}</p>
              <p className="font-body text-[10px] text-text-tertiary uppercase">Stations</p>
            </div>
            <div className="bg-surface-1 border border-border-default rounded-lg p-3 text-center">
              <p className="font-mono text-sm text-text-primary">{rpe}/10</p>
              <p className="font-body text-[10px] text-text-tertiary uppercase">RPE</p>
            </div>
          </div>

          {/* Split breakdown */}
          <div className="bg-surface-1 border border-border-default rounded-lg p-4 space-y-2">
            <h2 className="font-display text-xs uppercase tracking-widest text-text-tertiary">
              Split Times
            </h2>
            {splits.map((split, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  {split.type === 'station' && split.stationNumber && (
                    <div className={`w-2 h-2 rounded-full ${STATION_COLORS[split.stationNumber] || 'bg-surface-4'}`} />
                  )}
                  {split.type === 'run' && (
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                  )}
                  <span className="font-body text-sm text-text-primary">{split.label}</span>
                </div>
                <span className="font-mono text-sm text-text-secondary">
                  {formatTime(split.time_ms)}
                </span>
              </div>
            ))}
          </div>

          <Button
            onClick={() => router.push('/calendar')}
            className="w-full bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider"
            size="lg"
          >
            Done
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Setup ───────────────────────────────────────────────

  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-surface-0">
        <div className="sticky top-0 z-10 bg-surface-1 border-b border-border-default px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-text-secondary hover:text-text-primary">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg font-bold uppercase tracking-wider text-text-primary">
              Race Simulation
            </h1>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          <div className="bg-hyrox-yellow/5 border border-hyrox-yellow/20 rounded-lg p-5 space-y-3">
            <div className="caution-stripe h-1 rounded-full" />
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-text-primary">
              Hyrox Race Format
            </h2>
            <p className="font-body text-sm text-text-secondary">
              8 rounds of 1km run + 1 functional workout station. Timer runs continuously — tap to record each split as you complete it.
            </p>
          </div>

          {/* Preview of all segments */}
          <div className="space-y-1.5">
            {segments.map((seg, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 bg-surface-1 border border-border-default rounded-lg"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                  seg.type === 'run'
                    ? 'bg-blue-500'
                    : seg.stationNumber
                      ? STATION_COLORS[seg.stationNumber] || 'bg-surface-4'
                      : 'bg-surface-4'
                }`}>
                  {seg.type === 'run' ? 'R' : seg.stationNumber}
                </div>
                <div className="flex-1">
                  <p className="font-display text-xs uppercase tracking-wider text-text-primary">
                    {seg.label}
                  </p>
                  {seg.distance && (
                    <p className="font-mono text-[10px] text-text-tertiary">{seg.distance}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleStart}
            className="w-full bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider"
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Simulation
          </Button>
        </div>
      </div>
    );
  }

  // ── Transition ──────────────────────────────────────────

  if (phase === 'transition') {
    const nextSeg = segments[currentIndex];
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="font-display text-xs uppercase tracking-widest text-text-tertiary animate-pulse">
            Next Up
          </p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-hyrox-yellow">
            {nextSeg?.label}
          </h1>
          {nextSeg?.distance && (
            <p className="font-mono text-lg text-text-secondary">{nextSeg.distance}</p>
          )}
        </div>
      </div>
    );
  }

  // ── Active / Logging ────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Header with timer */}
      <div className="sticky top-0 z-10 bg-surface-1 border-b border-border-default">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-hyrox-yellow" />
            <span className="font-mono text-xs text-text-tertiary">
              Total
            </span>
          </div>
          <span className="font-mono text-2xl font-bold text-text-primary tabular-nums">
            {formatTime(timer.elapsed)}
          </span>
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs text-text-tertiary">
              {currentIndex + 1}/{totalSegments}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-surface-3">
          <div
            className="h-full bg-hyrox-yellow transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {phase === 'active' && currentSegment && (
          <>
            {/* Current segment hero */}
            <div className="text-center space-y-3">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-lg font-bold ${
                currentSegment.type === 'run'
                  ? 'bg-blue-500'
                  : currentSegment.stationNumber
                    ? STATION_COLORS[currentSegment.stationNumber] || 'bg-surface-4'
                    : 'bg-surface-4'
              }`}>
                {currentSegment.type === 'run' ? (
                  <span className="font-display text-xl">R{Math.ceil((currentIndex + 1) / 2)}</span>
                ) : (
                  <span className="font-display text-xl">S{currentSegment.stationNumber}</span>
                )}
              </div>
              <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-text-primary">
                {currentSegment.label}
              </h1>
              {currentSegment.distance && (
                <p className="font-mono text-lg text-text-secondary">{currentSegment.distance}</p>
              )}

              {/* Segment timer */}
              <p className="font-mono text-4xl font-bold text-hyrox-yellow tabular-nums">
                {formatTime(timer.elapsed - segmentStartMs)}
              </p>
            </div>

            {/* Completed splits summary */}
            {splits.length > 0 && (
              <div className="bg-surface-1 border border-border-default rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-[10px] uppercase tracking-widest text-text-tertiary">
                    Completed Splits
                  </span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {splits.map((split, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="font-body text-xs text-text-secondary">{split.label}</span>
                      <span className="font-mono text-xs text-text-tertiary">{formatTime(split.time_ms)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next segment button */}
            <Button
              onClick={handleNextSegment}
              className="w-full bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider"
              size="lg"
            >
              <Check className="h-4 w-4 mr-2" />
              {currentIndex + 1 >= totalSegments ? 'Finish Race' : 'Done — Next Segment'}
            </Button>

            {/* Pause / controls */}
            <div className="flex justify-center gap-3">
              <button
                onClick={timer.running ? timer.pause : timer.resume}
                className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary hover:text-text-primary"
              >
                {timer.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            </div>
          </>
        )}

        {phase === 'logging' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Flag className="h-12 w-12 text-hyrox-yellow mx-auto" />
              <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-text-primary">
                Race Complete!
              </h1>
              <p className="font-mono text-3xl font-bold text-hyrox-yellow">
                {formatTime(splits.reduce((sum, s) => sum + s.time_ms, 0))}
              </p>
            </div>

            <div>
              <label className="font-display text-xs uppercase tracking-wider text-text-secondary block mb-3">
                How hard was it? (RPE)
              </label>
              <RpeSlider value={rpe} onChange={setRpe} />
            </div>
            <div>
              <label className="font-display text-xs uppercase tracking-wider text-text-secondary block mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it feel? Which stations were toughest?"
                rows={3}
                className="w-full bg-surface-1 border border-border-default rounded-lg p-3 font-body text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-hyrox-yellow resize-none"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={createWorkout.isPending}
              className="w-full bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider"
              size="lg"
            >
              {createWorkout.isPending ? 'Saving...' : 'Save Simulation'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
