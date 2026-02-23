'use client';

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Zap,
  Dumbbell,
  Timer,
  Heart,
  Wind,
  Flame,
  Award,
  ChevronDown,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useWorkouts } from '@/hooks/use-workouts';
import { WorkoutBadge } from '@/components/shared';

// ── Types ────────────────────────────────────────────────────────────────────

type FilterKey = 'All' | 'Hyrox Sim' | 'Running' | 'HIIT' | 'Strength' | 'Recovery';

interface LogCardProps {
  workout: {
    id: string;
    date: string;
    session_type: string;
    duration_minutes: number | null;
    rpe_post: number | null;
    notes: string | null;
    completion_status: string | null;
  };
  index: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, { icon: typeof Activity; color: string }> = {
  running: { icon: Wind, color: '#00F0FF' },
  hiit: { icon: Flame, color: '#FF6B00' },
  strength: { icon: Dumbbell, color: '#B45FFF' },
  'hyrox sim': { icon: Award, color: '#39FF14' },
  hyrox_sim: { icon: Award, color: '#39FF14' },
  simulation: { icon: Timer, color: '#39FF14' },
  recovery: { icon: Heart, color: '#00F0FF' },
  crossfit: { icon: Zap, color: '#FF6B00' },
};

function getTypeInfo(sessionType: string) {
  const key = sessionType.toLowerCase().replace(/_/g, ' ');
  // Try direct match, then partial matches
  if (TYPE_ICONS[key]) return TYPE_ICONS[key];
  for (const [k, v] of Object.entries(TYPE_ICONS)) {
    if (key.includes(k)) return v;
  }
  return { icon: Activity, color: '#39FF14' };
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '--';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}`;
  return `${mins} MIN`;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const FILTERS: FilterKey[] = ['All', 'Hyrox Sim', 'Running', 'HIIT', 'Strength', 'Recovery'];

function matchesFilter(sessionType: string, filter: FilterKey): boolean {
  if (filter === 'All') return true;
  const normalized = sessionType.toLowerCase().replace(/_/g, ' ');
  return normalized.includes(filter.toLowerCase());
}

// ── LogCard ──────────────────────────────────────────────────────────────────

const LogCard = memo(({ workout, index }: LogCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = getTypeInfo(workout.session_type);
  const Icon = typeInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden"
    >
      <button
        className="w-full flex items-center gap-4 p-4 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${typeInfo.color}18`,
            border: `1px solid ${typeInfo.color}40`,
          }}
        >
          <Icon size={16} style={{ color: typeInfo.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: typeInfo.color }}
            >
              {workout.session_type.replace(/_/g, ' ')}
            </span>
            {workout.completion_status === 'pr' && (
              <span className="px-1.5 py-0.5 bg-[#39FF14] text-black text-[8px] font-black rounded uppercase">
                PR
              </span>
            )}
          </div>
          <p className="text-sm font-bold truncate text-white">
            {workout.session_type.replace(/_/g, ' ')}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-white/30">
              {formatDateShort(workout.date)} &middot; {formatDuration(workout.duration_minutes)}
            </p>
            {workout.rpe_post && (
              <span className="text-[9px] font-bold text-white/20">RPE {workout.rpe_post}</span>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} className="text-white/30 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/5">
              <p className="text-[12px] text-white/55 leading-relaxed mt-3">
                {workout.notes || 'No notes recorded for this session.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
LogCard.displayName = 'LogCard';

// ── Skeleton ─────────────────────────────────────────────────────────────────

function LogSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="bg-bg-card rounded-2xl border border-white/5 p-4 animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-2 bg-white/5 rounded w-20" />
              <div className="h-3 bg-white/5 rounded w-40" />
              <div className="h-2 bg-white/5 rounded w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function WorkoutLogPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const { data: workouts, isLoading } = useWorkouts({ limit: 50 });

  const filtered = workouts?.filter((w) => matchesFilter(w.session_type, activeFilter)) ?? [];

  // Summary stats
  const totalSessions = workouts?.length ?? 0;

  // Best simulation time (duration_minutes is integer — format as H:MM or MM)
  const simWorkouts = workouts?.filter((w) => w.session_type === 'hyrox_sim') ?? [];
  const bestSimMinutes = simWorkouts.length > 0
    ? Math.min(...simWorkouts.map((w) => w.duration_minutes ?? Infinity))
    : null;
  const bestSim = bestSimMinutes && bestSimMinutes < Infinity
    ? formatDuration(bestSimMinutes)
    : '--';

  // Total running kilometers
  const totalKmsValue = workouts?.reduce((sum, w) => sum + (w.total_distance_km ?? 0), 0) ?? 0;
  const totalKms = totalKmsValue > 0 ? Math.round(totalKmsValue).toString() : '--';

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28 }}
      className="flex-1 overflow-y-auto px-6 pt-14 pb-32 bg-bg-deep min-h-screen"
    >
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
            Workout <span className="text-[#39FF14]">Log</span>
          </h2>
          <p className="text-white/40 text-sm mt-1">Training history &middot; Hyrox prep block</p>
        </div>
        <Link href="/workout/new">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-[#39FF14] flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.3)]"
            aria-label="Start new session"
          >
            <Plus size={20} className="text-black" />
          </motion.div>
        </Link>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Sessions', value: String(totalSessions), sub: 'This block' },
          { label: 'Best Sim', value: bestSim, sub: 'Duration' },
          { label: 'Total KMs', value: totalKms, sub: 'Running' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-bg-card rounded-2xl p-4 border border-white/5 text-center"
          >
            <p className="text-2xl font-black italic text-[#39FF14]">{stat.value}</p>
            <p className="text-[9px] text-white/60 uppercase font-bold mt-0.5">{stat.label}</p>
            <p className="text-[8px] text-white/25 uppercase mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter pills */}
      <div
        className="flex gap-2 mb-5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex-shrink-0 transition-colors ${
              activeFilter === f ? 'pill-active' : 'pill-inactive'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Log Entries */}
      {isLoading ? (
        <LogSkeleton />
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Activity size={28} className="text-white/20" />
          </div>
          <p className="text-white/40 text-sm font-bold">No workouts yet</p>
          <p className="text-white/20 text-xs mt-1">
            {activeFilter === 'All'
              ? 'Start your first session to see it here.'
              : `No ${activeFilter} workouts found.`}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((workout, i) => (
            <LogCard key={workout.id} workout={workout} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
