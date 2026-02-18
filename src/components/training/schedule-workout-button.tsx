'use client';

import { useState } from 'react';
import { Calendar, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DayPicker } from 'react-day-picker';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ScheduleWorkoutButtonProps {
  workoutTitle: string;
  workoutDescription: string;
  sessionType: string;
  estimatedMinutes?: number;
}

export function ScheduleWorkoutButton({
  workoutTitle,
  workoutDescription,
  sessionType,
  estimatedMinutes,
}: ScheduleWorkoutButtonProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  async function handleSelect(date: Date | undefined) {
    if (!date) return;
    setSaving(true);

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date.toISOString().split('T')[0],
          session_type: sessionType,
          duration_minutes: estimatedMinutes,
          notes: `${workoutTitle}\n\n${workoutDescription}`,
          completion_status: 'planned',
        }),
      });

      if (!res.ok) throw new Error('Failed to schedule');

      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
      toast.success('Workout scheduled!');
      setOpen(false);
    } catch {
      toast.error('Failed to schedule workout');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-hyrox-yellow/30 text-hyrox-yellow hover:bg-hyrox-yellow/10 font-display text-xs uppercase tracking-wider"
        >
          <Calendar className="h-3.5 w-3.5 mr-1.5" />
          Schedule This
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-surface-1 border-border-default" align="start">
        <DayPicker
          mode="single"
          disabled={{ before: new Date() }}
          onSelect={handleSelect}
          className="font-body text-text-primary p-3"
          classNames={{
            day_button: 'text-sm text-text-primary hover:bg-hyrox-yellow/20 rounded w-8 h-8 flex items-center justify-center',
            today: 'font-bold text-hyrox-yellow',
            selected: 'bg-hyrox-yellow text-text-inverse rounded',
            month_caption: 'font-display text-xs uppercase tracking-wider text-text-secondary',
          }}
        />
        {saving && (
          <div className="flex items-center justify-center p-2 border-t border-border-default">
            <div className="h-4 w-4 border-2 border-hyrox-yellow border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
