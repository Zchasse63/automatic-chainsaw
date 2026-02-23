'use client';

import { useSwipeNav } from '@/hooks/use-swipe-nav';

export function SwipeContainer({ children }: { children: React.ReactNode }) {
  const { onTouchStart, onTouchEnd } = useSwipeNav();

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {children}
    </div>
  );
}
