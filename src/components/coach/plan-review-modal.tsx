'use client';

import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Loader2,
  Check,
  AlertCircle,
  Calendar,
  Dumbbell,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useCreateTrainingPlan } from '@/hooks/use-training-plans';
import type { TrainingPlanInput, TrainingPlanDayInput } from '@/lib/coach/training-plan-schema';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SESSION_COLORS: Record<string, string> = {
  run: 'text-blue-400',
  hiit: 'text-orange-400',
  strength: 'text-purple-400',
  simulation: 'text-[#39FF14]',
  recovery: 'text-cyan-400',
  station_practice: 'text-yellow-400',
  general: 'text-white/60',
  rest: 'text-white/20',
};

interface PlanReviewModalProps {
  messageContent: string;
  conversationId: string | null;
  onClose: () => void;
}

type ExtractionState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; plan: TrainingPlanInput };

export function PlanReviewModal({
  messageContent,
  conversationId,
  onClose,
}: PlanReviewModalProps) {
  const [extraction, setExtraction] = useState<ExtractionState>({
    status: 'loading',
  });
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
  const [accepted, setAccepted] = useState(false);

  const createPlan = useCreateTrainingPlan();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const messageContentRef = useRef(messageContent);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Extract plan from message content — only on mount
  const extractPlan = useCallback(async () => {
    setExtraction({ status: 'loading' });
    try {
      const res = await fetch('/api/training-plans/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageContent: messageContentRef.current }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Extraction failed (${res.status})`);
      }

      const { plan } = await res.json();
      setExtraction({ status: 'success', plan });
    } catch (err) {
      setExtraction({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to extract plan',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    extractPlan();
  }, [extractPlan]);

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
    if (extraction.status !== 'success') return;
    const plan = extraction.plan;

    try {
      await createPlan.mutateAsync({
        plan_name: plan.plan_name,
        goal: plan.goal,
        duration_weeks: plan.duration_weeks,
        start_date: plan.start_date,
        is_ai_generated: true,
        source_conversation_id: conversationId ?? undefined,
        weeks: plan.weeks.map((w) => ({
          week_number: w.week_number,
          focus: w.focus,
          notes: w.notes,
          target_volume_hours: w.target_volume_hours,
          days: w.days.map((d) => ({
            day_of_week: d.day_of_week,
            session_type: d.session_type,
            workout_title: d.workout_title,
            workout_description: d.workout_description,
            workout_details: d.workout_details as Record<string, unknown> | undefined,
            estimated_duration_minutes: d.estimated_duration_minutes,
            is_rest_day: d.is_rest_day,
          })),
        })),
      });
      setAccepted(true);
      // Auto-close after 1.5s (ref cleared on unmount)
      closeTimerRef.current = setTimeout(onClose, 1500);
    } catch {
      // Error shown by mutation state
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-lg max-h-[92vh] bg-[#0f0f0f] rounded-t-3xl sm:rounded-3xl border border-white/10 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5 flex-shrink-0">
            <h3 className="text-base font-black uppercase tracking-tighter">
              Review Training Plan
            </h3>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* Content */}
          <div
            className="flex-1 overflow-y-auto px-5 py-4"
            style={{ scrollbarWidth: 'none', overscrollBehavior: 'contain' }}
          >
            {/* Loading state */}
            {extraction.status === 'loading' && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2
                  size={28}
                  className="text-[#39FF14] animate-spin"
                />
                <p className="text-sm text-white/40">
                  Extracting plan structure...
                </p>
                <p className="text-[10px] text-white/20">
                  This can take a few seconds
                </p>
              </div>
            )}

            {/* Error state */}
            {extraction.status === 'error' && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle size={24} className="text-red-400" />
                </div>
                <p className="text-sm text-red-400 text-center">
                  {extraction.message}
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={extractPlan}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors"
                >
                  Try Again
                </motion.button>
              </div>
            )}

            {/* Success state — plan details */}
            {extraction.status === 'success' && (
              <div className="space-y-4">
                {/* Plan overview */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <h4 className="text-sm font-bold text-white mb-2">
                    {extraction.plan.plan_name}
                  </h4>
                  {extraction.plan.goal && (
                    <p className="text-xs text-white/40 mb-2">
                      {extraction.plan.goal}
                    </p>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-[10px] text-white/30">
                      <Calendar size={10} />
                      {extraction.plan.duration_weeks} weeks
                    </span>
                    {extraction.plan.difficulty && (
                      <span className="text-[10px] text-white/30 capitalize">
                        {extraction.plan.difficulty}
                      </span>
                    )}
                  </div>
                </div>

                {/* Week breakdown */}
                {extraction.plan.weeks.map((week) => {
                  const isExpanded = expandedWeeks.has(week.week_number);
                  const sessionCount = week.days.filter(
                    (d) => !d.is_rest_day
                  ).length;

                  return (
                    <div
                      key={week.week_number}
                      className="bg-white/5 rounded-xl border border-white/5 overflow-hidden"
                    >
                      {/* Week header — tap to expand */}
                      <button
                        onClick={() => toggleWeek(week.week_number)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                      >
                        <div>
                          <span className="text-xs font-bold text-white">
                            Week {week.week_number}
                          </span>
                          {week.focus && (
                            <span className="text-[10px] text-white/30 ml-2">
                              — {week.focus}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/20">
                            {sessionCount} sessions
                          </span>
                          {isExpanded ? (
                            <ChevronUp size={14} className="text-white/30" />
                          ) : (
                            <ChevronDown size={14} className="text-white/30" />
                          )}
                        </div>
                      </button>

                      {/* Days — expanded */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 space-y-2 border-t border-white/5 pt-2">
                              {week.days.map((day, idx) => (
                                <DayRow key={idx} day={day} />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer — Accept button */}
          {extraction.status === 'success' && (
            <div className="px-5 py-4 border-t border-white/5 flex-shrink-0">
              {accepted ? (
                <div className="flex items-center justify-center gap-2 py-2.5">
                  <Check size={16} className="text-[#39FF14]" />
                  <span className="text-sm font-bold text-[#39FF14]">
                    Plan accepted!
                  </span>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAccept}
                  disabled={createPlan.isPending}
                  className="w-full py-3 rounded-xl bg-[#39FF14] text-black text-xs font-black uppercase tracking-widest hover:bg-[#39FF14]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createPlan.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Check size={14} />
                      Accept Plan
                    </>
                  )}
                </motion.button>
              )}
              {createPlan.isError && (
                <p className="text-xs text-red-400 text-center mt-2">
                  {createPlan.error?.message || 'Failed to save plan'}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Day row within a week ──
function DayRow({ day }: { day: TrainingPlanDayInput }) {
  const colorClass =
    SESSION_COLORS[day.session_type ?? 'general'] ?? 'text-white/40';

  if (day.is_rest_day) {
    return (
      <div className="flex items-center gap-3 py-1.5 opacity-40">
        <span className="text-[10px] font-bold text-white/30 w-7">
          {DAY_NAMES[day.day_of_week] ?? '?'}
        </span>
        <span className="text-xs text-white/20 italic">Rest</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="text-[10px] font-bold text-white/40 w-7 pt-0.5">
        {DAY_NAMES[day.day_of_week] ?? '?'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white truncate">
            {day.workout_title}
          </span>
          {day.session_type && (
            <span
              className={`text-[9px] font-bold uppercase tracking-widest ${colorClass}`}
            >
              {day.session_type.replace('_', ' ')}
            </span>
          )}
        </div>
        {day.workout_description && (
          <p className="text-[10px] text-white/30 mt-0.5 line-clamp-2">
            {day.workout_description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1">
          {day.estimated_duration_minutes && (
            <span className="flex items-center gap-0.5 text-[9px] text-white/20">
              <Clock size={8} />
              {day.estimated_duration_minutes}min
            </span>
          )}
          {day.workout_details?.main && (
            <span className="flex items-center gap-0.5 text-[9px] text-white/20">
              <Dumbbell size={8} />
              {day.workout_details.main.length} exercises
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
