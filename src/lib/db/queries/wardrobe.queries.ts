/**
 * Database query functions for the wardrobe domain.
 * Handles CRUD operations and Storage uploads for the `wardrobe_items` table
 * and the `wardrobe-items` storage bucket.
 */
"use client";

import { supabase } from "../client";
import type {
  WardrobeRow,
  WardrobeItem,
  WardrobeItemMetadata,
  WardrobeCategory,
} from "@/types/wardrobe.types";
import { getCategoryFromMetadata } from "@/types/wardrobe.types";
import {
  BUCKET_WARDROBE_ITEMS,
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

export async function fetchWardrobeItems(
  userId: string
): Promise<WardrobeItem[]> {
  const { data: rows, error } = await supabase
    .from("wardrobe_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!rows?.length) return [];

  const items: WardrobeItem[] = [];
  for (const row of rows as WardrobeRow[]) {
    const imageUrl =
      (await getSignedUrl(BUCKET_WARDROBE_ITEMS, row.image_path)) ?? "";
    const meta = row.metadata as WardrobeItemMetadata | undefined;
    items.push({
      id: row.id,
      name: row.name || "",
      category: getCategoryFromMetadata(meta),
      imageUrl,
      uploadedAt: new Date(row.created_at),
      metadata: meta ?? null,
    });
  }
  return items;
}

export async function uploadWardrobeItem(
  userId: string,
  file: File,
  _category?: WardrobeCategory,
  name?: string
): Promise<WardrobeRow> {
  const ext = getFileExt(file);
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_WARDROBE_ITEMS)
    .upload(path, file, { upsert: false });

  if (uploadError) throw uploadError;

  const displayName = name || file.name.replace(/\.[^/.]+$/, "") || "Item";

  const { data: row, error } = await supabase
    .from("wardrobe_items")
    .insert({
      user_id: userId,
      name: displayName,
      image_path: path,
    })
    .select()
    .single();

  if (error) throw error;
  return row as WardrobeRow;
}

/** Updates only the `name` field. Category and other metadata are managed via the metadata PATCH endpoint. */
export async function updateWardrobeItem(
  id: string,
  updates: { name?: string }
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (updates.name !== undefined) body.name = updates.name;
  if (Object.keys(body).length === 0) return;
  const { error } = await supabase
    .from("wardrobe_items")
    .update(body)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteWardrobeItem(id: string): Promise<void> {
  const { data: row } = await supabase
    .from("wardrobe_items")
    .select("image_path")
    .eq("id", id)
    .single();
  if (row) {
    await supabase.storage
      .from(BUCKET_WARDROBE_ITEMS)
      .remove([(row as { image_path: string }).image_path]);
  }
  const { error } = await supabase
    .from("wardrobe_items")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
