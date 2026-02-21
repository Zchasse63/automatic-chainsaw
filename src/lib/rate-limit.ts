/**
 * In-memory sliding-window rate limiter.
 *
 * Tracks request timestamps per key (userId or IP) in a Map with
 * automatic stale-entry cleanup.  This is a per-instance limiter —
 * each serverless cold-start gets its own window.  For a single-user
 * coaching app this is sufficient; swap to Upstash Redis if you need
 * distributed enforcement.
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxRequests: 20, windowMs: 60_000 });
 *   const { allowed, remaining, resetMs } = limiter.check(userId);
 */

interface RateLimiterConfig {
  /** Max requests allowed in the sliding window. */
  maxRequests: number;
  /** Sliding window duration in ms. */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Ms until the oldest request in the window expires. */
  resetMs: number;
}

export function createRateLimiter(config: RateLimiterConfig) {
  const { maxRequests, windowMs } = config;
  const store = new Map<string, number[]>();

  // Periodic cleanup of stale keys every 60 s
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store) {
      const fresh = timestamps.filter((t) => now - t < windowMs);
      if (fresh.length === 0) store.delete(key);
      else store.set(key, fresh);
    }
  }, 60_000);

  // Allow GC if the module is unloaded (serverless lifecycle)
  if (typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    cleanupInterval.unref();
  }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const timestamps = (store.get(key) ?? []).filter((t) => now - t < windowMs);

      if (timestamps.length >= maxRequests) {
        const oldestInWindow = timestamps[0];
        return {
          allowed: false,
          remaining: 0,
          resetMs: windowMs - (now - oldestInWindow),
        };
      }

      timestamps.push(now);
      store.set(key, timestamps);

      return {
        allowed: true,
        remaining: maxRequests - timestamps.length,
        resetMs: timestamps.length > 0 ? windowMs - (now - timestamps[0]) : windowMs,
      };
    },
  };
}

// ── Pre-configured limiters ──────────────────────────────────────────

/** Chat endpoint: 30 requests per minute per user. */
export const chatLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000 });

/** General API: 100 requests per minute per user. */
export const apiLimiter = createRateLimiter({ maxRequests: 100, windowMs: 60_000 });
