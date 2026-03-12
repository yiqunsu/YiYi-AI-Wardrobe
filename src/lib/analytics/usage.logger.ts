/**
 * Usage logger [module: lib / analytics]
 * Fire-and-forget helper for writing usage events to the usage_logs table
 * via the Supabase admin client (bypasses RLS, ensures logs are never lost).
 * Never throws — logging failures must not break the main request.
 */
import "server-only";
import { supabaseAdmin } from "@/lib/db/admin";

export type UsageAction =
  | "outfit_generate"
  | "wardrobe_upload"
  | "wardrobe_process";
type UsageStatus = "success" | "error" | "quota_exceeded";

export interface UsageLogPayload {
  userId: string;
  action: UsageAction;
  status: UsageStatus;
  metadata?: Record<string, unknown>;
}


export function logUsage(payload: UsageLogPayload): void {
  supabaseAdmin
    .from("usage_logs")
    .insert({
      user_id: payload.userId,
      action: payload.action,
      status: payload.status,
      metadata: payload.metadata ?? null,
    })
    .then(({ error }) => {
      if (error) console.error("[usage.logger] Failed to write usage log:", error.message);
    });
}
