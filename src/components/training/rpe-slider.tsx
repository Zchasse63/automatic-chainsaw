'use client';

import { Slider } from '@/components/ui/slider';

interface RpeSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const RPE_LABELS: Record<number, string> = {
  1: 'Very Light',
  2: 'Light',
  3: 'Moderate',
  4: 'Somewhat Hard',
  5: 'Hard',
  6: 'Hard+',
  7: 'Very Hard',
  8: 'Very Hard+',
  9: 'Max Effort',
  10: 'All Out',
};

function getRpeColor(rpe: number): string {
  if (rpe <= 3) return 'text-semantic-success';
  if (rpe <= 6) return 'text-hyrox-yellow';
  if (rpe <= 8) return 'text-orange-400';
  return 'text-semantic-error';
}

export function RpeSlider({ value, onChange }: RpeSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className={`font-mono text-3xl font-bold ${getRpeColor(value)}`}>
          {value}
        </span>
        <span className="font-body text-sm text-text-secondary">
          {RPE_LABELS[value] ?? ''}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={10}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] font-mono text-text-tertiary">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}
