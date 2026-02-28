import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeClothing } from "@/lib/llm";

const BUCKET = "wardrobe-items";
const SIGNED_URL_EXPIRY = 60 * 60;

export async function analyzeWardrobeItem(
  supabase: SupabaseClient,
  wardrobeItemId: string
): Promise<{ wardrobeItemId: string; display: Record<string, unknown> }> {
  const { data: row, error: fetchError } = await supabase
    .from("wardrobe_items")
    .select("id, image_path")
    .eq("id", wardrobeItemId)
    .single();

  if (fetchError || !row) {
    throw new Error("Wardrobe item not found");
  }

  const { data: signedUrlData } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl((row as { image_path: string }).image_path, SIGNED_URL_EXPIRY);

  const imageUrl = signedUrlData?.signedUrl;
  if (!imageUrl) {
    throw new Error("Failed to get image URL");
  }

  const display = await analyzeClothing(imageUrl);
  return { wardrobeItemId, display };
}
