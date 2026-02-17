'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Check,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { useCreateTrainingPlan } from '@/hooks/use-training-plans';
import { toast } from 'sonner';
import type { TrainingPlanInput } from '@/lib/coach/training-plan-schema';

const SESSION_TYPE_COLORS: Record<string, string> = {
  run: 'bg-station-ski text-white',
  hiit: 'bg-station-push text-white',
  strength: 'bg-station-carry text-white',
  simulation: 'bg-hyrox-yellow text-text-inverse',
  recovery: 'bg-coach-green text-white',
  station_practice: 'bg-station-burpee text-white',
  general: 'bg-surface-3 text-text-primary',
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface PlanReviewModalProps {
  open: boolean;
  onClose: () => void;
  plan: TrainingPlanInput;
  conversationId?: string;
}

export function PlanReviewModal({
  open,
  onClose,
  plan,
  conversationId,
}: PlanReviewModalProps) {
  const [startDate, setStartDate] = useState(
    plan.start_date || new Date().toISOString().split('T')[0]
  );
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(
    new Set([1])
  );
  const [saved, setSaved] = useState(false);
  const createPlan = useCreateTrainingPlan();

  function toggleWeek(weekNum: number) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekNum)) {
        next.delete(weekNum);
      } else {
        next.add(weekNum);
      }
      return next;
    });
  }

  async function handleAccept() {
    try {
      await createPlan.mutateAsync({
        plan_name: plan.plan_name,
        goal: plan.goal,
        duration_weeks: plan.duration_weeks,
        start_date: startDate,
        is_ai_generated: true,
        source_conversation_id: conversationId,
        weeks: plan.weeks,
      });
      setSaved(true);
      toast.success('Training plan activated');
      setTimeout(() => {
        onClose();
        setSaved(false);
      }, 1500);
    } catch {
      toast.error('Failed to save training plan');
    }
  }

  const totalSessions = plan.weeks.reduce(
    (sum, w) => sum + w.days.filter((d) => !d.is_rest_day).length,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-surface-1 border-border-default">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold uppercase tracking-wider text-text-primary">
            Review Training Plan
          </DialogTitle>
        </DialogHeader>

        {/* Plan summary */}
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-display text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
                Plan
              </p>
              <p className="font-body text-sm text-text-primary mt-0.5">
                {plan.plan_name}
              </p>
            </div>
            <div>
              <p className="font-display text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
                Duration
              </p>
              <p className="font-body text-sm text-text-primary mt-0.5">
                {plan.duration_weeks} weeks &middot; {totalSessions} sessions
              </p>
            </div>
          </div>

          {plan.goal && (
            <div>
              <p className="font-display text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
                Goal
              </p>
              <p className="font-body text-sm text-text-secondary mt-0.5">
                {plan.goal}
              </p>
            </div>
          )}

          {/* Start date */}
          <div className="space-y-1.5">
            <Label className="font-display text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
              Start Date
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-48 h-9 bg-surface-2 border-border-default font-mono text-sm"
            />
          </div>

          {/* Week-by-week accordion */}
          <div className="space-y-1 border-t border-border-default pt-4">
            {plan.weeks.map((week) => {
              const isExpanded = expandedWeeks.has(week.week_number);
              const workoutCount = week.days.filter(
                (d) => !d.is_rest_day
              ).length;

              return (
                <div
                  key={week.week_number}
                  className="border border-border-default rounded-sm overflow-hidden"
                >
                  <button
                    onClick={() => toggleWeek(week.week_number)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-surface-2 hover:bg-surface-3 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-text-tertiary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-text-tertiary" />
                    )}
                    <span className="font-display text-xs uppercase tracking-wider text-text-primary">
                      Week {week.week_number}
                    </span>
                    {week.focus && (
                      <span className="font-body text-xs text-text-secondary">
                        — {week.focus}
                      </span>
                    )}
                    <span className="ml-auto font-mono text-[10px] text-text-tertiary">
                      {workoutCount} sessions
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-border-default">
                      {week.days.map((day, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-3 py-2 bg-surface-1"
                        >
                          <span className="font-mono text-[10px] text-text-tertiary w-8">
                            {DAY_NAMES[day.day_of_week] || '?'}
                          </span>

                          {day.is_rest_day ? (
                            <span className="font-body text-xs text-text-tertiary italic">
                              Rest day
                            </span>
                          ) : (
                            <>
                              <span
                                className={`px-1.5 py-0.5 rounded-sm font-display text-[9px] uppercase tracking-wider ${
                                  SESSION_TYPE_COLORS[
                                    day.session_type || 'general'
                                  ] || SESSION_TYPE_COLORS.general
                                }`}
                              >
                                {day.session_type || 'general'}
                              </span>
                              <span className="font-body text-xs text-text-primary flex-1 truncate">
                                {day.workout_title}
                              </span>
                              {day.estimated_duration_minutes && (
                                <span className="font-mono text-[10px] text-text-tertiary">
                                  {day.estimated_duration_minutes}min
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-border-default">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border-default text-text-secondary font-display uppercase tracking-wider text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={createPlan.isPending || saved}
              className="flex-1 bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider text-xs shadow-glow-md"
            >
              {saved ? (
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Saved
                </span>
              ) : createPlan.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" /> Accept & Activate
                </span>
              )}
            </Button>
          </div>

          {createPlan.isError && (
            <p className="font-body text-xs text-semantic-error">
              {createPlan.error.message}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
