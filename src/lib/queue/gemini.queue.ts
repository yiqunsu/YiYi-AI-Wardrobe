/**
 * Global Gemini API concurrency limiter [module: lib / queue]
 *
 * Singleton p-limit instance shared across ALL in-flight requests in this
 * Node.js process.  Every call that touches the Gemini API should be wrapped
 * with `geminiLimit(() => ...)` so that at most GEMINI_CONCURRENCY requests
 * are active at any given moment, regardless of how many users are uploading
 * simultaneously.
 *
 * Concurrency is configurable via the GEMINI_CONCURRENCY environment variable
 * (default: 3).  For multi-instance deployments (multiple containers / PM2
 * cluster), swap this module for a BullMQ queue backed by Redis — the callers
 * do not need to change.
 */
import "server-only";
import pLimit from "p-limit";

const concurrency = (() => {
  const raw = process.env.GEMINI_CONCURRENCY;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
})();

/** Maximum simultaneous Gemini API calls across all users in this process. */
export const geminiLimit = pLimit(concurrency);
