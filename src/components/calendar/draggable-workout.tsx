'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import {
  Wind,
  Flame,
  Dumbbell,
  Heart,
  Award,
  Zap,
  Timer,
  GripVertical,
} from 'lucide-react';
import type { CalendarWorkout } from '@/hooks/use-calendar-workouts';

const SESSION_ICONS: Record<string, { icon: typeof Dumbbell; color: string }> = {
  run: { icon: Wind, color: '#39FF14' },
  hiit: { icon: Flame, color: '#FF6B6B' },
  strength: { icon: Dumbbell, color: '#B45FFF' },
  simulation: { icon: Award, color: '#39FF14' },
  recovery: { icon: Heart, color: '#00F0FF' },
  station_practice: { icon: Zap, color: '#FF8C42' },
  general: { icon: Timer, color: '#FFB800' },
};

function getSessionInfo(type: string) {
  return SESSION_ICONS[type] ?? { icon: Dumbbell, color: '#39FF14' };
}

interface DraggableWorkoutProps {
  workout: CalendarWorkout;
  index: number;
}

export function DraggableWorkout({ workout, index }: DraggableWorkoutProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: workout.id,
    data: { workout },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 999 : undefined,
      }
    : undefined;

  const sessionInfo = getSessionInfo(workout.session_type);
  const Icon = sessionInfo.icon;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.8 : 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        isDragging
          ? 'bg-white/10 border-[#39FF14]/40 shadow-[0_0_20px_rgba(57,255,20,0.15)]'
          : 'bg-white/3 border-white/5 hover:border-white/10'
      }`}
      {...attributes}
      {...listeners}
    >
      {/* Drag handle */}
      <GripVertical size={14} className="text-white/20 flex-shrink-0 cursor-grab active:cursor-grabbing" />

      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: `${sessionInfo.color}18`,
          border: `1px solid ${sessionInfo.color}40`,
        }}
      >
        <Icon size={14} style={{ color: sessionInfo.color }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">
          {workout.session_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {workout.duration_minutes && (
            <span className="text-[10px] text-white/30">{workout.duration_minutes} min</span>
          )}
          {workout.rpe_post && (
            <span className="text-[10px] text-white/20">RPE {workout.rpe_post}</span>
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          backgroundColor:
            workout.completion_status === 'completed'
              ? '#39FF14'
              : workout.completion_status === 'partial'
                ? '#FFB800'
                : 'rgba(255,255,255,0.15)',
        }}
      />
    </motion.div>
  );
}
