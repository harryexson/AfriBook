// ─── Rate Limiting ────────────────────────────────────────────
// No rate limiting existed anywhere in the API layer before this — auth,
// search, and payment-adjacent endpoints were all unprotected against
// abuse. This is an in-memory sliding-window limiter: zero new
// dependencies, zero new environment variables, works correctly on a
// single long-running Node server.
//
// HONEST LIMITATION: on serverless/edge (Vercel, etc.), each function
// instance gets its own memory, so limits are enforced per-instance, not
// globally — a determined attacker distributed across many cold-started
// instances could exceed the intended global limit. This is a real
// starting point, not a complete solution. For a global limit across all
// instances/regions, swap the store below for Upstash Redis
// (`@upstash/ratelimit` + `@upstash/redis`) — the function signature here
// is deliberately kept swap-compatible (same inputs/outputs) so that's a
// contained change, not a rewrite of every call site.
// ──────────────────────────────────────────────────────────────

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

// Periodic cleanup so this Map doesn't grow unbounded over a long-lived
// instance — without this, memory would leak for every unique key
// (IP+route) ever seen.
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function cleanupIfDue(maxWindowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < maxWindowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Sliding-window check. `key` should already include both the identity
 * (IP, or user ID for authenticated routes) and the route/bucket name, so
 * different endpoints don't share the same counter.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  cleanupIfDue(windowMs);
  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    store.set(key, entry);
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return { allowed: true, limit, remaining: limit - entry.timestamps.length, retryAfterSeconds: 0 };
}

/** Route-prefix buckets, checked most-specific-first. Sensitive/write-heavy
 *  and payment-adjacent endpoints get tighter limits than general reads. */
export const RATE_LIMIT_BUCKETS: { prefix: string; limit: number; windowMs: number }[] = [
  { prefix: '/api/vendor/payouts', limit: 5, windowMs: 60_000 },
  { prefix: '/api/driver/status', limit: 20, windowMs: 60_000 },
  { prefix: '/api/ridely/dispatch', limit: 30, windowMs: 60_000 },
  { prefix: '/api/ridely/rides', limit: 20, windowMs: 60_000 },
  { prefix: '/api/ridely/deliveries', limit: 20, windowMs: 60_000 },
  { prefix: '/api/ridely/food-deliveries', limit: 20, windowMs: 60_000 },
  { prefix: '/api/order', limit: 20, windowMs: 60_000 },
  { prefix: '/api/webhooks', limit: 200, windowMs: 60_000 }, // providers retry aggressively; don't choke real webhooks
  { prefix: '/api', limit: 60, windowMs: 60_000 }, // default fallback for everything else under /api
];

export function getRateLimitBucket(pathname: string) {
  return RATE_LIMIT_BUCKETS.find((b) => pathname.startsWith(b.prefix));
}
