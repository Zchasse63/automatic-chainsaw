'use client';

import { motion } from 'motion/react';
import {
  Dumbbell,
  Clock,
  ChevronRight,
  Moon,
  Zap,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { useDashboard } from '@/hooks/use-dashboard';
import { WorkoutBadge } from '@/components/shared';
import { getSessionInfo, formatSessionType } from '@/lib/session-utils';

// ── Skeleton ─────────────────────────────────────────────────────────────────

function TodaySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-bg-card rounded-3xl p-6 border border-white/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/5 rounded w-32" />
            <div className="h-5 bg-white/5 rounded w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/3 rounded-xl p-3 h-16" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TodayWorkoutPage() {
  const { data, isLoading } = useDashboard();
  const todaysWorkout = data?.todaysWorkout;
  const activePlan = data?.activePlan;

  const hasWorkout = todaysWorkout && !todaysWorkout.is_completed;
  const isCompleted = todaysWorkout?.is_completed;
  const sessionInfo = getSessionInfo(todaysWorkout?.session_type ?? null);
  const Icon = sessionInfo.icon;

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const todayName = dayNames[(new Date().getDay() + 6) % 7];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28 }}
      className="flex-1 overflow-y-auto px-6 pt-6 pb-32 bg-bg-deep min-h-screen"
    >
      {/* Header */}
      <header className="mb-6">
        <p className="text-[10px] text-[#39FF14] font-bold uppercase tracking-[0.25em] mb-1">
          {todayName}
        </p>
        <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
          Today&apos;s <span className="text-[#39FF14]">Workout</span>
        </h2>
        {activePlan && (
          <p className="text-white/40 text-sm mt-1">
            Week {activePlan.currentWeek}/{activePlan.totalWeeks} &middot; {activePlan.plan_name}
          </p>
        )}
      </header>

      {isLoading ? (
        <TodaySkeleton />
      ) : hasWorkout ? (
        /* ── Active Workout Card ──────────────────────────────────────── */
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-gradient-to-br from-[#1a1a1a] to-[#161616] border border-white/8 rounded-3xl p-6 relative overflow-hidden"
          >
            {/* Accent corner */}
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-10"
              style={{ background: sessionInfo.color }}
            />

            <div className="relative z-10">
              {/* Type + title */}
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: `${sessionInfo.color}18`,
                    border: `1px solid ${sessionInfo.color}40`,
                  }}
                >
                  <Icon size={24} style={{ color: sessionInfo.color }} />
                </div>
                <div className="flex-1">
                  <WorkoutBadge type={formatSessionType(todaysWorkout.session_type)} />
                  <h3 className="text-lg font-black italic tracking-tighter uppercase text-white mt-1 leading-tight">
                    {todaysWorkout.workout_title || formatSessionType(todaysWorkout.session_type)}
                  </h3>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {todaysWorkout.estimated_duration_minutes && (
                  <div className="bg-white/3 rounded-xl p-3 flex items-center gap-3">
                    <Clock size={14} className="text-white/30" />
                    <div>
                      <p className="text-lg font-black italic text-white leading-none">
                        {todaysWorkout.estimated_duration_minutes}
                      </p>
                      <p className="text-[8px] text-white/40 uppercase font-bold tracking-widest">
                        Minutes
                      </p>
                    </div>
                  </div>
                )}
                <div className="bg-white/3 rounded-xl p-3 flex items-center gap-3">
                  <Zap size={14} className="text-white/30" />
                  <div>
                    <p className="text-lg font-black italic text-white leading-none">
                      {formatSessionType(todaysWorkout.session_type)}
                    </p>
                    <p className="text-[8px] text-white/40 uppercase font-bold tracking-widest">
                      Type
                    </p>
                  </div>
                </div>
              </div>

              {/* Start Session CTA */}
              <Link href={`/workout/${todaysWorkout.id}`}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className="w-full bg-[#39FF14] text-black text-sm font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_4px_20px_rgba(57,255,20,0.4)] flex items-center justify-center gap-2"
                >
                  Start Session <ChevronRight size={16} />
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Plan progress */}
          {activePlan && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="bg-bg-card rounded-2xl p-5 border border-white/5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                  Plan Progress
                </span>
                <span className="text-sm font-black italic text-[#39FF14]">
                  {activePlan.progressPct}%
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#39FF14] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${activePlan.progressPct}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </motion.div>
          )}
        </div>
      ) : isCompleted ? (
        /* ── Completed State ─────────────────────────────────────────── */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center mx-auto mb-5">
            <Award size={32} className="text-[#39FF14]" />
          </div>
          <h3 className="text-xl font-black italic tracking-tighter uppercase text-white mb-2">
            Session Complete
          </h3>
          <p className="text-white/40 text-sm max-w-[260px] mx-auto">
            Great work today! Check your workout log for details.
          </p>
          <Link href="/log">
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="mt-6 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white/70 hover:text-white transition-colors"
            >
              View Log
            </motion.button>
          </Link>
        </motion.div>
      ) : !activePlan ? (
        /* ── No Plan State ───────────────────────────────────────────── */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-5">
            <Dumbbell size={32} className="text-white/20" />
          </div>
          <h3 className="text-xl font-black italic tracking-tighter uppercase text-white mb-2">
            No Training Plan
          </h3>
          <p className="text-white/40 text-sm max-w-[260px] mx-auto">
            Ask Coach K to generate a personalized training plan to get started.
          </p>
          <Link href="/coach">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className="mt-6 bg-[#39FF14] text-black text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(57,255,20,0.4)]"
            >
              Talk to Coach K
            </motion.button>
          </Link>
        </motion.div>
      ) : (
        /* ── Rest Day State ──────────────────────────────────────────── */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center mx-auto mb-5">
            <Moon size={32} className="text-[#00F0FF]" />
          </div>
          <h3 className="text-xl font-black italic tracking-tighter uppercase text-white mb-2">
            Rest Day
          </h3>
          <p className="text-white/40 text-sm max-w-[260px] mx-auto">
            Recovery is part of the plan. Focus on mobility, sleep, and nutrition today.
          </p>
          {activePlan && (
            <p className="text-white/25 text-xs mt-4">
              Week {activePlan.currentWeek} of {activePlan.totalWeeks}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
