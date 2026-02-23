'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaPositive?: boolean;
  color: string;
  icon: React.ReactNode;
  sub?: string;
}

export const StatCard = ({
  label,
  value,
  unit,
  delta,
  deltaPositive,
  color,
  icon,
  sub,
}: StatCardProps) => (
  <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-white/5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: `${color}22` }}
        >
          {icon}
        </div>
        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
          {label}
        </span>
      </div>
      {delta !== undefined && deltaPositive !== undefined && (
        <div
          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
          style={{
            background: deltaPositive ? '#39FF1422' : '#FF444422',
            color: deltaPositive ? '#39FF14' : '#FF4444',
          }}
        >
          {deltaPositive ? (
            <ArrowUpRight size={10} />
          ) : (
            <ArrowDownRight size={10} />
          )}
          {Math.abs(delta)}
        </div>
      )}
    </div>
    <div className="flex items-end gap-1">
      <span
        className="text-4xl font-black italic leading-none"
        style={{ color }}
      >
        {value}
      </span>
      {unit && (
        <span className="text-sm text-white/40 font-bold mb-1">{unit}</span>
      )}
    </div>
    {sub && (
      <span className="text-[10px] text-white/30 uppercase font-bold">
        {sub}
      </span>
    )}
  </div>
);
