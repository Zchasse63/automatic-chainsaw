'use client';

import React from 'react';

interface ChartTooltipPayloadItem {
  dataKey: string;
  value: number;
  stroke?: string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string;
  /** Map dataKey to unit string. Falls back to '' if not provided. */
  unitMap?: Record<string, string>;
}

/**
 * Shared Recharts custom tooltip with dark-theme styling.
 *
 * Merges the patterns from `CustomChartTooltip` (AIFitnessEcosystem) and
 * `CustomTooltip` (HRVAnalytics) into one reusable component.
 *
 * Usage:
 *   <Tooltip content={<ChartTooltip unitMap={{ hrv: 'ms', rhr: 'bpm' }} />} />
 */
export function ChartTooltip({
  active,
  payload,
  label,
  unitMap,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl px-4 py-3">
      <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-2">
        {label}
      </p>
      {payload.map((p) => {
        const color = p.color ?? p.stroke ?? '#fff';
        const unit = unitMap?.[p.dataKey] ?? '';

        return (
          <div key={p.dataKey} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: color }}
            />
            <span className="text-xs text-white/60 uppercase font-bold">
              {p.dataKey}:
            </span>
            <span className="text-sm font-bold" style={{ color }}>
              {p.value}
              {unit}
            </span>
          </div>
        );
      })}
    </div>
  );
}
