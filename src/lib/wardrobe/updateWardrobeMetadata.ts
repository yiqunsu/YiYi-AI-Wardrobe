import type { SupabaseClient } from "@supabase/supabase-js";
import { validateMetadata, sanitizeMetadata } from "@/lib/validators/metadata";

export async function updateWardrobeMetadata(
  supabase: SupabaseClient,
  wardrobeItemId: string,
  metadata: unknown
): Promise<void> {
  if (!validateMetadata(metadata)) throw new Error("Invalid metadata");
  const safe = sanitizeMetadata(metadata);

  const { data: row, error: fetchError } = await supabase
    .from("wardrobe_items")
    .select("id")
    .eq("id", wardrobeItemId)
    .single();

  if (fetchError || !row) {
    throw new Error("Wardrobe item not found");
  }

  const { error: updateError } = await supabase
    .from("wardrobe_items")
    .update({ metadata: safe })
    .eq("id", wardrobeItemId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}
