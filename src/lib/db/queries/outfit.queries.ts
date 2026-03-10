/**
 * Database query functions for the outfit generation and history domain.
 * Handles CRUD operations and Storage uploads for the `outfit_generations` table
 * and the `generated-outfits` storage bucket.
 */
"use client";

import { supabase } from "../client";
import type {
  OutfitGenerationRow,
  HistoryItem,
  SelectedWardrobeItem,
  AddOutfitGenerationInput,
} from "@/types/outfit.types";
import type { WardrobeItemMetadata } from "@/types/wardrobe.types";
import { getCategoryFromMetadata } from "@/types/wardrobe.types";
import {
  BUCKET_WARDROBE_ITEMS,
  BUCKET_GENERATED_OUTFITS,
  SIGNED_URL_EXPIRY_1H,
} from "@/config/constants";

async function getSignedUrl(
  bucket: string,
  path: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_EXPIRY_1H);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

function getFileExt(file: File): string {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "jpg";
}

export async function fetchOutfitGenerations(
  userId: string
): Promise<HistoryItem[]> {
  const { data: rows, error } = await supabase
    .from("outfit_generations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!rows?.length) return [];

  const typedRows = rows as OutfitGenerationRow[];

  const allItemIds = [
    ...new Set(
      typedRows.flatMap((r) =>
        Array.isArray(r.selected_item_ids) ? r.selected_item_ids : []
      )
    ),
  ];

  interface WardrobeRowPartial {
    id: string;
    name: string;
    image_path: string;
    metadata?: Record<string, unknown> | null;
  }
  const itemInfoMap = new Map<string, WardrobeRowPartial>();
  if (allItemIds.length > 0) {
    const { data: wardrobeRows } = await supabase
      .from("wardrobe_items")
      .select("id, name, image_path, metadata")
      .in("id", allItemIds);

    for (const wr of (wardrobeRows ?? []) as WardrobeRowPartial[]) {
      itemInfoMap.set(wr.id, wr);
    }
  }

  const uniquePaths = [
    ...new Set([...itemInfoMap.values()].map((r) => r.image_path)),
  ];
  const pathUrlMap = new Map<string, string>();
  await Promise.all(
    uniquePaths.map(async (path) => {
      const url = await getSignedUrl(BUCKET_WARDROBE_ITEMS, path);
      if (url) pathUrlMap.set(path, url);
    })
  );

  const items: HistoryItem[] = [];
  for (const row of typedRows) {
    let imageUrl: string | null = null;
    if (row.result_image_path) {
      imageUrl = await getSignedUrl(BUCKET_GENERATED_OUTFITS, row.result_image_path);
    }

    const selectedItems: SelectedWardrobeItem[] = (
      Array.isArray(row.selected_item_ids) ? row.selected_item_ids : []
    ).reduce<SelectedWardrobeItem[]>((acc, id) => {
      const info = itemInfoMap.get(id);
      if (!info) return acc;
      const url = pathUrlMap.get(info.image_path);
      if (!url) return acc;
      const meta = (info.metadata as WardrobeItemMetadata | undefined) ?? null;
      acc.push({
        id,
        imageUrl: url,
        name: info.name || "",
        category: getCategoryFromMetadata(meta),
        metadata: meta,
      });
      return acc;
    }, []);

    items.push({
      id: row.id,
      date: new Date(row.occasion_date),
      occasion: row.occasion || "",
      location: row.location || "",
      additionalNotes: row.additional_notes ?? null,
      imageUrl,
      imagePath: row.result_image_path ?? null,
      message: row.result_message ?? undefined,
      description: row.result_description ?? undefined,
      isLiked: row.is_liked,
      selectedItems,
    });
  }
  return items;
}

export async function addOutfitGeneration(
  userId: string,
  input: AddOutfitGenerationInput
): Promise<OutfitGenerationRow> {
  const { data: row, error } = await supabase
    .from("outfit_generations")
    .insert({
      user_id: userId,
      model_id: input.modelId || null,
      location: input.location,
      location_lat: input.locationLat ?? null,
      location_lon: input.locationLon ?? null,
      occasion_date: input.occasionDate.toISOString().slice(0, 10),
      occasion: input.occasion,
      additional_notes: input.additionalNotes ?? null,
      result_image_path: input.resultImagePath ?? null,
      result_message: input.resultMessage ?? null,
      result_description: input.resultDescription ?? null,
      is_liked: false,
    })
    .select()
    .single();

  if (error) throw error;
  return row as OutfitGenerationRow;
}

export async function toggleOutfitLike(id: string): Promise<boolean> {
  const { data: row } = await supabase
    .from("outfit_generations")
    .select("is_liked")
    .eq("id", id)
    .single();
  const next = !(row as { is_liked: boolean } | null)?.is_liked;
  const { error } = await supabase
    .from("outfit_generations")
    .update({ is_liked: next })
    .eq("id", id);
  if (error) throw error;
  return next;
}

export async function deleteOutfitGeneration(id: string): Promise<void> {
  const { data: row } = await supabase
    .from("outfit_generations")
    .select("result_image_path")
    .eq("id", id)
    .single();

  if (row) {
    const r = row as { result_image_path: string | null };
    if (r.result_image_path) {
      await supabase.storage
        .from(BUCKET_GENERATED_OUTFITS)
        .remove([r.result_image_path]);
    }
  }

  const { error } = await supabase
    .from("outfit_generations")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function uploadGeneratedOutfit(
  userId: string,
  file: File
): Promise<string> {
  const ext = getFileExt(file);
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET_GENERATED_OUTFITS)
    .upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}
