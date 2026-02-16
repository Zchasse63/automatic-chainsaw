'use client';

import { Button } from '@/components/ui/button';
import {
  CalendarDays,
  ChevronRight,
  Dumbbell,
  MessageSquare,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Workout {
  id: string;
  date: string;
  session_type: string | null;
  duration_minutes: number | null;
  rpe_post: number | null;
  notes: string | null;
  completion_status: string | null;
}

interface Plan {
  id: string;
  plan_name: string;
  goal: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  duration_weeks: number;
}

export default function TrainingPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [wRes, pRes] = await Promise.all([
        fetch('/api/workouts?limit=10'),
        fetch('/api/training-plans'),
      ]);
      if (wRes.ok) setWorkouts((await wRes.json()).workouts);
      if (pRes.ok) setPlans((await pRes.json()).plans);
      setLoading(false);
    }
    load();
  }, []);

  const activePlan = plans.find((p) => p.status === 'active');

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-48 bg-surface-2 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-surface-1 border border-border-default rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-text-primary">
          Training
        </h1>
        <Link href="/training/log">
          <Button className="bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider text-xs">
            <Plus className="h-4 w-4 mr-2" />
            Log Workout
          </Button>
        </Link>
      </div>

      {/* Active Plan */}
      <section className="space-y-3">
        <h2 className="font-display text-sm uppercase tracking-widest text-text-tertiary">
          Training Plan
        </h2>
        {activePlan ? (
          <div className="bg-surface-1 border border-border-default rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-text-primary">
                  {activePlan.plan_name}
                </h3>
                {activePlan.goal && (
                  <p className="font-body text-sm text-text-secondary mt-1">
                    {activePlan.goal}
                  </p>
                )}
                {activePlan.start_date && activePlan.end_date && (
                  <p className="font-mono text-xs text-text-tertiary mt-2">
                    {new Date(activePlan.start_date).toLocaleDateString()} —{' '}
                    {new Date(activePlan.end_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-text-tertiary" />
            </div>
          </div>
        ) : (
          <div className="bg-surface-1 border border-border-default rounded-lg p-8 text-center space-y-3">
            <CalendarDays className="h-8 w-8 text-text-tertiary mx-auto" />
            <p className="font-body text-sm text-text-secondary">
              No active training plan
            </p>
            <Link href="/coach">
              <Button
                variant="outline"
                className="border-hyrox-yellow text-hyrox-yellow hover:bg-hyrox-yellow/10 font-display uppercase tracking-wider text-xs"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Ask Coach K to create one
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Recent Workouts */}
      <section className="space-y-3">
        <h2 className="font-display text-sm uppercase tracking-widest text-text-tertiary">
          Recent Workouts
        </h2>
        {workouts.length === 0 ? (
          <div className="bg-surface-1 border border-border-default rounded-lg p-8 text-center space-y-3">
            <Dumbbell className="h-8 w-8 text-text-tertiary mx-auto" />
            <p className="font-body text-sm text-text-secondary">
              No workouts logged yet
            </p>
            <Link href="/training/log">
              <Button className="bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider text-xs">
                <Plus className="h-4 w-4 mr-2" />
                Log Your First Workout
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {workouts.map((w) => (
              <div
                key={w.id}
                className="bg-surface-1 border border-border-default rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs uppercase tracking-wider px-2 py-0.5 rounded-sm bg-surface-2 text-text-secondary">
                      {w.session_type || 'General'}
                    </span>
                    <span className="font-mono text-xs text-text-tertiary">
                      {new Date(w.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {w.duration_minutes && (
                      <span className="font-body text-sm text-text-primary">
                        {w.duration_minutes} min
                      </span>
                    )}
                    {w.rpe_post && (
                      <span className="font-mono text-xs text-text-tertiary">
                        RPE {w.rpe_post}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-text-tertiary" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
