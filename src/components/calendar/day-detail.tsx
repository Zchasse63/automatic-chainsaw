'use client';

import { motion } from 'motion/react';
import { X, Moon, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { DraggableWorkout } from './draggable-workout';
import type { CalendarWorkout } from '@/hooks/use-calendar-workouts';

interface DayDetailProps {
  date: Date;
  workouts: CalendarWorkout[];
  onClose: () => void;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function DayDetail({ date, workouts, onClose }: DayDetailProps) {
  const today = isToday(date);

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 300 }}
      className="bg-[#1a1a1a] border-t border-white/10 rounded-t-3xl p-5 max-h-[50vh] overflow-y-auto"
    >
      {/* Handle bar */}
      <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-4" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            {today ? 'Today' : ''}
          </p>
          <h3 className="text-lg font-black italic tracking-tighter text-white">
            {formatDateLabel(date)}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {workouts.length > 0 ? (
        <div className="space-y-2">
          {workouts.map((w, i) => (
            <DraggableWorkout key={w.id} workout={w} index={i} />
          ))}
        </div>
      ) : (
        /* Rest day / empty state */
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center mx-auto mb-3">
            <Moon size={20} className="text-[#00F0FF]" />
          </div>
          <p className="text-sm font-bold text-white/50">Rest Day</p>
          <p className="text-xs text-white/25 mt-1">No workouts scheduled</p>
          <Link href="/coach">
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-colors flex items-center gap-1.5 mx-auto"
            >
              <MessageCircle size={12} /> Plan a workout
            </motion.button>
          </Link>
        </div>
      )}
    </motion.div>
  );
}
