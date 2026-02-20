'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUpdatePlanDay } from '@/hooks/use-training-plans';
import { SESSION_TYPE_COLORS } from '@/components/training/week-calendar';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Check, Play, Plus, MessageSquare, X } from 'lucide-react';
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

interface Workout {
  id: string;
  date: string;
  session_type: string;
  duration_minutes: number | null;
  rpe_post: number | null;
  notes: string | null;
}

interface CalendarDayDetailProps {
  open: boolean;
  date: string | null;
  planDay: PlanDay | undefined;
  workouts: Workout[];
  planId: string | null;
  onClose: () => void;
}

// --- Sub-components ---

function SessionTypeBadge({ sessionType }: { sessionType: string }) {
  const color = SESSION_TYPE_COLORS[sessionType] ?? 'bg-surface-4';
  return (
    <span className={`inline-block font-display text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-sm text-white ${color}`}>
      {SESSION_LABELS[sessionType] ?? sessionType}
    </span>
  );
}

function RestDayContent() {
  return (
    <div>
      <p className="font-display text-sm uppercase tracking-wider text-text-tertiary">Rest Day</p>
      <p className="font-body text-sm text-text-secondary mt-1">
        Recovery is where adaptation happens. Take it easy.
      </p>
    </div>
  );
}

function WorkoutList({ workouts }: { workouts: Workout[] }) {
  if (workouts.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-text-primary">
        Logged Workouts
      </h3>
      {workouts.map((w) => (
        <div key={w.id} className="bg-surface-2 border border-border-default rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-surface-3 text-text-secondary">
              {SESSION_LABELS[w.session_type] ?? w.session_type}
            </span>
            {w.duration_minutes && (
              <span className="font-mono text-xs text-text-tertiary">{w.duration_minutes} min</span>
            )}
            {w.rpe_post && (
              <span className="font-mono text-xs text-text-tertiary">RPE {w.rpe_post}</span>
            )}
          </div>
          {w.notes && <p className="font-body text-xs text-text-secondary">{w.notes}</p>}
        </div>
      ))}
    </div>
  );
}

function DayActions({
  planDay,
  planId,
  date,
  onClose,
}: {
  planDay: PlanDay;
  planId: string | null;
  date: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const updatePlanDay = useUpdatePlanDay();
  const [completing, setCompleting] = useState(false);

  async function handleMarkComplete() {
    if (!planId) return;
    setCompleting(true);
    try {
      await updatePlanDay.mutateAsync({ planId, dayId: planDay.id, data: { is_completed: true } });
      toast.success('Workout marked complete');
      onClose();
    } catch {
      toast.error('Failed to mark complete');
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="flex gap-2 pt-1">
      <Button
        onClick={() => { onClose(); router.push(`/training/workout/${planDay.id}`); }}
        className="flex-1 bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider text-xs"
      >
        <Play className="h-4 w-4 mr-1" /> Start Workout
      </Button>
      <Button
        variant="outline"
        onClick={handleMarkComplete}
        disabled={completing || updatePlanDay.isPending}
        className="border-border-default text-text-secondary font-display uppercase tracking-wider text-xs"
      >
        <Check className="h-4 w-4 mr-1" /> Mark Done
      </Button>
    </div>
  );
}

function UtilityLinks({ date, onClose }: { date: string; onClose: () => void }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-border-default">
      <Button
        variant="outline"
        onClick={() => { onClose(); router.push(`/training/log?date=${date}`); }}
        className="w-full border-border-default text-text-secondary font-display uppercase tracking-wider text-xs"
      >
        <Plus className="h-4 w-4 mr-1" />
        Log Workout
      </Button>
      <Button
        variant="outline"
        onClick={() => { onClose(); router.push(`/coach?context=plan&date=${date}`); }}
        className="w-full border-border-default text-text-secondary font-display uppercase tracking-wider text-xs"
      >
        <MessageSquare className="h-4 w-4 mr-1" /> Ask Coach K
      </Button>
    </div>
  );
}

// --- Main content assembler ---

function DetailContent({ date, planDay, workouts, planId, onClose }: Omit<CalendarDayDetailProps, 'open'>) {
  if (!date) return null;

  const displayDate = new Date(date + 'T00:00:00');
  const formattedDate = displayDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const sessionType = planDay?.session_type ?? null;

  return (
    <div className="p-6 space-y-5">
      <p className="font-mono text-xs text-text-tertiary uppercase tracking-widest">{formattedDate}</p>

      {planDay && !planDay.is_rest_day && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-bold uppercase tracking-wider text-text-primary">
              Planned Session
            </h3>
            {planDay.is_completed && (
              <span className="flex items-center gap-1 font-display text-[10px] uppercase tracking-wider text-coach-green">
                <Check className="h-3 w-3" /> Done
              </span>
            )}
          </div>
          {sessionType && <SessionTypeBadge sessionType={sessionType} />}
          {planDay.workout_title && (
            <p className="font-body text-sm font-semibold text-text-primary">{planDay.workout_title}</p>
          )}
          {planDay.workout_description && (
            <p className="font-body text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
              {planDay.workout_description}
            </p>
          )}
          {planDay.estimated_duration_minutes && (
            <p className="font-mono text-xs text-text-tertiary">Est. {planDay.estimated_duration_minutes} min</p>
          )}
          {!planDay.is_completed && <DayActions planDay={planDay} planId={planId} date={date} onClose={onClose} />}
        </div>
      )}

      {planDay?.is_rest_day && <RestDayContent />}

      <WorkoutList workouts={workouts} />

      <UtilityLinks date={date} onClose={onClose} />
    </div>
  );
}

export function CalendarDayDetail({ open, date, planDay, workouts, planId, onClose }: CalendarDayDetailProps) {
  const title = planDay?.is_rest_day ? 'Rest Day' : planDay?.workout_title || (date ? 'Day Detail' : '');

  return (
    <>
      <div className="md:hidden">
        <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
          <DrawerContent className="bg-surface-1 border-border-default">
            <DrawerHeader className="p-4 pb-0">
              <DrawerTitle className="font-display text-lg font-bold uppercase tracking-wider text-text-primary">
                {title}
              </DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto max-h-[80vh]">
              <DetailContent date={date} planDay={planDay} workouts={workouts} planId={planId} onClose={onClose} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {open && (
        <div className="hidden md:flex flex-col w-80 shrink-0 bg-surface-1 border border-border-default rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
            <span className="font-display text-sm font-bold uppercase tracking-wider text-text-primary">{title}</span>
            <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1">
            <DetailContent date={date} planDay={planDay} workouts={workouts} planId={planId} onClose={onClose} />
          </div>
        </div>
      )}
    </>
  );
}
