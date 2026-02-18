'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-react';
import { toast } from 'sonner';

export function showAchievementToast(title: string, description: string) {
  // Fire confetti
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#D4E600', '#FFFFFF', '#FFD700'],
  });

  toast.custom(() => (
    <div className="bg-surface-1 border border-hyrox-yellow/30 rounded-lg p-4 flex items-center gap-3 shadow-lg">
      <div className="w-10 h-10 rounded-full bg-hyrox-yellow/20 flex items-center justify-center flex-shrink-0">
        <Trophy className="h-5 w-5 text-hyrox-yellow" />
      </div>
      <div>
        <p className="font-display text-xs uppercase tracking-wider text-hyrox-yellow">
          Achievement Unlocked!
        </p>
        <p className="font-body text-sm text-text-primary font-medium">{title}</p>
        <p className="font-body text-xs text-text-secondary">{description}</p>
      </div>
    </div>
  ), { duration: 5000 });
}
