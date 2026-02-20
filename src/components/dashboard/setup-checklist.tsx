'use client';

import { Check, Circle, MessageSquare, Dumbbell, Target, Calendar, User } from 'lucide-react';
import Link from 'next/link';

interface SetupChecklistProps {
  hasProfile: boolean;
  hasRaceDate: boolean;
  hasPlan: boolean;
  hasWorkout: boolean;
  hasGoal: boolean;
}

const STEPS = [
  {
    key: 'profile' as const,
    label: 'Complete your profile',
    description: 'Add your stats and preferences',
    href: '/profile',
    icon: User,
    check: (p: SetupChecklistProps) => p.hasProfile,
  },
  {
    key: 'race' as const,
    label: 'Set your race date',
    description: 'Know how many days until race day',
    href: '/profile',
    icon: Calendar,
    check: (p: SetupChecklistProps) => p.hasRaceDate,
  },
  {
    key: 'plan' as const,
    label: 'Get a training plan',
    description: 'Ask Coach K to create one for you',
    href: '/coach',
    icon: MessageSquare,
    check: (p: SetupChecklistProps) => p.hasPlan,
  },
  {
    key: 'workout' as const,
    label: 'Log your first workout',
    description: 'Track a training session',
    href: '/training/log',
    icon: Dumbbell,
    check: (p: SetupChecklistProps) => p.hasWorkout,
  },
  {
    key: 'goal' as const,
    label: 'Set a goal',
    description: 'Target a finish time or PR',
    href: '/coach',
    icon: Target,
    check: (p: SetupChecklistProps) => p.hasGoal,
  },
];

export function SetupChecklist(props: SetupChecklistProps) {
  const completedCount = STEPS.filter((s) => s.check(props)).length;
  const allDone = completedCount === STEPS.length;

  if (allDone) return null;

  const progressPct = (completedCount / STEPS.length) * 100;

  return (
    <div className="bg-surface-1 border border-border-default rounded-lg p-5 space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-text-primary">
            Get Started
          </h2>
          <span className="font-mono text-xs text-text-tertiary">
            {completedCount}/{STEPS.length}
          </span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-hyrox-yellow rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        {STEPS.map((step) => {
          const done = step.check(props);
          const Icon = step.icon;
          return (
            <Link
              key={step.key}
              href={done ? '#' : step.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                done
                  ? 'opacity-60'
                  : 'hover:bg-surface-2'
              }`}
            >
              {done ? (
                <div className="w-6 h-6 rounded-full bg-semantic-success/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3.5 w-3.5 text-semantic-success" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-text-tertiary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-display text-xs uppercase tracking-wider ${
                  done ? 'text-text-tertiary line-through' : 'text-text-primary'
                }`}>
                  {step.label}
                </p>
                {!done && (
                  <p className="font-body text-[10px] text-text-tertiary">
                    {step.description}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
