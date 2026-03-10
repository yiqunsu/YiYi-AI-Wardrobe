/**
 * PATCH /api/wardrobe/update-metadata [module: api / wardrobe]
 * Validates and persists the metadata JSON field (category, warmth, formality, description)
 * for a single wardrobe item, used after manual edits or re-analysis.
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/db/server";
import { updateWardrobeMetadata } from "@/lib/wardrobe/wardrobe.metadata";

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { wardrobeItemId, metadata } = body;
    if (!wardrobeItemId || typeof wardrobeItemId !== "string") {
      return NextResponse.json({ error: "Missing or invalid wardrobeItemId" }, { status: 400 });
    }

    const supabase = createSupabaseClient(token);
    await updateWardrobeMetadata(supabase, wardrobeItemId, metadata);
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error";
    const status = msg === "Wardrobe item not found" ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
