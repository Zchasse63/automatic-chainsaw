'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import { Flag, Plus } from 'lucide-react';
import { toast } from 'sonner';

const STATIONS = [
  'SkiErg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump',
  'Rowing', "Farmer's Carry", 'Sandbag Lunges', 'Wall Balls',
];

interface SplitInput {
  runMinutes: string;
  runSeconds: string;
  stationMinutes: string;
  stationSeconds: string;
}

export function RaceResultsEntry() {
  const [open, setOpen] = useState(false);
  const [raceName, setRaceName] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [splits, setSplits] = useState<SplitInput[]>(
    Array.from({ length: 8 }, () => ({ runMinutes: '', runSeconds: '', stationMinutes: '', stationSeconds: '' }))
  );
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  function updateSplit(i: number, field: keyof SplitInput, value: string) {
    setSplits((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function totalSeconds(mins: string, secs: string): number {
    return (Number(mins) || 0) * 60 + (Number(secs) || 0);
  }

  async function handleSubmit() {
    if (!raceName || !raceDate) return;
    setSaving(true);

    const runSplits = splits.map((s) => totalSeconds(s.runMinutes, s.runSeconds));
    const stationSplits = splits.map((s) => totalSeconds(s.stationMinutes, s.stationSeconds));
    const totalTime = runSplits.reduce((a, b) => a + b, 0) + stationSplits.reduce((a, b) => a + b, 0);

    try {
      const res = await fetch('/api/races', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          race_name: raceName,
          race_date: raceDate,
          total_time_seconds: totalTime,
          run_splits: runSplits,
          station_splits: stationSplits,
          stations: STATIONS,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      queryClient.invalidateQueries({ queryKey: ['races'] });
      toast.success('Race results saved!');
      setOpen(false);
    } catch {
      toast.error('Failed to save results');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-hyrox-yellow/30 text-hyrox-yellow hover:bg-hyrox-yellow/10 font-display text-xs uppercase tracking-wider">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Log Race
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-surface-1 border-border-default max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Flag className="h-5 w-5 text-hyrox-yellow" />
            Race Results
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Input
            placeholder="Race name (e.g., Hyrox Chicago 2025)"
            value={raceName}
            onChange={(e) => setRaceName(e.target.value)}
            className="bg-surface-2 border-border-default text-text-primary"
          />
          <Input
            type="date"
            value={raceDate}
            onChange={(e) => setRaceDate(e.target.value)}
            className="bg-surface-2 border-border-default text-text-primary"
          />

          <div className="space-y-3">
            {STATIONS.map((station, i) => (
              <div key={station} className="space-y-1">
                <p className="font-display text-[10px] uppercase tracking-wider text-text-tertiary">
                  Lap {i + 1}: {station}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex gap-1 items-center">
                    <span className="text-[10px] text-text-tertiary w-8">Run</span>
                    <Input
                      type="number" placeholder="m" className="bg-surface-2 border-border-default text-text-primary font-mono h-8 text-xs w-14"
                      value={splits[i].runMinutes} onChange={(e) => updateSplit(i, 'runMinutes', e.target.value)}
                    />
                    <span className="text-text-tertiary text-xs">:</span>
                    <Input
                      type="number" placeholder="s" className="bg-surface-2 border-border-default text-text-primary font-mono h-8 text-xs w-14"
                      value={splits[i].runSeconds} onChange={(e) => updateSplit(i, 'runSeconds', e.target.value)}
                    />
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className="text-[10px] text-text-tertiary w-8">Stn</span>
                    <Input
                      type="number" placeholder="m" className="bg-surface-2 border-border-default text-text-primary font-mono h-8 text-xs w-14"
                      value={splits[i].stationMinutes} onChange={(e) => updateSplit(i, 'stationMinutes', e.target.value)}
                    />
                    <span className="text-text-tertiary text-xs">:</span>
                    <Input
                      type="number" placeholder="s" className="bg-surface-2 border-border-default text-text-primary font-mono h-8 text-xs w-14"
                      value={splits[i].stationSeconds} onChange={(e) => updateSplit(i, 'stationSeconds', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!raceName || !raceDate || saving}
            className="w-full bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider"
          >
            {saving ? 'Saving...' : 'Save Race Results'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
