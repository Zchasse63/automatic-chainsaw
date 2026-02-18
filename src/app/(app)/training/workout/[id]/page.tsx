'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useCreateWorkout } from '@/hooks/use-workouts';
import { Button } from '@/components/ui/button';
import { SectionLogger } from '@/components/training/section-logger';
import { RpeSlider } from '@/components/training/rpe-slider';
import { WorkoutSummary } from '@/components/training/workout-summary';
import { useWorkoutTimer } from '@/hooks/use-workout-timer';
import { ArrowLeft, Play, Square, Clock } from 'lucide-react';

interface WorkoutDay {
  id: string;
  day_of_week: number;
  session_type: string | null;
  workout_title: string | null;
  workout_description: string | null;
  estimated_duration_minutes: number | null;
  is_rest_day: boolean;
  is_completed: boolean;
}

export default function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const createWorkout = useCreateWorkout();
  const { elapsed, isRunning, start, stop, reset, formatTime } = useWorkoutTimer(id);

  const [phase, setPhase] = useState<'preview' | 'active' | 'logging' | 'summary'>('preview');
  const [rpe, setRpe] = useState(5);
  const [notes, setNotes] = useState('');
  const [sectionLogs, setSectionLogs] = useState<Record<string, { completed: boolean; notes: string }>>({});

  const { data: workout, isLoading } = useQuery<WorkoutDay>({
    queryKey: ['training-plan-day', id],
    queryFn: async () => {
      const res = await fetch(`/api/training-plans/day/${id}`);
      if (!res.ok) throw new Error('Failed to load workout');
      const data = await res.json();
      return data.day;
    },
  });

  function handleStart() {
    setPhase('active');
    start();
  }

  function handleFinishWorkout() {
    stop();
    setPhase('logging');
  }

  async function handleSubmit() {
    const durationMinutes = Math.round(elapsed / 60000);
    await createWorkout.mutateAsync({
      date: new Date().toISOString().split('T')[0],
      session_type: workout?.session_type ?? 'general',
      duration_minutes: durationMinutes,
      rpe_post: rpe,
      notes: notes || undefined,
      training_plan_day_id: id,
      completed_workout: { sections: sectionLogs, timer_ms: elapsed },
    });
    setPhase('summary');
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-6 w-6 border-2 border-hyrox-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="font-body text-text-secondary">Workout not found</p>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    );
  }

  if (phase === 'summary') {
    return (
      <WorkoutSummary
        duration={elapsed}
        rpe={rpe}
        sessionType={workout.session_type ?? 'general'}
        sections={sectionLogs}
        onDone={() => router.push('/training')}
      />
    );
  }

  // Parse workout description into sections
  const sections = (workout.workout_description ?? '')
    .split(/\n{2,}/)
    .filter((s) => s.trim());

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-1 border-b border-border-default px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          {(phase === 'active' || phase === 'logging') && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-hyrox-yellow" />
              <span className="font-mono text-lg text-text-primary">{formatTime(elapsed)}</span>
            </div>
          )}
          <div className="w-5" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Workout title */}
        <div>
          <p className="font-display text-xs uppercase tracking-wider text-hyrox-yellow">
            {workout.session_type?.replace(/_/g, ' ') ?? 'Workout'}
          </p>
          <h1 className="font-display text-xl font-bold uppercase tracking-wider text-text-primary mt-1">
            {workout.workout_title ?? 'Workout'}
          </h1>
          {workout.estimated_duration_minutes && (
            <p className="font-body text-sm text-text-secondary mt-1">
              ~{workout.estimated_duration_minutes} minutes
            </p>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, i) => (
            <SectionLogger
              key={i}
              index={i}
              content={section}
              isActive={phase === 'active'}
              log={sectionLogs[`section-${i}`]}
              onUpdate={(log) =>
                setSectionLogs((prev) => ({ ...prev, [`section-${i}`]: log }))
              }
            />
          ))}
        </div>

        {/* Actions */}
        {phase === 'preview' && (
          <Button
            onClick={handleStart}
            className="w-full bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider"
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Workout
          </Button>
        )}

        {phase === 'active' && (
          <Button
            onClick={handleFinishWorkout}
            className="w-full bg-semantic-error text-white hover:bg-semantic-error/90 font-display uppercase tracking-wider"
            size="lg"
          >
            <Square className="h-4 w-4 mr-2" />
            Finish Workout
          </Button>
        )}

        {phase === 'logging' && (
          <div className="space-y-6">
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
                placeholder="How did it feel? Anything to note?"
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
              {createWorkout.isPending ? 'Saving...' : 'Log Workout'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
