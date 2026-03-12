/**
 * POST /api/wardrobe/process-batch [module: api / wardrobe]
 *
 * Accepts up to 10 wardrobe item IDs and processes each one through the global
 * Gemini concurrency limiter (see src/lib/queue/gemini.queue.ts).  Results are
 * streamed back as newline-delimited JSON (NDJSON) so the client can update its
 * progress bar in real-time without polling.
 *
 * Stream event shapes:
 *   {"type":"progress","id":"…","ok":true,"completed":1,"total":5}
 *   {"type":"progress","id":"…","ok":false,"error":"…","completed":2,"total":5}
 *   {"type":"done","success":["…"],"failed":[{"id":"…","error":"…"}]}
 *
 * Concurrency is controlled globally by `geminiLimit` — all users share the
 * same pool, so sending 10 items from 5 concurrent users will never exceed the
 * configured cap (default: 3 simultaneous Gemini calls).
 *
 * Rate limit: DAILY_LIMITS.wardrobe_process calls per day per user (shared
 * pool with process-item).
 */
import { NextRequest } from "next/server";
import { createSupabaseClient } from "@/lib/db/server";
import { processOneWardrobeItem } from "@/lib/wardrobe/wardrobe.service";
import { geminiLimit } from "@/lib/queue/gemini.queue";
import { logUsage } from "@/lib/analytics/usage.logger";
import { checkDailyQuota } from "@/lib/analytics/quota.server";

const MAX_IDS = 10;

export async function POST(request: NextRequest) {
  const token =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Auth: resolve user ID for quota check ────────────────
  const supabase = createSupabaseClient(token);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Daily quota check ────────────────────────────────────
  const quota = await checkDailyQuota(user.id, "wardrobe_process");
  if (!quota.allowed) {
    logUsage({
      userId: user.id,
      action: "wardrobe_process",
      status: "quota_exceeded",
    });
    return new Response(
      JSON.stringify({
        error: `Daily processing limit reached. You can process up to ${quota.limit} batches per day.`,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  let ids: string[];
  try {
    const body = await request.json();
    const raw = body?.wardrobeItemIds;
    ids = Array.isArray(raw)
      ? (raw as unknown[]).filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (ids.length === 0) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid wardrobeItemIds" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (ids.length > MAX_IDS) {
    return new Response(
      JSON.stringify({ error: `At most ${MAX_IDS} items per batch` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const total = ids.length;
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const success: string[] = [];
      const failed: { id: string; error: string }[] = [];
      let completed = 0;

      // Submit all items to the global limiter at once.
      // The limiter ensures at most GEMINI_CONCURRENCY tasks run in parallel
      // across ALL users hitting this server simultaneously.
      await Promise.all(
        ids.map((id) =>
          geminiLimit(async () => {
            let ok = false;
            let errorMsg = "";
            try {
              await processOneWardrobeItem(supabase, id);
              ok = true;
              success.push(id);
            } catch (e) {
              errorMsg = e instanceof Error ? e.message : "Unknown error";
              failed.push({ id, error: errorMsg });
            }
            completed += 1;

            const event = ok
              ? { type: "progress", id, ok: true, completed, total }
              : { type: "progress", id, ok: false, error: errorMsg, completed, total };

            controller.enqueue(enc.encode(JSON.stringify(event) + "\n"));
          })
        )
      );

      logUsage({
        userId: user.id,
        action: "wardrobe_process",
        status: "success",
        metadata: { count: ids.length, succeeded: success.length, failed: failed.length },
      });

      controller.enqueue(
        enc.encode(JSON.stringify({ type: "done", success, failed }) + "\n")
      );
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
