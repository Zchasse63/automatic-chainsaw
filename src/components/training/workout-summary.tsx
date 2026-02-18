'use client';

import { CheckCircle2, Clock, Flame, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkoutSummaryProps {
  duration: number; // ms
  rpe: number;
  sessionType: string;
  sections: Record<string, { completed: boolean; notes: string }>;
  onDone: () => void;
}

export function WorkoutSummary({ duration, rpe, sessionType, sections, onDone }: WorkoutSummaryProps) {
  const totalSeconds = Math.floor(duration / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const totalSections = Object.keys(sections).length;
  const completedSections = Object.values(sections).filter((s) => s.completed).length;

  const timeStr = hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes}m ${seconds}s`;

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

        <div className="grid grid-cols-3 gap-4">
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
          <div className="bg-surface-1 border border-border-default rounded-lg p-4">
            <CheckCircle2 className="h-5 w-5 text-hyrox-yellow mx-auto mb-1" />
            <p className="font-mono text-lg text-text-primary">
              {completedSections}/{totalSections}
            </p>
            <p className="font-body text-[10px] text-text-tertiary uppercase">Sections</p>
          </div>
        </div>

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
