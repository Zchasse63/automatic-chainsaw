'use client';

import { Activity } from 'lucide-react';

interface EmptyStateProps {
  label: string;
  icon?: React.ReactNode;
  hint?: string;
}

/**
 * Shared empty state placeholder for screens with no data.
 *
 * Usage:
 *   <EmptyState label="No biomarker data yet" />
 *   <EmptyState label="No data" icon={<BarChart2 size={24} />} hint="Complete workouts" />
 */
export function EmptyState({
  label,
  icon,
  hint,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-white/20 mb-2">
        {icon ?? <Activity size={24} />}
      </div>
      <p className="text-xs text-white/30 font-bold uppercase tracking-wider">
        {label}
      </p>
      {hint && (
        <p className="text-[10px] text-white/20 mt-1">{hint}</p>
      )}
    </div>
  );
}
