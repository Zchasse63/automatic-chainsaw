'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
} from 'lucide-react';
import type { Exercise } from '@/lib/coach/training-plan-schema';

// ── Types ─────────────────────────────────────────────────

export interface SetLog {
  reps: number | null;
  weight_kg: number | null;
  distance_m: number | null;
  duration_seconds: number | null;
  completed: boolean;
}

export interface ExerciseLog {
  name: string;
  sets: SetLog[];
  notes: string;
  completed: boolean;
}

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  phase: 'warmup' | 'main' | 'cooldown';
  isActive: boolean;
  log: ExerciseLog;
  previousBest?: string | null;
  onUpdate: (log: ExerciseLog) => void;
}

// ── Helpers ───────────────────────────────────────────────

function formatPrescription(ex: Exercise): string {
  const parts: string[] = [];
  if (ex.sets) parts.push(`${ex.sets} sets`);
  if (ex.reps) parts.push(`${ex.reps} reps`);
  if (ex.weight_kg) parts.push(`${ex.weight_kg} kg`);
  if (ex.distance_m) {
    parts.push(ex.distance_m >= 1000 ? `${ex.distance_m / 1000} km` : `${ex.distance_m}m`);
  }
  if (ex.duration_seconds) {
    const m = Math.floor(ex.duration_seconds / 60);
    const s = ex.duration_seconds % 60;
    parts.push(m > 0 ? (s > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${m} min`) : `${s}s`);
  }
  if (ex.rest_seconds) parts.push(`${ex.rest_seconds}s rest`);
  return parts.join(' × ') || 'Complete';
}

const PHASE_COLORS = {
  warmup: 'text-coach-green',
  main: 'text-hyrox-yellow',
  cooldown: 'text-coach-blue',
} as const;

const PHASE_LABELS = {
  warmup: 'Warm-up',
  main: 'Main',
  cooldown: 'Cool-down',
} as const;

// ── Inline Set Row ────────────────────────────────────────

function SetRow({
  setIndex,
  set,
  exercise,
  isActive,
  onUpdate,
}: {
  setIndex: number;
  set: SetLog;
  exercise: Exercise;
  isActive: boolean;
  onUpdate: (set: SetLog) => void;
}) {
  const showReps = exercise.reps != null;
  const showWeight = exercise.weight_kg != null;
  const showDistance = exercise.distance_m != null;
  const showDuration = exercise.duration_seconds != null;

  return (
    <div
      className={`flex items-center gap-2 py-1.5 ${
        set.completed ? 'opacity-60' : ''
      }`}
    >
      {isActive && (
        <button
          onClick={() => onUpdate({ ...set, completed: !set.completed })}
          className="flex-shrink-0"
        >
          {set.completed ? (
            <CheckCircle2 className="h-4 w-4 text-semantic-success" />
          ) : (
            <Circle className="h-4 w-4 text-text-tertiary" />
          )}
        </button>
      )}
      <span className="font-mono text-xs text-text-tertiary w-6">
        S{setIndex + 1}
      </span>
      {showReps && (
        <InlineNumberInput
          label="reps"
          value={set.reps}
          placeholder={exercise.reps ?? 0}
          disabled={!isActive}
          onChange={(v) => onUpdate({ ...set, reps: v })}
        />
      )}
      {showWeight && (
        <InlineNumberInput
          label="kg"
          value={set.weight_kg}
          placeholder={exercise.weight_kg ?? 0}
          disabled={!isActive}
          onChange={(v) => onUpdate({ ...set, weight_kg: v })}
        />
      )}
      {showDistance && (
        <InlineNumberInput
          label="m"
          value={set.distance_m}
          placeholder={exercise.distance_m ?? 0}
          disabled={!isActive}
          onChange={(v) => onUpdate({ ...set, distance_m: v })}
        />
      )}
      {showDuration && (
        <InlineNumberInput
          label="sec"
          value={set.duration_seconds}
          placeholder={exercise.duration_seconds ?? 0}
          disabled={!isActive}
          onChange={(v) => onUpdate({ ...set, duration_seconds: v })}
        />
      )}
    </div>
  );
}

// ── Inline Number Input ───────────────────────────────────

function InlineNumberInput({
  label,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: number | null;
  placeholder: number;
  disabled: boolean;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {!disabled && (
        <button
          onClick={() => onChange(Math.max(0, (value ?? placeholder) - 1))}
          className="p-0.5 text-text-tertiary hover:text-text-primary"
        >
          <Minus className="h-3 w-3" />
        </button>
      )}
      <input
        type="number"
        value={value ?? ''}
        placeholder={String(placeholder)}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-12 bg-surface-2 border border-border-default rounded px-1.5 py-0.5 font-mono text-xs text-text-primary text-center focus:outline-none focus:border-hyrox-yellow disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="font-mono text-[10px] text-text-tertiary">{label}</span>
      {!disabled && (
        <button
          onClick={() => onChange((value ?? placeholder) + 1)}
          className="p-0.5 text-text-tertiary hover:text-text-primary"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ── Main ExerciseCard ─────────────────────────────────────

export function ExerciseCard({
  exercise,
  index,
  phase,
  isActive,
  log,
  previousBest,
  onUpdate,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(true);
  const allSetsComplete = log.sets.length > 0 && log.sets.every((s) => s.completed);

  function updateSet(setIndex: number, set: SetLog) {
    const newSets = [...log.sets];
    newSets[setIndex] = set;
    const allDone = newSets.every((s) => s.completed);
    onUpdate({ ...log, sets: newSets, completed: allDone });
  }

  function toggleExerciseComplete() {
    const newCompleted = !log.completed;
    const newSets = log.sets.map((s) => ({ ...s, completed: newCompleted }));
    onUpdate({ ...log, sets: newSets, completed: newCompleted });
  }

  return (
    <div
      className={`bg-surface-1 border rounded-lg overflow-hidden transition-colors ${
        allSetsComplete
          ? 'border-semantic-success/30 bg-semantic-success/5'
          : 'border-border-default'
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3"
      >
        {isActive && (
          <div
            className="flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              toggleExerciseComplete();
            }}
          >
            {allSetsComplete ? (
              <CheckCircle2 className="h-5 w-5 text-semantic-success" />
            ) : (
              <Circle className="h-5 w-5 text-text-tertiary" />
            )}
          </div>
        )}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-display text-[9px] uppercase tracking-wider ${PHASE_COLORS[phase]}`}>
              {index === 0 && PHASE_LABELS[phase]}
            </span>
          </div>
          <p
            className={`font-display text-sm font-bold uppercase tracking-wider ${
              allSetsComplete ? 'text-text-secondary line-through' : 'text-text-primary'
            }`}
          >
            {exercise.name}
          </p>
          <p className="font-mono text-xs text-text-tertiary mt-0.5">
            {formatPrescription(exercise)}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-text-tertiary flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-tertiary flex-shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {exercise.notes && (
            <p className="font-body text-xs text-text-secondary italic">
              {exercise.notes}
            </p>
          )}

          {previousBest && (
            <p className="font-mono text-[10px] text-hyrox-yellow/70">
              Last time: {previousBest}
            </p>
          )}

          {/* Set rows */}
          {log.sets.length > 0 && (
            <div className="space-y-0.5">
              {log.sets.map((set, si) => (
                <SetRow
                  key={si}
                  setIndex={si}
                  set={set}
                  exercise={exercise}
                  isActive={isActive}
                  onUpdate={(s) => updateSet(si, s)}
                />
              ))}
            </div>
          )}

          {/* Notes input when active */}
          {isActive && allSetsComplete && (
            <input
              type="text"
              value={log.notes}
              onChange={(e) => onUpdate({ ...log, notes: e.target.value })}
              placeholder="Notes (optional)"
              className="w-full bg-transparent border-b border-border-default font-body text-xs text-text-secondary placeholder:text-text-tertiary focus:outline-none focus:border-hyrox-yellow"
            />
          )}
        </div>
      )}
    </div>
  );
}
