'use client';

import React from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface SparklineProps {
  data: number[];
  /** Width in pixels. Defaults to 80. */
  width?: number;
  /** Height in pixels. Defaults to 24. */
  height?: number;
  /** Stroke color. Defaults to '#39FF14'. */
  color?: string;
  /** Stroke width. Defaults to 1.5. */
  strokeWidth?: number;
}

/**
 * Tiny inline sparkline chart with no axes, no grid, no dots.
 *
 * Extracted from WeeklyVolumeAnalytics.tsx `Sparkline` component.
 *
 * Usage:
 *   <Sparkline data={[55, 60, 70, 65, 80, 75, 90]} />
 */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = '#39FF14',
  strokeWidth = 1.5,
}: SparklineProps) {
  const pts = data.map((v, i) => ({ i, v }));

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pts}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={strokeWidth}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
