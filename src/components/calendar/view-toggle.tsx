'use client';

import { motion } from 'motion/react';

export type CalendarView = 'week' | 'month';

interface ViewToggleProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex bg-white/5 rounded-xl p-0.5 border border-white/5">
      {(['week', 'month'] as const).map((v) => (
        <button
          key={v}
          onClick={() => onViewChange(v)}
          className="relative px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors z-10"
        >
          {view === v && (
            <motion.div
              layoutId="viewToggle"
              className="absolute inset-0 bg-white/10 rounded-lg border border-white/10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className={`relative z-10 ${view === v ? 'text-white' : 'text-white/40'}`}>
            {v}
          </span>
        </button>
      ))}
    </div>
  );
}
