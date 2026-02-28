import type { SupabaseClient } from "@supabase/supabase-js";
import { getDescriptionFromMetadata, sanitizeMetadata } from "@/lib/validators/metadata";
import { analyzeWardrobeItem } from "./analyzeWardrobeItem";
import { saveWardrobeEmbedding } from "./saveWardrobeEmbedding";
import { updateWardrobeMetadata } from "./updateWardrobeMetadata";

export interface ProcessOneResult {
  wardrobeItemId: string;
}

/**
 * 单条工作流：取图 → LLM 分析 → 校验 → 存 metadata → description embedding → 写 Vector 表
 * 任一步失败则抛出，由上层收集成功/失败列表
 */
export async function processOneWardrobeItem(
  supabase: SupabaseClient,
  wardrobeItemId: string
): Promise<ProcessOneResult> {
  const { display } = await analyzeWardrobeItem(supabase, wardrobeItemId);

  const safe = sanitizeMetadata(display);
  if (!safe) {
    throw new Error("LLM response failed metadata validation");
  }

  await updateWardrobeMetadata(supabase, wardrobeItemId, safe);

  const description = getDescriptionFromMetadata(safe);
  if (description) {
    await saveWardrobeEmbedding(supabase, wardrobeItemId, description);
  }

  return { wardrobeItemId };
}
