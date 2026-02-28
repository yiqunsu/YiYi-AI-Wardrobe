import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/server";
import { processOneWardrobeItem } from "@/lib/wardrobe/processOneWardrobeItem";

/**
 * POST /api/wardrobe/process-item
 * Body: { wardrobeItemId: string }
 * 对单个 wardrobe item 执行 LLM 分析 → 校验 → 存 metadata → embedding
 * 返回 { success: true, id: string } | { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const token =
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const wardrobeItemId = body?.wardrobeItemId;
    if (typeof wardrobeItemId !== "string" || !wardrobeItemId) {
      return NextResponse.json(
        { error: "Missing wardrobeItemId" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient(token);
    await processOneWardrobeItem(supabase, wardrobeItemId);

    return NextResponse.json({ success: true, id: wardrobeItemId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
