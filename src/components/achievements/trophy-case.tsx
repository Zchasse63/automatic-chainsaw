'use client';

import { useQuery } from '@tanstack/react-query';
import { Trophy, Lock } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  icon_name: string;
  is_unlocked: boolean;
  unlocked_at: string | null;
}

export function TrophyCase() {
  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const res = await fetch('/api/achievements');
      if (!res.ok) return [];
      const data = await res.json();
      return data.achievements;
    },
  });

  const unlocked = achievements.filter((a) => a.is_unlocked);
  const locked = achievements.filter((a) => !a.is_unlocked);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-sm uppercase tracking-wider text-text-primary mb-3">
          Unlocked ({unlocked.length})
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {unlocked.map((a) => (
            <div
              key={a.id}
              className="bg-surface-1 border border-hyrox-yellow/30 rounded-lg p-3 text-center"
            >
              <Trophy className="h-8 w-8 text-hyrox-yellow mx-auto mb-1" />
              <p className="font-display text-[10px] uppercase tracking-wider text-text-primary">
                {a.name}
              </p>
              <p className="font-body text-[9px] text-text-tertiary mt-0.5">
                {a.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {locked.length > 0 && (
        <div>
          <h3 className="font-display text-sm uppercase tracking-wider text-text-tertiary mb-3">
            Locked ({locked.length})
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {locked.map((a) => (
              <div
                key={a.id}
                className="bg-surface-2 border border-border-default rounded-lg p-3 text-center opacity-50"
              >
                <Lock className="h-8 w-8 text-text-tertiary mx-auto mb-1" />
                <p className="font-display text-[10px] uppercase tracking-wider text-text-tertiary">
                  ???
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
