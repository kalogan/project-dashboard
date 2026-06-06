/**
 * In-process approximation of the Gemini free-tier RPM window.
 *
 * A simple module-level ring of request timestamps (shared across the dev
 * server process). Good enough to warn before hitting the ceiling and to
 * gracefully degrade the editor — not a distributed rate limiter.
 */

const RPM_LIMIT = 15; // Gemini 1.5 Flash free tier ≈ 15 requests/min.
const WINDOW_MS = 60_000;
const hits: number[] = [];

function prune(now: number) {
  const cutoff = now - WINDOW_MS;
  while (hits.length > 0 && hits[0] < cutoff) hits.shift();
}

/** Record a request against the current minute window. */
export function recordRequest(): void {
  const now = Date.now();
  prune(now);
  hits.push(now);
}

export interface RateWindow {
  limit: number;
  used: number;
  remaining: number;
}

/** Current usage of the RPM window. */
export function getRateWindow(): RateWindow {
  prune(Date.now());
  const used = hits.length;
  return { limit: RPM_LIMIT, used, remaining: Math.max(0, RPM_LIMIT - used) };
}
