'use client';

import { workoutColors } from '@/components/shared/workout-badge';

const LEGEND_ITEMS = [
  { label: 'Run', key: 'Run' },
  { label: 'HIIT', key: 'HIIT' },
  { label: 'Strength', key: 'Strength' },
  { label: 'Sim', key: 'Hyrox Sim' },
  { label: 'Recovery', key: 'Recovery' },
  { label: 'Station', key: 'CrossFit' },
];

export function CalendarLegend() {
  return (
    <div
      className="flex gap-3 overflow-x-auto pb-1"
      style={{ scrollbarWidth: 'none' }}
    >
      {LEGEND_ITEMS.map((item) => {
        const color = workoutColors[item.key] ?? '#ffffff55';
        return (
          <div key={item.key} className="flex items-center gap-1.5 flex-shrink-0">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
