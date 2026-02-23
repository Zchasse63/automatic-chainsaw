'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { GripVertical } from 'lucide-react';
import { getSessionInfo, formatSessionType } from '@/lib/session-utils';
import type { CalendarItem } from '@/hooks/use-calendar-data';

interface DraggableWorkoutProps {
  workout: CalendarItem;
  index: number;
  compact?: boolean;
}

export function DraggableWorkout({ workout, index, compact }: DraggableWorkoutProps) {
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

  // Planned (not yet logged) workout styling
  const isPlanned = workout.source === 'planned';
  const plannedClass = isPlanned ? 'border-dashed opacity-60' : '';

  if (compact) {
    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: isDragging ? 0.8 : 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all ${plannedClass} ${
          isDragging
            ? 'bg-white/10 border-[#39FF14]/40 shadow-[0_0_20px_rgba(57,255,20,0.15)]'
            : 'bg-white/3 border-white/5 hover:border-white/10'
        }`}
        {...attributes}
      >
        {/* Drag handle — only this element initiates drag */}
        <div {...listeners} className="touch-none flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5">
          <GripVertical size={12} className="text-white/15" />
        </div>

        {/* Color dot */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: sessionInfo.color }}
        />

        {/* Title */}
        <p className="text-[11px] font-bold text-white truncate flex-1">
          {workout.title || workout.notes || formatSessionType(workout.session_type)}
        </p>

        {/* Duration */}
        {workout.duration_minutes && (
          <span className="text-[10px] text-white/25 flex-shrink-0">{workout.duration_minutes}m</span>
        )}

        {/* Status dot */}
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor:
              isPlanned
                ? 'rgba(255,255,255,0.15)'
                : workout.completion_status === 'completed'
                  ? '#39FF14'
                  : workout.completion_status === 'partial'
                    ? '#FFB800'
                    : 'rgba(255,255,255,0.15)',
          }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.8 : 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${plannedClass} ${
        isDragging
          ? 'bg-white/10 border-[#39FF14]/40 shadow-[0_0_20px_rgba(57,255,20,0.15)]'
          : 'bg-white/3 border-white/5 hover:border-white/10'
      }`}
      {...attributes}
    >
      {/* Drag handle — only this element initiates drag */}
      <div {...listeners} className="touch-none flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5">
        <GripVertical size={14} className="text-white/20" />
      </div>

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
          {workout.title || formatSessionType(workout.session_type)}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {workout.duration_minutes && (
            <span className="text-[10px] text-white/30">{workout.duration_minutes} min</span>
          )}
          {workout.rpe_post && (
            <span className="text-[10px] text-white/20">RPE {workout.rpe_post}</span>
          )}
          {isPlanned && (
            <span className="text-[10px] text-white/30 italic">Planned</span>
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          backgroundColor:
            isPlanned
              ? 'rgba(255,255,255,0.15)'
              : workout.completion_status === 'completed'
                ? '#39FF14'
                : workout.completion_status === 'partial'
                  ? '#FFB800'
                  : 'rgba(255,255,255,0.15)',
        }}
      />
    </motion.div>
  );
}
