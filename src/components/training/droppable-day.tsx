'use client';

import { useDroppable } from '@dnd-kit/core';

interface DroppableDayProps {
  dow: number;
  isToday: boolean;
  children: React.ReactNode;
}

export function DroppableDay({ dow, isToday, children }: DroppableDayProps) {
  const { setNodeRef, isOver } = useDroppable({ id: dow });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-sm border transition-colors min-h-[80px] ${
        isOver
          ? 'border-hyrox-yellow bg-hyrox-yellow/5'
          : isToday
            ? 'border-hyrox-yellow/40 bg-surface-1'
            : 'border-border-default bg-surface-1'
      }`}
    >
      {children}
    </div>
  );
}
