/**
 * Wardrobe item processing service.
 * Provides two main operations:
 *  - analyzeWardrobeItem: fetches a clothing image and calls the LLM to extract attributes.
 *  - processOneWardrobeItem: full pipeline — analyze → validate → save metadata → embed description.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeClothing } from "@/lib/llm";
import {
  getDescriptionFromMetadata,
  sanitizeMetadata,
} from "@/lib/validators/wardrobe.schema";
import { saveWardrobeEmbedding } from "./wardrobe.embedding";
import { updateWardrobeMetadata } from "./wardrobe.metadata";

const BUCKET = "wardrobe-items";
const SIGNED_URL_EXPIRY = 60 * 60;

/**
 * Fetches the image for a wardrobe item and analyzes it with the clothing LLM.
 * Returns the raw analysis result (category, warmth, formality, description).
 */
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
    .createSignedUrl(
      (row as { image_path: string }).image_path,
      SIGNED_URL_EXPIRY
    );

  const imageUrl = signedUrlData?.signedUrl;
  if (!imageUrl) {
    throw new Error("Failed to get image URL");
  }

  const display = await analyzeClothing(imageUrl);
  return { wardrobeItemId, display };
}

export interface ProcessOneResult {
  wardrobeItemId: string;
}

/**
 * Full processing pipeline for a single wardrobe item:
 * fetch image → LLM analyze → validate → save metadata → embed description → write to vector table.
 * Throws on any step failure so the caller can collect success/failure lists.
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
