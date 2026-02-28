import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/server";
import { processOneWardrobeItem } from "@/lib/wardrobe/processOneWardrobeItem";

const MAX_IDS = 10;
/** 同一时刻最多并行处理几条，避免 Gemini 限流 */
const CONCURRENCY = 10;

/**
 * POST /api/wardrobe/process-batch
 * Body: { wardrobeItemIds: string[] }
 * 对每个 id 并行执行（上限 CONCURRENCY）：LLM 分析 → 校验 → 存 metadata → embedding → 写 Vector 表
 * 返回 { success: string[], failed: { id: string, error: string }[] }
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const raw = body?.wardrobeItemIds;
    const ids = Array.isArray(raw)
      ? (raw as unknown[]).filter((id): id is string => typeof id === "string")
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "Missing or invalid wardrobeItemIds" }, { status: 400 });
    }
    if (ids.length > MAX_IDS) {
      return NextResponse.json(
        { error: `At most ${MAX_IDS} items per batch` },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient(token);
    const success: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const chunk = ids.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        chunk.map(async (id) => {
          try {
            await processOneWardrobeItem(supabase, id);
            return { ok: true as const, id };
          } catch (e) {
            return {
              ok: false as const,
              id,
              error: e instanceof Error ? e.message : "Unknown error",
            };
          }
        })
      );
      for (const r of results) {
        if (r.ok) success.push(r.id);
        else failed.push({ id: r.id, error: r.error });
      }
    }

    return NextResponse.json({ success, failed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
