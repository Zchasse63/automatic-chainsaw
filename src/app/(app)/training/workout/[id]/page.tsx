'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useCreateWorkout } from '@/hooks/use-workouts';
import { Button } from '@/components/ui/button';
import { SectionLogger } from '@/components/training/section-logger';
import { ExerciseCard } from '@/components/training/exercise-card';
import type { ExerciseLog, SetLog } from '@/components/training/exercise-card';
import { RpeSlider } from '@/components/training/rpe-slider';
import { WorkoutSummary } from '@/components/training/workout-summary';
import { useWorkoutTimer } from '@/hooks/use-workout-timer';
import { FloatingTimer } from '@/components/training/timers/floating-timer';
import { ArrowLeft, Play, Square, Clock } from 'lucide-react';
import type { WorkoutDetails, Exercise } from '@/lib/coach/training-plan-schema';

interface WorkoutDay {
  id: string;
  day_of_week: number;
  session_type: string | null;
  workout_title: string | null;
  workout_description: string | null;
  workout_details: WorkoutDetails | null;
  estimated_duration_minutes: number | null;
  is_rest_day: boolean;
  is_completed: boolean;
}

// ── Helpers ───────────────────────────────────────────────

function initSetLog(exercise: Exercise): SetLog {
  return {
    reps: null,
    weight_kg: null,
    distance_m: null,
    duration_seconds: null,
    completed: false,
  };
}

function initExerciseLog(exercise: Exercise): ExerciseLog {
  const numSets = exercise.sets ?? 1;
  return {
    name: exercise.name,
    sets: Array.from({ length: numSets }, () => initSetLog(exercise)),
    notes: '',
    completed: false,
  };
}

function buildExerciseLogs(details: WorkoutDetails): Record<string, ExerciseLog> {
  const logs: Record<string, ExerciseLog> = {};
  const phases: Array<{ key: 'warmup' | 'main' | 'cooldown'; exercises: Exercise[] | undefined }> = [
    { key: 'warmup', exercises: details.warmup },
    { key: 'main', exercises: details.main },
    { key: 'cooldown', exercises: details.cooldown },
  ];
  for (const { key, exercises } of phases) {
    if (!exercises) continue;
    for (let i = 0; i < exercises.length; i++) {
      logs[`${key}-${i}`] = initExerciseLog(exercises[i]);
    }
  }
  return logs;
}

function hasStructuredDetails(details: unknown): details is WorkoutDetails {
  if (!details || typeof details !== 'object') return false;
  const d = details as Record<string, unknown>;
  return Array.isArray(d.main) && d.main.length > 0;
}

// ── Component ─────────────────────────────────────────────

export default function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const createWorkout = useCreateWorkout();
  const { elapsed, isRunning, start, stop, reset, formatTime } = useWorkoutTimer(id);

  const [phase, setPhase] = useState<'preview' | 'active' | 'logging' | 'summary'>('preview');
  const [rpe, setRpe] = useState(5);
  const [notes, setNotes] = useState('');
  // Legacy text-block section logs
  const [sectionLogs, setSectionLogs] = useState<Record<string, { completed: boolean; notes: string }>>({});
  // Structured exercise logs
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, ExerciseLog>>({});

  const { data: workout, isLoading } = useQuery<WorkoutDay>({
    queryKey: ['training-plan-day', id],
    queryFn: async () => {
      const res = await fetch(`/api/training-plans/day/${id}`);
      if (!res.ok) throw new Error('Failed to load workout');
      const data = await res.json();
      return data.day;
    },
  });

  const isStructured = hasStructuredDetails(workout?.workout_details);

  function handleStart() {
    setPhase('active');
    start();
    // Initialize exercise logs when starting a structured workout
    if (isStructured && workout?.workout_details) {
      setExerciseLogs(buildExerciseLogs(workout.workout_details as WorkoutDetails));
    }
  }

  function handleFinishWorkout() {
    stop();
    setPhase('logging');
  }

  async function handleSubmit() {
    const durationMinutes = Math.round(elapsed / 60000);
    const completedWorkout = isStructured
      ? { exercises: exerciseLogs, timer_ms: elapsed }
      : { sections: sectionLogs, timer_ms: elapsed };

    await createWorkout.mutateAsync({
      date: new Date().toISOString().split('T')[0],
      session_type: workout?.session_type ?? 'general',
      duration_minutes: durationMinutes,
      rpe_post: rpe,
      notes: notes || undefined,
      training_plan_day_id: id,
      completed_workout: completedWorkout,
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
    const summaryData = isStructured
      ? { exercises: exerciseLogs }
      : { sections: sectionLogs };

    return (
      <WorkoutSummary
        duration={elapsed}
        rpe={rpe}
        sessionType={workout.session_type ?? 'general'}
        sections={isStructured ? {} : sectionLogs}
        exerciseLogs={isStructured ? exerciseLogs : undefined}
        onDone={() => router.push('/calendar')}
      />
    );
  }

  // Progress calculation
  let totalItems = 0;
  let completedItems = 0;

  if (isStructured) {
    for (const log of Object.values(exerciseLogs)) {
      for (const set of log.sets) {
        totalItems++;
        if (set.completed) completedItems++;
      }
    }
  } else {
    const sections = (workout.workout_description ?? '').split(/\n{2,}/).filter((s) => s.trim());
    totalItems = sections.length;
    completedItems = Object.values(sectionLogs).filter((s) => s.completed).length;
  }

  const progressPct = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  // Parse sections for legacy mode
  const textSections = (workout.workout_description ?? '')
    .split(/\n{2,}/)
    .filter((s) => s.trim());

  // Structured exercise lists
  const details = workout.workout_details as WorkoutDetails | null;
  const exercisePhases: Array<{ key: 'warmup' | 'main' | 'cooldown'; label: string; exercises: Exercise[] }> = [];
  if (isStructured && details) {
    if (details.warmup?.length) exercisePhases.push({ key: 'warmup', label: 'Warm-up', exercises: details.warmup });
    if (details.main?.length) exercisePhases.push({ key: 'main', label: 'Main Workout', exercises: details.main });
    if (details.cooldown?.length) exercisePhases.push({ key: 'cooldown', label: 'Cool-down', exercises: details.cooldown });
  }

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-1 border-b border-border-default">
        <div className="flex items-center justify-between px-4 py-3">
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
        {/* Progress bar during active phase */}
        {phase === 'active' && totalItems > 0 && (
          <div className="h-0.5 bg-surface-3">
            <div
              className="h-full bg-hyrox-yellow transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
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

        {/* Structured Exercise Cards */}
        {isStructured ? (
          <div className="space-y-6">
            {exercisePhases.map(({ key, label, exercises }) => (
              <div key={key} className="space-y-3">
                <h2 className="font-display text-xs uppercase tracking-widest text-text-tertiary">
                  {label}
                </h2>
                {exercises.map((exercise, i) => (
                  <ExerciseCard
                    key={`${key}-${i}`}
                    exercise={exercise}
                    index={i}
                    phase={key}
                    isActive={phase === 'active'}
                    log={exerciseLogs[`${key}-${i}`] ?? initExerciseLog(exercise)}
                    onUpdate={(log) =>
                      setExerciseLogs((prev) => ({ ...prev, [`${key}-${i}`]: log }))
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          /* Legacy Section Cards */
          <div className="space-y-4">
            {textSections.map((section, i) => (
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
        )}

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
          <>
            <FloatingTimer />
            <Button
              onClick={handleFinishWorkout}
              className="w-full bg-semantic-error text-white hover:bg-semantic-error/90 font-display uppercase tracking-wider"
              size="lg"
            >
              <Square className="h-4 w-4 mr-2" />
              Finish Workout
            </Button>
          </>
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
