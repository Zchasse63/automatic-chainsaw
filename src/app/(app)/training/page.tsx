'use client';

import { Button } from '@/components/ui/button';
import {
  CalendarDays,
  CalendarRange,
  ChevronRight,
  Dumbbell,
  LayoutGrid,
  MessageSquare,
  Play,
  Plus,
  Check,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useWorkouts } from '@/hooks/use-workouts';
import {
  useActiveTrainingPlan,
  useTrainingPlan,
} from '@/hooks/use-training-plans';
import { WeekCalendar } from '@/components/training/week-calendar';
import { MonthCalendar } from '@/components/training/month-calendar';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useRouter } from 'next/navigation';
import { useUpdatePlanDay } from '@/hooks/use-training-plans';
import { toast } from 'sonner';

const SESSION_LABELS: Record<string, string> = {
  run: 'Run',
  hiit: 'HIIT',
  strength: 'Strength',
  simulation: 'Simulation',
  recovery: 'Recovery',
  station_practice: 'Station Practice',
  general: 'General',
};

interface PlanDay {
  id: string;
  day_of_week: number;
  session_type: string | null;
  workout_title: string | null;
  workout_description: string | null;
  estimated_duration_minutes: number | null;
  is_rest_day: boolean | null;
  is_completed: boolean | null;
}

export default function TrainingPage() {
  const router = useRouter();
  const { data: workouts = [], isLoading: workoutsLoading } = useWorkouts({
    limit: 10,
  });
  const { activePlan, isLoading: plansLoading } = useActiveTrainingPlan();
  const { data: planDetail } = useTrainingPlan(activePlan?.id ?? null);

  const updatePlanDay = useUpdatePlanDay();
  const [selectedDay, setSelectedDay] = useState<PlanDay | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');

  const loading = workoutsLoading || plansLoading;

  function handleDayClick(day: PlanDay) {
    setSelectedDay(day);
    setDrawerOpen(true);
  }

  // Calculate plan progress
  const totalDays =
    planDetail?.training_plan_weeks?.reduce(
      (sum, w) => sum + (w.training_plan_days?.length ?? 0),
      0
    ) ?? 0;
  const completedDays =
    planDetail?.training_plan_weeks?.reduce(
      (sum, w) =>
        sum +
        (w.training_plan_days?.filter((d) => d.is_completed)?.length ?? 0),
      0
    ) ?? 0;
  const progressPct = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

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

      {/* Active Plan + Calendar */}
      <section className="space-y-4">
        {activePlan && planDetail ? (
          <>
            {/* Plan header */}
            <div className="bg-surface-1 border border-border-default rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-display text-base font-bold uppercase tracking-wider text-text-primary">
                    {activePlan.plan_name}
                  </h3>
                  {activePlan.goal && (
                    <p className="font-body text-xs text-text-secondary mt-0.5">
                      {activePlan.goal}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs text-text-tertiary">
                    {completedDays}/{totalDays} sessions
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-hyrox-yellow rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Calendar view toggle */}
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => setCalendarView('week')}
                className={`p-1.5 rounded transition-colors ${
                  calendarView === 'week'
                    ? 'bg-hyrox-yellow/20 text-hyrox-yellow'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
                title="Week view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCalendarView('month')}
                className={`p-1.5 rounded transition-colors ${
                  calendarView === 'month'
                    ? 'bg-hyrox-yellow/20 text-hyrox-yellow'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
                title="Month view"
              >
                <CalendarRange className="h-4 w-4" />
              </button>
            </div>

            {/* Week or Month calendar */}
            {calendarView === 'week' &&
              planDetail.training_plan_weeks &&
              planDetail.training_plan_weeks.length > 0 &&
              activePlan.start_date && (
                <WeekCalendar
                  weeks={planDetail.training_plan_weeks}
                  planId={activePlan.id}
                  startDate={activePlan.start_date}
                  totalWeeks={activePlan.duration_weeks ?? 1}
                  onDayClick={handleDayClick}
                />
              )}
            {calendarView === 'month' && <MonthCalendar />}
          </>
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

      {/* Ask Coach K with context */}
      {activePlan && planDetail && (
        <Link
          href={`/coach?context=plan&planName=${encodeURIComponent(activePlan.plan_name)}`}
          className="block bg-hyrox-yellow/5 border border-hyrox-yellow/20 rounded-lg px-4 py-3 hover:bg-hyrox-yellow/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-hyrox-yellow" />
            <span className="font-display text-xs font-bold uppercase tracking-wider text-text-primary group-hover:text-hyrox-yellow transition-colors">
              Ask Coach K about this plan
            </span>
          </div>
        </Link>
      )}

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
                      {SESSION_LABELS[w.session_type] || w.session_type || 'General'}
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

      {/* Workout detail drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="bg-surface-1 border-border-default">
          {selectedDay && (
            <div className="p-6 space-y-4">
              <DrawerHeader className="p-0">
                <DrawerTitle className="font-display text-lg font-bold uppercase tracking-wider text-text-primary">
                  {selectedDay.is_rest_day
                    ? 'Rest Day'
                    : selectedDay.workout_title || 'Workout'}
                </DrawerTitle>
              </DrawerHeader>

              {!selectedDay.is_rest_day && (
                <>
                  {selectedDay.session_type && (
                    <span className="inline-block font-display text-[10px] uppercase tracking-[0.2em] text-text-tertiary border border-border-default px-2 py-0.5 rounded-sm bg-surface-2">
                      {SESSION_LABELS[selectedDay.session_type] ||
                        selectedDay.session_type}
                    </span>
                  )}

                  {selectedDay.workout_description && (
                    <p className="font-body text-sm text-text-secondary whitespace-pre-wrap">
                      {selectedDay.workout_description}
                    </p>
                  )}

                  {selectedDay.estimated_duration_minutes && (
                    <p className="font-mono text-xs text-text-tertiary">
                      Est. {selectedDay.estimated_duration_minutes} min
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => {
                        setDrawerOpen(false);
                        router.push(
                          `/training/workout/${selectedDay.id}`
                        );
                      }}
                      className="flex-1 bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider text-xs"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start Workout
                    </Button>
                    {!selectedDay.is_completed && (
                      <Button
                        variant="outline"
                        onClick={async () => {
                          if (!activePlan) return;
                          try {
                            await updatePlanDay.mutateAsync({
                              planId: activePlan.id,
                              dayId: selectedDay.id,
                              data: { is_completed: true },
                            });
                            toast.success('Workout marked complete');
                            setDrawerOpen(false);
                          } catch {
                            toast.error('Failed to mark complete');
                          }
                        }}
                        disabled={updatePlanDay.isPending}
                        className="border-border-default text-text-secondary font-display uppercase tracking-wider text-xs"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Mark Done
                      </Button>
                    )}
                  </div>
                </>
              )}

              {selectedDay.is_rest_day && (
                <p className="font-body text-sm text-text-secondary">
                  Take it easy today. Recovery is where adaptation happens.
                </p>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
