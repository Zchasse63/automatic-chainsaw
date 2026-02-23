import { useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Touch swipe navigation between app screens.
 * Ported from AIFitnessEcosystem useSwipeNav hook.
 *
 * Attach `onTouchStart` and `onTouchEnd` to the page container.
 * Swipe left → next route, swipe right → previous route.
 *
 * Includes vertical axis discrimination: diagonal or vertical
 * swipes (|dy| > |dx|) are ignored to avoid conflicting with scrolling.
 */

const ROUTES = ['/dashboard', '/calendar', '/coach', '/workout/today', '/log'] as const;
const SWIPE_THRESHOLD = 50; // px

export function useSwipeNav() {
  const router = useRouter();
  const pathname = usePathname();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (startX.current === null || startY.current === null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      startX.current = null;
      startY.current = null;

      // Ignore vertical/diagonal swipes — only navigate on clearly horizontal gestures
      if (Math.abs(dy) > Math.abs(dx)) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;

      const idx = ROUTES.findIndex((r) => pathname.startsWith(r));
      if (idx === -1) return;

      if (dx < 0 && idx < ROUTES.length - 1) {
        router.push(ROUTES[idx + 1]);
      }
      if (dx > 0 && idx > 0) {
        router.push(ROUTES[idx - 1]);
      }
    },
    [pathname, router]
  );

  return { onTouchStart, onTouchEnd };
}
