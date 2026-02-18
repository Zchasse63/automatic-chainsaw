'use client';

import { CheckCircle2, Circle } from 'lucide-react';

interface SectionLog {
  completed: boolean;
  notes: string;
}

interface SectionLoggerProps {
  index: number;
  content: string;
  isActive: boolean;
  log?: SectionLog;
  onUpdate: (log: SectionLog) => void;
}

export function SectionLogger({ index, content, isActive, log, onUpdate }: SectionLoggerProps) {
  const isCompleted = log?.completed ?? false;

  return (
    <div
      className={`bg-surface-1 border rounded-lg p-4 transition-colors ${
        isCompleted
          ? 'border-semantic-success/30 bg-semantic-success/5'
          : 'border-border-default'
      }`}
    >
      <div className="flex items-start gap-3">
        {isActive && (
          <button
            onClick={() =>
              onUpdate({ completed: !isCompleted, notes: log?.notes ?? '' })
            }
            className="mt-0.5 flex-shrink-0"
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-semantic-success" />
            ) : (
              <Circle className="h-5 w-5 text-text-tertiary hover:text-text-secondary" />
            )}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-display text-[10px] uppercase tracking-wider text-text-tertiary mb-1">
            Section {index + 1}
          </p>
          <p className={`font-body text-sm whitespace-pre-wrap ${
            isCompleted ? 'text-text-secondary line-through' : 'text-text-primary'
          }`}>
            {content}
          </p>
          {isActive && isCompleted && (
            <input
              type="text"
              value={log?.notes ?? ''}
              onChange={(e) =>
                onUpdate({ completed: true, notes: e.target.value })
              }
              placeholder="Notes (optional)"
              className="mt-2 w-full bg-transparent border-b border-border-default font-body text-xs text-text-secondary placeholder:text-text-tertiary focus:outline-none focus:border-hyrox-yellow"
            />
          )}
        </div>
      </div>
    </div>
  );
}
