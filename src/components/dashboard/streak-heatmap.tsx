'use client';

import { useQuery } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HeatmapDay {
  date: string;
  workoutCount: number;
  totalMinutes: number;
}

function getIntensityClass(count: number): string {
  if (count === 0) return 'bg-surface-2';
  if (count === 1) return 'bg-hyrox-yellow/30';
  if (count === 2) return 'bg-hyrox-yellow/60';
  return 'bg-hyrox-yellow';
}

export function StreakHeatmap() {
  const { data: days = [] } = useQuery<HeatmapDay[]>({
    queryKey: ['streak-heatmap'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/streak-heatmap?days=90');
      if (!res.ok) return [];
      const data = await res.json();
      return data.days;
    },
  });

  // Build 90-day grid
  const today = new Date();
  const grid: Array<{ date: string; count: number; minutes: number }> = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const match = days.find((day) => day.date === dateStr);
    grid.push({
      date: dateStr,
      count: match?.workoutCount ?? 0,
      minutes: match?.totalMinutes ?? 0,
    });
  }

  // Arrange into weeks (columns)
  const weeks: typeof grid[] = [];
  let currentWeek: typeof grid = [];
  const firstDay = new Date(grid[0].date);
  const startDow = firstDay.getDay();
  // Pad start
  for (let i = 0; i < startDow; i++) {
    currentWeek.push({ date: '', count: -1, minutes: 0 });
  }
  for (const day of grid) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <div className="bg-surface-1 border border-border-default rounded-lg p-4">
      <p className="font-display text-xs uppercase tracking-wider text-text-secondary mb-3">
        Training Activity — 90 Days
      </p>
      <TooltipProvider>
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                day.count === -1 ? (
                  <div key={di} className="w-3 h-3" />
                ) : (
                  <Tooltip key={di}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-3 h-3 rounded-[2px] ${getIntensityClass(day.count)} transition-colors`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-mono text-xs">
                        {day.date}: {day.count} workout{day.count !== 1 ? 's' : ''}
                        {day.minutes > 0 ? `, ${day.minutes}min` : ''}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              ))}
            </div>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
