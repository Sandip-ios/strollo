// In-memory, per-process sliding-window rate limiter — fine for a single
// server instance. If this ever runs across multiple instances (serverless,
// multiple containers), each would track its own independent counts, so
// swap the Map for a shared store (Redis/Upstash) before scaling out.
const buckets = new Map<string, { count: number; resetAt: number }>();

// Periodically drop expired buckets so this doesn't grow unbounded over a
// long-running process.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  },
  10 * 60 * 1000
).unref();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}
