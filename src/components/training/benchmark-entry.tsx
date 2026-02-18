'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { Trophy, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { showAchievementToast } from '@/components/achievements/achievement-toast';

const BENCHMARK_TYPES = [
  { value: 'station_time', label: 'Station Time' },
  { value: '1k_run', label: '1K Run' },
  { value: '5k_run', label: '5K Run' },
  { value: 'skierg_1000m', label: 'SkiErg 1000m' },
  { value: 'row_1000m', label: 'Row 1000m' },
  { value: 'sled_push', label: 'Sled Push' },
  { value: 'sled_pull', label: 'Sled Pull' },
  { value: 'burpee_broad_jump', label: 'Burpee Broad Jump' },
  { value: 'farmers_carry', label: "Farmer's Carry" },
  { value: 'sandbag_lunges', label: 'Sandbag Lunges' },
  { value: 'wall_balls', label: 'Wall Balls' },
];

export function BenchmarkEntry() {
  const [open, setOpen] = useState(false);
  const [testType, setTestType] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  async function handleSubmit() {
    if (!testType) return;
    setSaving(true);

    const totalSeconds = (Number(minutes) || 0) * 60 + (Number(seconds) || 0);

    try {
      const res = await fetch('/api/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_type: testType,
          results: { time_seconds: totalSeconds, formatted: `${minutes || '0'}:${(seconds || '0').padStart(2, '0')}` },
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const responseData = await res.json();
      queryClient.invalidateQueries({ queryKey: ['benchmarks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      toast.success('Benchmark logged!');
      if (responseData.newAchievements && responseData.newAchievements.length > 0) {
        for (const name of responseData.newAchievements as string[]) {
          showAchievementToast(name, 'Achievement unlocked!');
        }
      }
      setOpen(false);
      setTestType('');
      setMinutes('');
      setSeconds('');
      setNotes('');
    } catch {
      toast.error('Failed to save benchmark');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-hyrox-yellow/30 text-hyrox-yellow hover:bg-hyrox-yellow/10 font-display text-xs uppercase tracking-wider">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Log Benchmark
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-surface-1 border-border-default">
        <DialogHeader>
          <DialogTitle className="font-display text-lg uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Trophy className="h-5 w-5 text-hyrox-yellow" />
            Log Benchmark
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Select value={testType} onValueChange={setTestType}>
            <SelectTrigger className="bg-surface-2 border-border-default text-text-primary">
              <SelectValue placeholder="Select benchmark type" />
            </SelectTrigger>
            <SelectContent className="bg-surface-2 border-border-default">
              {BENCHMARK_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-text-primary">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Min"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="bg-surface-2 border-border-default text-text-primary font-mono w-20"
            />
            <span className="text-text-tertiary">:</span>
            <Input
              type="number"
              placeholder="Sec"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              className="bg-surface-2 border-border-default text-text-primary font-mono w-20"
            />
          </div>

          <Input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-surface-2 border-border-default text-text-primary"
          />

          <Button
            onClick={handleSubmit}
            disabled={!testType || saving}
            className="w-full bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider"
          >
            {saving ? 'Saving...' : 'Save Benchmark'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
