/**
 * Server-side per-user daily quota helpers [module: lib / analytics]
 *
 * Counts how many times a user has successfully fired an action today by
 * querying usage_logs via the Supabase admin client (bypasses RLS — users
 * have no read access to their own log rows).
 *
 * Design decisions:
 *  - "fail open": if the DB query errors we return 0 so a transient
 *    infrastructure issue never silently blocks legitimate requests.
 *  - Limits are defined here as a single source of truth so they are easy
 *    to find and adjust without touching individual route handlers.
 *  - Per-user overrides can be added to user_settings later if needed.
 */
import "server-only";
import { supabaseAdmin } from "@/lib/db/admin";
import type { UsageAction } from "./usage.logger";

/** Default daily call limits per action (across all endpoints sharing that action type). */
export const DAILY_LIMITS: Partial<Record<UsageAction, number>> = {
  wardrobe_process: 20, // process-batch calls per day
} as const;

/**
 * Returns the number of successful `action` calls the user has made today (UTC).
 * Returns 0 on any error (fail open).
 */
export async function getDailyActionCount(
  userId: string,
  action: UsageAction
): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);

  const { count, error } = await supabaseAdmin
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .eq("status", "success")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (error) {
    console.error("[quota.server] getDailyActionCount error:", error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Checks whether the user is within their daily limit for `action`.
 * Returns `{ allowed, used, limit }`.
 */
export async function checkDailyQuota(
  userId: string,
  action: UsageAction
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limit = DAILY_LIMITS[action] ?? Infinity;
  const used = await getDailyActionCount(userId, action);
  return { allowed: used < limit, used, limit };
}
