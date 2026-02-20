'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Timer,
  X,
} from 'lucide-react';
import {
  useIntervalTimer,
  type TimerConfig,
  type TimerMode,
} from '@/hooks/use-interval-timer';

// ── Mode labels & colors ──────────────────────────────────

const MODE_OPTIONS: { mode: TimerMode; label: string; description: string }[] = [
  { mode: 'stopwatch', label: 'Stopwatch', description: 'Count up' },
  { mode: 'countdown', label: 'Countdown', description: 'Count down from set time' },
  { mode: 'interval', label: 'Interval', description: 'Work / rest cycles' },
  { mode: 'emom', label: 'EMOM', description: 'Every minute on the minute' },
  { mode: 'amrap', label: 'AMRAP', description: 'As many reps as possible' },
  { mode: 'tabata', label: 'Tabata', description: '20s work / 10s rest × 8' },
];

const PHASE_COLORS = {
  work: 'text-hyrox-yellow',
  rest: 'text-coach-green',
} as const;

// ── Presets for quick configuration ───────────────────────

function NumberStepper({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-body text-xs text-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-7 h-7 flex items-center justify-center rounded bg-surface-2 text-text-secondary hover:text-text-primary"
        >
          -
        </button>
        <span className="font-mono text-sm text-text-primary w-12 text-center">
          {value}{unit}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-7 h-7 flex items-center justify-center rounded bg-surface-2 text-text-secondary hover:text-text-primary"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────

interface FloatingTimerProps {
  /** Called when timer completes (for logging) */
  onComplete?: (elapsedMs: number) => void;
}

export function FloatingTimer({ onComplete }: FloatingTimerProps) {
  const { config, state, start, pause, resume, reset, configure, formatDisplay } = useIntervalTimer();
  const [expanded, setExpanded] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [visible, setVisible] = useState(false);

  // Draft config state for the setup panel
  const [draftMode, setDraftMode] = useState<TimerMode>('stopwatch');
  const [draftSeconds, setDraftSeconds] = useState(60);
  const [draftWork, setDraftWork] = useState(30);
  const [draftRest, setDraftRest] = useState(15);
  const [draftRounds, setDraftRounds] = useState(8);
  const [draftEmomInterval, setDraftEmomInterval] = useState(60);
  const [draftEmomRounds, setDraftEmomRounds] = useState(10);

  function applyConfig() {
    const newConfig: TimerConfig = { mode: draftMode };
    switch (draftMode) {
      case 'countdown':
        newConfig.totalSeconds = draftSeconds;
        break;
      case 'amrap':
        newConfig.totalSeconds = draftSeconds;
        break;
      case 'interval':
        newConfig.workSeconds = draftWork;
        newConfig.restSeconds = draftRest;
        newConfig.rounds = draftRounds;
        break;
      case 'emom':
        newConfig.emomInterval = draftEmomInterval;
        newConfig.emomRounds = draftEmomRounds;
        break;
      case 'tabata':
        // Fixed: 20s work, 10s rest, 8 rounds
        break;
    }
    configure(newConfig);
    setShowConfig(false);
    setExpanded(true);
  }

  // Trigger callback on completion
  if (state.isComplete && onComplete) {
    onComplete(state.totalElapsed);
  }

  if (!visible) {
    return (
      <button
        onClick={() => { setVisible(true); setShowConfig(true); }}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-hyrox-yellow text-text-inverse flex items-center justify-center shadow-lg hover:bg-hyrox-yellow-hover transition-colors"
        title="Open Timer"
      >
        <Timer className="h-5 w-5" />
      </button>
    );
  }

  const isCountingDown = config.mode !== 'stopwatch';
  const modeOption = MODE_OPTIONS.find((m) => m.mode === config.mode);

  return (
    <div className="fixed bottom-20 left-3 right-3 z-40 md:left-auto md:right-4 md:w-80">
      <div className="bg-surface-1 border border-border-default rounded-xl shadow-2xl overflow-hidden">
        {/* Collapsed bar */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 flex-1 min-w-0">
            <Timer className="h-4 w-4 text-hyrox-yellow flex-shrink-0" />
            <span className="font-display text-[10px] uppercase tracking-wider text-text-tertiary">
              {modeOption?.label}
            </span>
            {state.isRunning && config.mode !== 'stopwatch' && (
              <span className={`font-display text-[10px] uppercase tracking-wider ${PHASE_COLORS[state.phase]}`}>
                {state.phase}
              </span>
            )}
          </button>

          {/* Time display always visible */}
          <span
            className={`font-mono text-xl font-bold tabular-nums ${
              state.isComplete
                ? 'text-semantic-success'
                : state.phase === 'rest' && state.isRunning
                  ? 'text-coach-green'
                  : 'text-text-primary'
            }`}
          >
            {formatDisplay(state.displayMs)}
          </span>

          <div className="flex items-center gap-1 ml-2">
            {expanded ? (
              <button onClick={() => setExpanded(false)} className="p-1 text-text-tertiary hover:text-text-primary">
                <ChevronDown className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={() => setExpanded(true)} className="p-1 text-text-tertiary hover:text-text-primary">
                <ChevronUp className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => { reset(); setVisible(false); }} className="p-1 text-text-tertiary hover:text-text-primary">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && !showConfig && (
          <div className="px-4 pb-4 space-y-3">
            {/* Round indicator for interval modes */}
            {(config.mode === 'interval' || config.mode === 'tabata' || config.mode === 'emom') && (
              <div className="flex items-center justify-between">
                <span className="font-body text-xs text-text-tertiary">Round</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: state.totalRounds }, (_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < state.currentRound
                          ? 'bg-hyrox-yellow'
                          : 'bg-surface-3'
                      }`}
                    />
                  ))}
                  <span className="font-mono text-xs text-text-tertiary ml-1">
                    {state.currentRound}/{state.totalRounds}
                  </span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => { reset(); setShowConfig(true); }}
                className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary hover:text-text-primary"
                title="Configure"
              >
                <Settings className="h-4 w-4" />
              </button>

              <button
                onClick={reset}
                className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary hover:text-text-primary"
                title="Reset"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              {state.isComplete ? (
                <button
                  onClick={reset}
                  className="w-14 h-14 rounded-full bg-semantic-success flex items-center justify-center text-white"
                  title="Reset"
                >
                  <RotateCcw className="h-6 w-6" />
                </button>
              ) : state.isRunning ? (
                <button
                  onClick={pause}
                  className="w-14 h-14 rounded-full bg-hyrox-yellow flex items-center justify-center text-text-inverse"
                  title="Pause"
                >
                  <Pause className="h-6 w-6" />
                </button>
              ) : (
                <button
                  onClick={state.totalElapsed > 0 ? resume : start}
                  className="w-14 h-14 rounded-full bg-hyrox-yellow flex items-center justify-center text-text-inverse"
                  title="Start"
                >
                  <Play className="h-6 w-6 ml-0.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Configuration panel */}
        {showConfig && (
          <div className="px-4 pb-4 space-y-4">
            {/* Mode selector */}
            <div className="grid grid-cols-3 gap-1.5">
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.mode}
                  onClick={() => setDraftMode(opt.mode)}
                  className={`px-2 py-2 rounded-lg text-center transition-colors ${
                    draftMode === opt.mode
                      ? 'bg-hyrox-yellow/20 border border-hyrox-yellow/40 text-hyrox-yellow'
                      : 'bg-surface-2 border border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span className="font-display text-[10px] uppercase tracking-wider block">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Mode-specific settings */}
            <div className="space-y-2">
              {(draftMode === 'countdown' || draftMode === 'amrap') && (
                <NumberStepper
                  label="Duration"
                  value={draftSeconds}
                  min={10}
                  max={3600}
                  step={draftSeconds < 60 ? 10 : 30}
                  unit="s"
                  onChange={setDraftSeconds}
                />
              )}
              {draftMode === 'interval' && (
                <>
                  <NumberStepper label="Work" value={draftWork} min={5} max={300} step={5} unit="s" onChange={setDraftWork} />
                  <NumberStepper label="Rest" value={draftRest} min={5} max={300} step={5} unit="s" onChange={setDraftRest} />
                  <NumberStepper label="Rounds" value={draftRounds} min={1} max={50} step={1} unit="" onChange={setDraftRounds} />
                </>
              )}
              {draftMode === 'emom' && (
                <>
                  <NumberStepper label="Interval" value={draftEmomInterval} min={30} max={180} step={10} unit="s" onChange={setDraftEmomInterval} />
                  <NumberStepper label="Rounds" value={draftEmomRounds} min={1} max={30} step={1} unit="" onChange={setDraftEmomRounds} />
                </>
              )}
              {draftMode === 'tabata' && (
                <p className="font-body text-xs text-text-tertiary text-center">
                  20s work / 10s rest × 8 rounds (fixed)
                </p>
              )}
              {draftMode === 'stopwatch' && (
                <p className="font-body text-xs text-text-tertiary text-center">
                  Counts up from 0:00
                </p>
              )}
            </div>

            {/* Apply */}
            <button
              onClick={applyConfig}
              className="w-full py-2.5 bg-hyrox-yellow text-text-inverse rounded-lg font-display text-xs uppercase tracking-wider font-bold hover:bg-hyrox-yellow-hover transition-colors"
            >
              Set Timer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
