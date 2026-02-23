'use client';

import { useDroppable } from '@dnd-kit/core';
import { motion } from 'motion/react';
import { Moon, Plus } from 'lucide-react';
import Link from 'next/link';
import { DraggableWorkout } from './draggable-workout';
import { toISODateString } from '@/lib/calendar-utils';
import type { CalendarWorkout } from '@/hooks/use-calendar-workouts';

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface WeekDayRowProps {
  date: Date;
  workouts: CalendarWorkout[];
  isToday: boolean;
  index: number;
}

export function WeekDayRow({ date, workouts, isToday, index }: WeekDayRowProps) {
  const dateKey = toISODateString(date);
  const dayOfWeek = (date.getDay() + 6) % 7; // 0=Mon
  const dayName = DAY_SHORT[dayOfWeek];
  const dayNum = date.getDate();

  const { setNodeRef, isOver } = useDroppable({
    id: dateKey,
    data: { date: dateKey },
  });

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`flex gap-3 p-3 rounded-2xl transition-all border ${
        isOver
          ? 'bg-[#39FF14]/5 border-[#39FF14]/30'
          : isToday
            ? 'bg-white/3 border-[#39FF14]/15'
            : 'bg-transparent border-white/5'
      }`}
    >
      {/* Day label column */}
      <div className="flex flex-col items-center justify-start w-10 flex-shrink-0 pt-0.5">
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
          {dayName}
        </span>
        <span
          className={`text-lg font-black leading-none mt-0.5 ${
            isToday
              ? 'w-8 h-8 rounded-full bg-[#39FF14] text-black flex items-center justify-center'
              : 'text-white/70'
          }`}
        >
          {dayNum}
        </span>
      </div>

      {/* Workouts column */}
      <div className="flex-1 min-w-0">
        {workouts.length > 0 ? (
          <div className="space-y-1.5">
            {workouts.map((w, i) => (
              <DraggableWorkout key={w.id} workout={w} index={i} compact />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 py-2 min-h-[44px]">
            <Moon size={14} className="text-white/15" />
            <span className="text-xs text-white/20">Rest day</span>
            <Link href="/coach" className="ml-auto">
              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white/40 transition-colors">
                <Plus size={12} />
              </div>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
