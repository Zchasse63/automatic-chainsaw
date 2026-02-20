'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  useActiveTrainingPlan,
  useTrainingPlan,
} from '@/hooks/use-training-plans';
import { useWorkouts } from '@/hooks/use-workouts';
import {
  buildPlanDayMap,
  buildWorkoutMap,
  getCurrentWeekStart,
  getWeekDays,
  toISODateString,
} from '@/lib/calendar-utils';
import { SESSION_TYPE_COLORS } from '@/components/training/week-calendar';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeekStrip() {
  const weekStart = useMemo(() => getCurrentWeekStart(), []);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const fromDate = toISODateString(weekDays[0]);
  const toDate = toISODateString(weekDays[6]);

  const { activePlan } = useActiveTrainingPlan();
  const { data: planDetail } = useTrainingPlan(activePlan?.id ?? null);
  const { data: workouts = [] } = useWorkouts({ from: fromDate, to: toDate, limit: 50 });

  const planDayMap = useMemo(
    () =>
      buildPlanDayMap(
        activePlan?.start_date ?? null,
        planDetail?.training_plan_weeks ?? []
      ),
    [activePlan?.start_date, planDetail]
  );

  const workoutMap = useMemo(() => buildWorkoutMap(workouts), [workouts]);

  const todayStr = toISODateString(new Date());

  return (
    <div className="col-span-2 bg-surface-1 border border-border-default rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-display text-[10px] uppercase tracking-widest text-text-tertiary">
          This Week
        </span>
        <Link
          href="/calendar"
          className="font-display text-[10px] uppercase tracking-wider text-hyrox-yellow hover:text-hyrox-yellow-hover transition-colors"
        >
          View All
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((date, i) => {
          const dateStr = toISODateString(date);
          const planDay = planDayMap.get(dateStr);
          const dayWorkouts = workoutMap.get(dateStr) ?? [];
          const isToday = dateStr === todayStr;
          const isRest = planDay?.is_rest_day;
          const isCompleted = planDay?.is_completed || dayWorkouts.length > 0;
          const sessionType = planDay?.session_type ?? null;
          const colorClass = sessionType ? SESSION_TYPE_COLORS[sessionType] ?? 'bg-surface-4' : null;

          return (
            <Link
              key={dateStr}
              href={`/calendar?date=${dateStr}`}
              className={`flex flex-col items-center gap-1 py-2 rounded transition-colors hover:bg-surface-2 ${
                isToday ? 'bg-surface-2' : ''
              }`}
            >
              <span className={`font-display text-[10px] uppercase tracking-widest ${
                isToday ? 'text-hyrox-yellow' : 'text-text-tertiary'
              }`}>
                {DAY_LABELS[i]}
              </span>
              <span className={`font-mono text-sm ${
                isToday ? 'text-hyrox-yellow font-bold' : 'text-text-primary'
              }`}>
                {date.getDate()}
              </span>
              {/* Status indicator */}
              <div className="h-2.5 w-2.5 rounded-full flex-shrink-0">
                {isCompleted ? (
                  <div className={`h-full w-full rounded-full ${colorClass ?? 'bg-coach-green'}`} />
                ) : isRest ? (
                  <div className="h-full w-full rounded-full bg-surface-4" />
                ) : planDay ? (
                  <div className={`h-full w-full rounded-full border ${
                    colorClass
                      ? colorClass.replace('bg-', 'border-')
                      : 'border-text-tertiary'
                  } opacity-50`} />
                ) : (
                  <div className="h-full w-full" /> // empty space for alignment
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
