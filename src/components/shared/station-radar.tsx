'use client';

import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

interface StationDataPoint {
  station: string;
  score: number;
  fullMark?: number;
}

interface StationRadarProps {
  data: StationDataPoint[];
  /** Chart height in pixels. Defaults to 208 (h-52). */
  height?: number;
  /** Outer radius percentage string. Defaults to '75%'. */
  outerRadius?: string;
  /** Stroke color. Defaults to '#39FF14'. */
  strokeColor?: string;
  /** Fill opacity. Defaults to 0.15. */
  fillOpacity?: number;
  /** Whether to show dots on the radar vertices. Defaults to true. */
  showDots?: boolean;
}

/**
 * Shared Recharts RadarChart for Hyrox station performance data.
 *
 * Merges patterns from AIFitnessEcosystem, HRVAnalytics, and
 * WeeklyVolumeAnalytics radar charts into one reusable component.
 *
 * Usage:
 *   <StationRadar data={[{ station: 'Ski Erg', score: 78 }, ...]} />
 */
export function StationRadar({
  data,
  height = 208,
  outerRadius = '75%',
  strokeColor = '#39FF14',
  fillOpacity = 0.15,
  showDots = true,
}: StationRadarProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius={outerRadius} data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.05)" />
          <PolarAngleAxis
            dataKey="station"
            tick={{
              fill: 'rgba(255,255,255,0.35)',
              fontSize: 8,
              fontWeight: 700,
            }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke={strokeColor}
            fill={strokeColor}
            fillOpacity={fillOpacity}
            strokeWidth={2}
            dot={
              showDots
                ? { fill: strokeColor, r: 3 }
                : false
            }
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
