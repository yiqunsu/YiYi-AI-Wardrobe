/**
 * GET /api/quota [module: api / quota]
 * Returns the current user's quota consumption so the UI can display
 * "X of 5 outfit generations remaining today" and wardrobe usage.
 *
 * Also respects per-user overrides stored in user_settings (seed users).
 *
 * Response: {
 *   outfitsToday: number,
 *   outfitDailyLimit: number,
 *   outfitsRemaining: number,
 *   wardrobeCount: number,
 *   wardrobeLimit: number,
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/db/server";

export const DEFAULT_OUTFIT_DAILY_LIMIT = 5;
export const DEFAULT_WARDROBE_LIMIT = 50;

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check for per-user limit overrides (seed users / power users)
  const { data: userSettings } = await supabase
    .from("user_settings")
    .select("outfit_daily_limit, wardrobe_limit")
    .eq("user_id", user.id)
    .maybeSingle();

  const outfitDailyLimit =
    (userSettings as { outfit_daily_limit?: number } | null)?.outfit_daily_limit ??
    DEFAULT_OUTFIT_DAILY_LIMIT;
  const wardrobeLimit =
    (userSettings as { wardrobe_limit?: number } | null)?.wardrobe_limit ??
    DEFAULT_WARDROBE_LIMIT;

  // Today's outfit generation count
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  const [{ count: outfitsToday }, { count: wardrobeCount }] = await Promise.all([
    supabase
      .from("outfit_generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString()),
    supabase
      .from("wardrobe_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const today = outfitsToday ?? 0;
  const wardrobe = wardrobeCount ?? 0;

  return NextResponse.json({
    outfitsToday: today,
    outfitDailyLimit,
    outfitsRemaining: Math.max(0, outfitDailyLimit - today),
    wardrobeCount: wardrobe,
    wardrobeLimit,
  });
}
