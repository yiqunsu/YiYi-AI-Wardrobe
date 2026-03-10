/**
 * Wardrobe vector embedding operations.
 * Provides two functions:
 *  - saveWardrobeEmbedding: embeds a clothing description and upserts it into the vector table.
 *  - searchWardrobeByEmbedding: multi-layer retrieval using warmth/formality filters + cosine similarity RPC.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { embed } from "@/lib/embedding/embedding.service";
import { formatWeatherForPrompt } from "@/lib/weather/weather.service";
import type { WeatherSummary } from "@/lib/weather/weather.service";
import type { WardrobeItemForRecommendation } from "@/types/wardrobe.types";

const CATEGORIES = [
  "tops",
  "bottoms",
  "outerwear",
  "shoes",
  "accessories",
] as const;
type Category = (typeof CATEGORIES)[number];
const TOP_PER_CATEGORY = 5;

/**
 * Generates a vector embedding for the given description and upserts it into
 * the `wardrobe_item_embeddings` table, keyed by wardrobe item ID.
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

// ── Helper: temperature → warmth range ──────────────────────────────────────
function tempToWarmthRange(tempMax: number): { min: number; max: number } {
  if (tempMax >= 28) return { min: 1, max: 2 };
  if (tempMax >= 18) return { min: 1, max: 3 };
  if (tempMax >= 10) return { min: 2, max: 4 };
  return { min: 3, max: 5 };
}

// ── Helper: occasion keyword → formality range ──────────────────────────────
function occasionToFormalityRange(occasion: string): {
  min: number;
  max: number;
} {
  const s = occasion.toLowerCase();
  if (
    /formal|black.?tie|wedding|gala|ceremony|interview|business meeting/.test(s)
  )
    return { min: 3, max: 5 };
  if (/office|work|business|conference|presentation/.test(s))
    return { min: 3, max: 5 };
  if (/dinner|date night|evening|party|brunch|smart/.test(s))
    return { min: 2, max: 4 };
  if (/sport|gym|workout|athletic|running|hiking|outdoor/.test(s))
    return { min: 1, max: 2 };
  return { min: 1, max: 3 };
}

// ── Helper: DB row → WardrobeItemForRecommendation ───────────────────────────
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

function filterByMetadata(
  items: WardrobeItemForRecommendation[],
  warmthRange: { min: number; max: number },
  formalityRange: { min: number; max: number }
): WardrobeItemForRecommendation[] {
  const filtered = items.filter((i) => {
    const w = i.warmth ?? 3;
    const f = i.formality ?? 3;
    return (
      w >= warmthRange.min &&
      w <= warmthRange.max &&
      f >= formalityRange.min &&
      f <= formalityRange.max
    );
  });
  return filtered.length >= 3 ? filtered : items;
}

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
 * Three-layer hybrid retrieval:
 * 1. Hard filter by warmth (weather) and formality (occasion).
 * 2. Per-category cosine similarity ranking via DB RPC (window function).
 * 3. Fallback: pure metadata JS filter if embedding is unavailable.
 */
export async function searchWardrobeByEmbedding(
  supabase: SupabaseClient,
  userId: string,
  weather: WeatherSummary | null,
  occasion: string,
  notes: string
): Promise<WardrobeItemForRecommendation[]> {
  const { data: allRows, error } = await supabase
    .from("wardrobe_items")
    .select("id, name, metadata")
    .eq("user_id", userId);

  if (error || !allRows || allRows.length === 0) return [];

  const allItems = (allRows as WardrobeRow[]).map(rowToItem);

  const warmthRange = weather
    ? tempToWarmthRange(weather.tempMax)
    : { min: 1, max: 5 };
  const formalityRange = occasionToFormalityRange(occasion);

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
    const queryVector = await embed(queryText);

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
      const fallbackItems = rpcRowsToItems(
        relaxedForMissing,
        allItems,
        existingIds
      );
      result.push(...fallbackItems);
    }

    if (result.length < 4) {
      return filterByMetadata(allItems, warmthRange, formalityRange);
    }

    return result;
  } catch {
    return filterByMetadata(allItems, warmthRange, formalityRange);
  }
}
