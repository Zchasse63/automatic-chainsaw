'use client';

export const workoutColors: Record<string, string> = {
  Run: '#39FF14',
  Running: '#39FF14',
  'Ski Erg': '#00F0FF',
  'Rowing/Ski': '#00F0FF',
  Sled: '#FFB800',
  HIIT: '#FF6B6B',
  Strength: '#B45FFF',
  Rest: '#ffffff33',
  CrossFit: '#FF8C42',
  'Hyrox Sim': '#39FF14',
  Recovery: '#00F0FF',
};

interface WorkoutBadgeProps {
  type: string;
}

export const WorkoutBadge = ({ type }: WorkoutBadgeProps) => {
  const color = workoutColors[type] ?? '#ffffff55';
  return (
    <span
      className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
      style={{ background: `${color}22`, color }}
    >
      {type}
    </span>
  );
};
