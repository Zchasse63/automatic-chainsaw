'use client';

import { CheckCircle2, Clock, Flame, ArrowRight, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ExerciseLog } from '@/components/training/exercise-card';

interface WorkoutSummaryProps {
  duration: number; // ms
  rpe: number;
  sessionType: string;
  sections: Record<string, { completed: boolean; notes: string }>;
  exerciseLogs?: Record<string, ExerciseLog>;
  onDone: () => void;
}

export function WorkoutSummary({ duration, rpe, sessionType, sections, exerciseLogs, onDone }: WorkoutSummaryProps) {
  const totalSeconds = Math.floor(duration / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const timeStr = hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m ${seconds}s`;

  const isStructured = exerciseLogs && Object.keys(exerciseLogs).length > 0;

  let totalItems = 0;
  let completedItems = 0;
  let totalSets = 0;
  let completedSets = 0;

  if (isStructured) {
    for (const log of Object.values(exerciseLogs)) {
      totalItems++;
      if (log.completed) completedItems++;
      for (const set of log.sets) {
        totalSets++;
        if (set.completed) completedSets++;
      }
    }
  } else {
    totalItems = Object.keys(sections).length;
    completedItems = Object.values(sections).filter((s) => s.completed).length;
  }

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-8 text-center">
        <div className="space-y-2">
          <CheckCircle2 className="h-16 w-16 text-semantic-success mx-auto" />
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-text-primary">
            Workout Complete
          </h1>
          <p className="font-body text-sm text-text-secondary capitalize">
            {sessionType.replace(/_/g, ' ')}
          </p>
        </div>

        <div className={`grid ${isStructured ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
          <div className="bg-surface-1 border border-border-default rounded-lg p-4">
            <Clock className="h-5 w-5 text-hyrox-yellow mx-auto mb-1" />
            <p className="font-mono text-lg text-text-primary">{timeStr}</p>
            <p className="font-body text-[10px] text-text-tertiary uppercase">Duration</p>
          </div>
          <div className="bg-surface-1 border border-border-default rounded-lg p-4">
            <Flame className="h-5 w-5 text-hyrox-yellow mx-auto mb-1" />
            <p className="font-mono text-lg text-text-primary">{rpe}/10</p>
            <p className="font-body text-[10px] text-text-tertiary uppercase">RPE</p>
          </div>
          {isStructured ? (
            <>
              <div className="bg-surface-1 border border-border-default rounded-lg p-4">
                <Dumbbell className="h-5 w-5 text-hyrox-yellow mx-auto mb-1" />
                <p className="font-mono text-lg text-text-primary">
                  {completedItems}/{totalItems}
                </p>
                <p className="font-body text-[10px] text-text-tertiary uppercase">Exercises</p>
              </div>
              <div className="bg-surface-1 border border-border-default rounded-lg p-4">
                <CheckCircle2 className="h-5 w-5 text-hyrox-yellow mx-auto mb-1" />
                <p className="font-mono text-lg text-text-primary">
                  {completedSets}/{totalSets}
                </p>
                <p className="font-body text-[10px] text-text-tertiary uppercase">Sets</p>
              </div>
            </>
          ) : (
            <div className="bg-surface-1 border border-border-default rounded-lg p-4">
              <CheckCircle2 className="h-5 w-5 text-hyrox-yellow mx-auto mb-1" />
              <p className="font-mono text-lg text-text-primary">
                {completedItems}/{totalItems}
              </p>
              <p className="font-body text-[10px] text-text-tertiary uppercase">Sections</p>
            </div>
          )}
        </div>

        {/* Exercise breakdown for structured workouts */}
        {isStructured && (
          <div className="bg-surface-1 border border-border-default rounded-lg p-4 text-left space-y-2">
            <p className="font-display text-[10px] uppercase tracking-widest text-text-tertiary mb-2">
              Exercise Breakdown
            </p>
            {Object.values(exerciseLogs).map((log, i) => {
              const done = log.sets.filter((s) => s.completed).length;
              return (
                <div key={i} className="flex items-center justify-between">
                  <span className={`font-body text-sm ${log.completed ? 'text-text-primary' : 'text-text-tertiary'}`}>
                    {log.completed && <CheckCircle2 className="h-3 w-3 text-semantic-success inline mr-1.5" />}
                    {log.name}
                  </span>
                  <span className="font-mono text-xs text-text-tertiary">
                    {done}/{log.sets.length} sets
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <Button
          onClick={onDone}
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
