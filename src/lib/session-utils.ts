import {
  Wind,
  Flame,
  Dumbbell,
  Heart,
  Award,
  Zap,
  Timer,
} from 'lucide-react';

/** Canonical session type → icon + color map used throughout the app */
export const SESSION_ICONS: Record<string, { icon: typeof Dumbbell; color: string }> = {
  run:              { icon: Wind,     color: '#39FF14' },
  hiit:             { icon: Flame,    color: '#FF6B6B' },
  strength:         { icon: Dumbbell, color: '#B45FFF' },
  simulation:       { icon: Award,    color: '#39FF14' },
  recovery:         { icon: Heart,    color: '#00F0FF' },
  station_practice: { icon: Zap,      color: '#FF8C42' },
  general:          { icon: Timer,    color: '#FFB800' },
};

/** Get icon + color for a session type (with fallback) */
export function getSessionInfo(type: string | null) {
  if (!type) return { icon: Dumbbell, color: '#39FF14' };
  return SESSION_ICONS[type] ?? { icon: Dumbbell, color: '#39FF14' };
}

/** Convert session_type slug → Title Case label */
export function formatSessionType(type: string | null): string {
  if (!type) return 'Workout';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
