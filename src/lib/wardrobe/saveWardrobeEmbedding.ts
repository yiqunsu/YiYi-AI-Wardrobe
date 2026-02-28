import type { SupabaseClient } from "@supabase/supabase-js";
import { embed } from "@/lib/embedding/embed";

/**
 * 将某条 wardrobe_item 的 description 做 embedding 并写入 Vector 表
 * 使用传入的 supabase 客户端（需为已认证用户，以通过 RLS）
 */
export async function saveWardrobeEmbedding(
  supabase: SupabaseClient,
  wardrobeItemId: string,
  description: string
): Promise<void> {
  const trimmed = description.trim();
  if (!trimmed) {
    throw new Error("Description is empty, cannot embed");
  }

  const vector = await embed(trimmed);

  const { error } = await supabase
    .from("wardrobe_item_embeddings")
    .upsert(
      {
        wardrobe_item_id: wardrobeItemId,
        embedding: vector,
        raw_description: trimmed,
      },
      { onConflict: "wardrobe_item_id" }
    );

  if (error) {
    throw new Error(error.message);
  }
}
