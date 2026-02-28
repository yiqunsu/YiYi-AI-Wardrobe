import type { SupabaseClient } from "@supabase/supabase-js";
import { embed } from "@/lib/embedding/embed";
import { formatWeatherForPrompt } from "@/lib/weather/getWeatherForLocation";
import type { WeatherSummary } from "@/lib/weather/getWeatherForLocation";
import type { WardrobeItemForRecommendation } from "@/lib/outfit/recommendOutfit";

const CATEGORIES = ["tops", "bottoms", "outerwear", "shoes", "accessories"] as const;
type Category = (typeof CATEGORIES)[number];
const TOP_PER_CATEGORY = 5;

// ── 温度 → warmth 范围 ────────────────────────────────────────
function tempToWarmthRange(tempMax: number): { min: number; max: number } {
  if (tempMax >= 28) return { min: 1, max: 2 };
  if (tempMax >= 18) return { min: 1, max: 3 };
  if (tempMax >= 10) return { min: 2, max: 4 };
  return { min: 3, max: 5 };
}

// ── 场合关键词 → formality 范围 ──────────────────────────────
function occasionToFormalityRange(occasion: string): { min: number; max: number } {
  const s = occasion.toLowerCase();
  if (/formal|black.?tie|wedding|gala|ceremony|interview|business meeting/.test(s))
    return { min: 3, max: 5 };
  if (/office|work|business|conference|presentation/.test(s))
    return { min: 3, max: 5 };
  if (/dinner|date night|evening|party|brunch|smart/.test(s))
    return { min: 2, max: 4 };
  if (/sport|gym|workout|athletic|running|hiking|outdoor/.test(s))
    return { min: 1, max: 2 };
  // casual / everyday / default
  return { min: 1, max: 3 };
}

// ── DB 行 → WardrobeItemForRecommendation ────────────────────
interface WardrobeRow {
  id: string;
  name: string;
  metadata?: {
    category?: string;
    warmth?: number;
    formality?: number;
    description?: string;
  } | null;
}

function rowToItem(row: WardrobeRow): WardrobeItemForRecommendation {
  const meta = row.metadata ?? {};
  return {
    id: row.id,
    name: row.name || "",
    category: meta.category ?? "tops",
    description: meta.description ?? null,
    warmth: meta.warmth ?? null,
    formality: meta.formality ?? null,
  };
}

// ── metadata 纯 JS 过滤（embedding 不可用时的兜底）──────────
function filterByMetadata(
  items: WardrobeItemForRecommendation[],
  warmthRange: { min: number; max: number },
  formalityRange: { min: number; max: number }
): WardrobeItemForRecommendation[] {
  const filtered = items.filter((i) => {
    const w = i.warmth ?? 3;
    const f = i.formality ?? 3;
    return w >= warmthRange.min && w <= warmthRange.max && f >= formalityRange.min && f <= formalityRange.max;
  });
  // 如果过滤后太少，返回全部（至少给 LLM 有东西选）
  return filtered.length >= 3 ? filtered : items;
}

// ── RPC 结果转换为 WardrobeItemForRecommendation ─────────────
// SQL 层已通过窗口函数保证每 category 最多 top_per_cat 条，此处只做 ID→Item 映射
interface RpcRow {
  wardrobe_item_id: string;
  category: string;
  similarity: number;
}

function rpcRowsToItems(
  rpcRows: RpcRow[],
  allItems: WardrobeItemForRecommendation[],
  excludeIds?: Set<string>
): WardrobeItemForRecommendation[] {
  const itemById = new Map(allItems.map((i) => [i.id, i]));
  const result: WardrobeItemForRecommendation[] = [];

  for (const row of rpcRows) {
    if (excludeIds?.has(row.wardrobe_item_id)) continue;
    const item = itemById.get(row.wardrobe_item_id);
    if (!item) continue;
    result.push(item);
  }
  return result;
}

/**
 * 三层混合检索：warmth/formality 硬过滤 → DB 内 per-category cosine 排序（窗口函数）→ 每 category top 5
 * 兜底：embedding 不可用时退回 metadata JS 过滤
 */
export async function searchWardrobeByEmbedding(
  supabase: SupabaseClient,
  userId: string,
  weather: WeatherSummary | null,
  occasion: string,
  notes: string
): Promise<WardrobeItemForRecommendation[]> {
  // 1. 拉取所有衣橱单品（fallback 和 LLM 输入都需要）
  const { data: allRows, error } = await supabase
    .from("wardrobe_items")
    .select("id, name, metadata")
    .eq("user_id", userId);

  if (error || !allRows || allRows.length === 0) return [];

  const allItems = (allRows as WardrobeRow[]).map(rowToItem);

  // 2. 计算过滤范围
  const warmthRange = weather ? tempToWarmthRange(weather.tempMax) : { min: 1, max: 5 };
  const formalityRange = occasionToFormalityRange(occasion);

  // 3. 构建查询文本
  const queryParts = [
    weather ? formatWeatherForPrompt(weather) : "",
    occasion ? `Occasion: ${occasion}` : "",
    notes?.trim() ? `User notes: ${notes.trim()}` : "",
  ].filter(Boolean);

  if (queryParts.length === 0) {
    return filterByMetadata(allItems, warmthRange, formalityRange);
  }

  const queryText = queryParts.join("\n");

  try {
    // 4. 生成 embedding
    const queryVector = await embed(queryText);

    // 5. 第一次 RPC：strict warmth + formality 过滤，SQL 内按 category 各取 top 5
    const { data: strictRows } = await supabase.rpc("match_wardrobe_items", {
      query_embedding: queryVector,
      p_user_id: userId,
      warmth_min: warmthRange.min,
      warmth_max: warmthRange.max,
      formality_min: formalityRange.min,
      formality_max: formalityRange.max,
      top_per_cat: TOP_PER_CATEGORY,
    });

    const result = rpcRowsToItems(strictRows ?? [], allItems);
    const coveredCats = new Set(result.map((i) => i.category as Category));
    const missingCats = CATEGORIES.filter((c) => !coveredCats.has(c));

    // 6. 对缺失的 category 放宽 formality 范围重查，每 category 取 top 3 作为补充
    if (missingCats.length > 0) {
      const { data: relaxedRows } = await supabase.rpc("match_wardrobe_items", {
        query_embedding: queryVector,
        p_user_id: userId,
        warmth_min: warmthRange.min,
        warmth_max: warmthRange.max,
        formality_min: 1,
        formality_max: 5,
        top_per_cat: 3,
      });

      const existingIds = new Set(result.map((i) => i.id));
      const relaxedForMissing = ((relaxedRows ?? []) as RpcRow[]).filter((r) =>
        missingCats.includes(r.category as Category)
      );
      const fallbackItems = rpcRowsToItems(relaxedForMissing, allItems, existingIds);
      result.push(...fallbackItems);
    }

    // 7. 若向量结果仍太少，补充 metadata 过滤结果
    if (result.length < 4) {
      return filterByMetadata(allItems, warmthRange, formalityRange);
    }

    return result;
  } catch {
    // embedding 或 RPC 不可用 → 纯 metadata 过滤兜底
    return filterByMetadata(allItems, warmthRange, formalityRange);
  }
}
