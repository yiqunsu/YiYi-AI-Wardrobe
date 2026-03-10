/**
 * POST /api/wardrobe/analyze [module: api / wardrobe]
 * Triggers LLM (Gemini) analysis on a single wardrobe item identified by ID.
 * Returns raw analysis attributes (category, warmth, formality, description) without saving.
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/db/server";
import { analyzeWardrobeItem } from "@/lib/wardrobe/wardrobe.service";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const wardrobeItemId = body?.wardrobeItemId;
    if (!wardrobeItemId || typeof wardrobeItemId !== "string") {
      return NextResponse.json({ error: "Missing or invalid wardrobeItemId" }, { status: 400 });
    }

    const supabase = createSupabaseClient(token);
    const result = await analyzeWardrobeItem(supabase, wardrobeItemId);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error";
    const status = msg === "Wardrobe item not found" ? 404 : msg === "Failed to get image URL" ? 500 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
