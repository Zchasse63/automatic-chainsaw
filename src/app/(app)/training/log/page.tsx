'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const SESSION_TYPES = [
  { value: 'run', label: 'Run' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'strength', label: 'Strength' },
  { value: 'simulation', label: 'Race Simulation' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'station_practice', label: 'Station Practice' },
  { value: 'general', label: 'General' },
];

const RPE_LABELS: Record<number, string> = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Light',
  4: 'Moderate',
  5: 'Moderate+',
  6: 'Hard-',
  7: 'Hard',
  8: 'Very Hard',
  9: 'Near Max',
  10: 'Maximal',
};

export default function WorkoutLogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [sessionType, setSessionType] = useState('general');
  const [duration, setDuration] = useState('');
  const [rpePost, setRpePost] = useState(5);
  const [notes, setNotes] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        session_type: sessionType,
        duration_minutes: duration ? Number(duration) : null,
        rpe_post: rpePost,
        notes: notes || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to log workout');
      setLoading(false);
      return;
    }

    router.push('/training');
    router.refresh();
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/training"
          className="text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-text-primary">
          Log Workout
        </h1>
      </div>

      {error && (
        <div className="bg-semantic-error/10 border border-semantic-error/20 rounded-sm px-4 py-3">
          <p className="font-body text-sm text-semantic-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date & Type */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-body text-sm text-text-secondary">
              Date
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-body text-sm text-text-secondary">
              Session Type
            </Label>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger className="h-12 bg-surface-1 border-border-default font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SESSION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label className="font-body text-sm text-text-secondary">
            Duration (minutes)
          </Label>
          <Input
            type="number"
            placeholder="60"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="h-12 bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
          />
        </div>

        {/* RPE Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-body text-sm text-text-secondary">
              RPE (Rate of Perceived Exertion)
            </Label>
            <span className="font-mono text-sm text-hyrox-yellow">
              {rpePost} — {RPE_LABELS[rpePost]}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={rpePost}
            onChange={(e) => setRpePost(Number(e.target.value))}
            className="w-full h-2 bg-surface-3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-hyrox-yellow"
          />
          <div className="flex justify-between">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <span
                key={n}
                className={`font-mono text-[10px] ${
                  n === rpePost
                    ? 'text-hyrox-yellow'
                    : 'text-text-tertiary'
                }`}
              >
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label className="font-body text-sm text-text-secondary">
            Notes
          </Label>
          <Textarea
            placeholder="How did it go? What did you focus on?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px] bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover shadow-glow-md font-display uppercase tracking-wider font-bold"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Save Workout
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
