'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { useWorkouts } from '@/hooks/use-workouts';

const SESSION_COLORS: Record<string, string> = {
  run: 'bg-blue-400',
  hiit: 'bg-orange-400',
  strength: 'bg-purple-400',
  simulation: 'bg-hyrox-yellow',
  recovery: 'bg-emerald-400',
  station_practice: 'bg-pink-400',
  general: 'bg-text-tertiary',
};

export function MonthCalendar() {
  const [month, setMonth] = useState(new Date());
  const from = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().split('T')[0];
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: workouts = [] } = useWorkouts({ from, to, limit: 50 });

  // Group workouts by date
  const workoutsByDate = new Map<string, string[]>();
  for (const w of workouts) {
    if (!w.date) continue;
    const dateStr = w.date.split('T')[0];
    const types = workoutsByDate.get(dateStr) ?? [];
    types.push(w.session_type);
    workoutsByDate.set(dateStr, types);
  }

  return (
    <div className="bg-surface-1 border border-border-default rounded-lg p-4">
      <DayPicker
        mode="single"
        month={month}
        onMonthChange={setMonth}
        className="font-body text-text-primary"
        classNames={{
          root: 'w-full',
          month_caption: 'font-display text-sm uppercase tracking-wider text-text-primary mb-4 flex justify-center',
          nav: 'flex gap-2',
          button_previous: 'text-text-secondary hover:text-text-primary p-1',
          button_next: 'text-text-secondary hover:text-text-primary p-1',
          weekdays: 'flex',
          weekday: 'w-10 text-center font-display text-[10px] uppercase text-text-tertiary',
          weeks: 'flex flex-col',
          week: 'flex',
          day: 'w-10 h-10 flex flex-col items-center justify-center relative',
          day_button: 'text-sm text-text-primary hover:text-hyrox-yellow',
          today: 'font-bold text-hyrox-yellow',
          selected: 'bg-hyrox-yellow/20 rounded',
        }}
        components={{
          DayButton: ({ day, modifiers, ...props }) => {
            const dateStr = day.date.toISOString().split('T')[0];
            const types = workoutsByDate.get(dateStr) ?? [];
            return (
              <button {...props}>
                <span className="flex flex-col items-center">
                  {day.date.getDate()}
                  {types.length > 0 && (
                    <span className="flex gap-0.5 mt-0.5 justify-center">
                      {types.slice(0, 3).map((type, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${SESSION_COLORS[type] ?? SESSION_COLORS.general}`}
                        />
                      ))}
                    </span>
                  )}
                </span>
              </button>
            );
          },
        }}
      />
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border-default">
        {Object.entries(SESSION_COLORS).slice(0, 6).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="font-body text-[10px] text-text-tertiary capitalize">
              {type.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
