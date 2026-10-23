// ─── Rate Limiting ────────────────────────────────────────────
// Sliding-window rate limiter with two backends:
//
// 1. Upstash Redis (global): used when UPSTASH_REDIS_REST_URL and
//    UPSTASH_REDIS_REST_TOKEN are set. Enforces limits globally across all
//    serverless instances and regions via the Upstash REST API (no npm
//    package needed — just fetch). Set up an Upstash Redis database at
//    https://console.upstash.com and copy the REST URL + token into env.
//
// 2. In-memory (per-instance fallback): used when Upstash env vars are not
//    set. Enforces limits only within a single function instance — adequate
//    for a long-running Node server, a known gap on serverless/edge where
//    each cold-started instance has its own map.
// ──────────────────────────────────────────────────────────────

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

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

// ─── Upstash Redis sliding-window via REST API ────────────────
// Uses ZADD + ZREMRANGEBYSCORE + ZCARD in a pipeline to implement a
// sliding window without @upstash/redis or @upstash/ratelimit packages.
async function checkRateLimitUpstash(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const now = Date.now();
  const windowStart = now - windowMs;
  const member = String(now);

  try {
    const pipeline = [
      ['ZREMRANGEBYSCORE', key, '-inf', String(windowStart)],
      ['ZADD', key, String(now), member],
      ['ZCARD', key],
      ['PEXPIRE', key, String(windowMs)],
    ];

    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pipeline),
    });

    if (!res.ok) return null;

    const results = await res.json() as Array<{ result: unknown }>;
    const count = Number(results[2]?.result ?? 0);

    if (count > limit) {
      // Already over limit; undo the ZADD we just did
      await fetch(`${url}/zrem/${encodeURIComponent(key)}/${encodeURIComponent(member)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return {
        allowed: false,
        limit,
        remaining: 0,
        retryAfterSeconds: Math.ceil(windowMs / 1000),
      };
    }

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: 0,
    };
  } catch {
    return null;
  }
}

/**
 * Sliding-window check. `key` should already include both the identity
 * (IP, or user ID for authenticated routes) and the route/bucket name.
 * Tries Upstash Redis first; falls back to in-memory when unavailable.
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const upstashResult = await checkRateLimitUpstash(key, limit, windowMs);
  if (upstashResult !== null) return upstashResult;

  // In-memory fallback
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

/** Route-prefix buckets, checked most-specific-first. */
export const RATE_LIMIT_BUCKETS: { prefix: string; limit: number; windowMs: number }[] = [
  { prefix: '/api/vendor/payouts', limit: 5, windowMs: 60_000 },
  { prefix: '/api/driver/status', limit: 20, windowMs: 60_000 },
  { prefix: '/api/ridely/dispatch', limit: 30, windowMs: 60_000 },
  { prefix: '/api/ridely/rides', limit: 20, windowMs: 60_000 },
  { prefix: '/api/ridely/deliveries', limit: 20, windowMs: 60_000 },
  { prefix: '/api/ridely/food-deliveries', limit: 20, windowMs: 60_000 },
  { prefix: '/api/order', limit: 20, windowMs: 60_000 },
  { prefix: '/api/webhooks', limit: 200, windowMs: 60_000 },
  { prefix: '/api', limit: 60, windowMs: 60_000 },
];

export function getRateLimitBucket(pathname: string) {
  return RATE_LIMIT_BUCKETS.find((b) => pathname.startsWith(b.prefix));
}
