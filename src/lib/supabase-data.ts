/**
 * 本文件封装了与 Supabase 数据库和存储 Buckets 的常用交互方法，
 * 主要用于模特数据、衣橱管理、以及生成搭配结果等相关的 CRUD 操作和文件存储、下载等功能。
 * 提供了一系列便捷的 TypeScript 接口和辅助函数，方便前端通过 Supabase 客户端与后端服务安全高效地进行数据交互。
 */
"use client";

import { supabase } from "./supabase/client";

const BUCKET_MODEL_PHOTOS = "model-photos";
const BUCKET_WARDROBE_ITEMS = "wardrobe-items";
const BUCKET_GENERATED_OUTFITS = "generated-outfits";

const SIGNED_URL_EXPIRY = 60 * 60; // 1 hour

// --- Storage helpers ---

async function getSignedUrl(
  bucket: string,
  path: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

function getFileExt(file: File): string {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "jpg";
}

// --- Models (Collection) ---

export interface ModelRow {
  id: string;
  user_id: string | null;
  name: string;
  image_path: string;
  is_default: boolean;
  created_at: string;
}

export interface ModelItem {
  id: string;
  name: string;
  imageUrl: string;
  uploadedAt: Date;
  isDefault?: boolean;
  /** 系统默认模特（user_id 为 null），不可编辑/删除 */
  isSystemDefault?: boolean;
}

export async function fetchModels(userId: string): Promise<ModelItem[]> {
  const { data: rows, error } = await supabase
    .from("models")
    .select("*")
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!rows?.length) return [];

  const items: ModelItem[] = [];
  for (const row of rows as ModelRow[]) {
    const imageUrl =
      (await getSignedUrl(BUCKET_MODEL_PHOTOS, row.image_path)) ?? "";
    items.push({
      id: row.id,
      name: row.name || "",
      imageUrl,
      uploadedAt: new Date(row.created_at),
      isDefault: row.is_default,
      isSystemDefault: row.user_id === null,
    });
  }
  return items;
}

export async function uploadModel(
  userId: string,
  file: File,
  name?: string
): Promise<ModelRow> {
  const ext = getFileExt(file);
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_MODEL_PHOTOS)
    .upload(path, file, { upsert: false });

  if (uploadError) throw uploadError;

  const displayName = name || file.name.replace(/\.[^/.]+$/, "") || "Model";
  const { data: existing } = await supabase
    .from("models")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const isDefault = !existing;

  const { data: row, error } = await supabase
    .from("models")
    .insert({
      user_id: userId,
      name: displayName,
      image_path: path,
      is_default: isDefault,
    })
    .select()
    .single();

  if (error) throw error;
  return row as ModelRow;
}

export async function updateModel(
  id: string,
  updates: { name?: string; is_default?: boolean }
): Promise<void> {
  const { data: row } = await supabase
    .from("models")
    .select("user_id")
    .eq("id", id)
    .single();
  if (row && (row as { user_id: string | null }).user_id === null) return;

  const body: Record<string, unknown> = {};
  if (updates.name !== undefined) body.name = updates.name;
  if (updates.is_default !== undefined) {
    body.is_default = updates.is_default;
    if (updates.is_default && row) {
      const uid = (row as { user_id: string | null }).user_id;
      if (uid != null) {
        await supabase
          .from("models")
          .update({ is_default: false })
          .eq("user_id", uid)
          .neq("id", id);
      }
    }
  }
  if (Object.keys(body).length === 0) return;
  const { error } = await supabase.from("models").update(body).eq("id", id);
  if (error) throw error;
}

export async function deleteModel(id: string): Promise<void> {
  const { data: row } = await supabase
    .from("models")
    .select("image_path, user_id")
    .eq("id", id)
    .single();
  if (!row) return;
  const r = row as { image_path: string; user_id: string | null };
  if (r.user_id === null) return;
  await supabase.storage
    .from(BUCKET_MODEL_PHOTOS)
    .remove([r.image_path]);
  const { error } = await supabase.from("models").delete().eq("id", id);
  if (error) throw error;
}

// --- Wardrobe items ---

export type WardrobeCategory =
  | "tops"
  | "bottoms"
  | "outerwear"
  | "shoes"
  | "accessories";

const WARDROBE_CATEGORIES: WardrobeCategory[] = [
  "tops",
  "bottoms",
  "outerwear",
  "shoes",
  "accessories",
];

function getCategoryFromMetadata(meta?: WardrobeItemMetadata | null): WardrobeCategory {
  const c = meta?.category;
  if (typeof c !== "string") return "tops";
  return WARDROBE_CATEGORIES.includes(c as WardrobeCategory) ? (c as WardrobeCategory) : "tops";
}

export interface WardrobeRow {
  id: string;
  user_id: string;
  name: string;
  image_path: string;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

export interface WardrobeItemMetadata {
  category?: WardrobeCategory | string;
  warmth?: number;
  formality?: number;
  description?: string;
}

export interface WardrobeItem {
  id: string;
  name: string;
  category: WardrobeCategory;
  imageUrl: string;
  uploadedAt: Date;
  metadata?: WardrobeItemMetadata | null;
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

/** 只更新 name；category 等由 metadata 管理，请通过 PATCH /api/wardrobe/update-metadata 更新 */
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
  const { error } = await supabase.from("wardrobe_items").delete().eq("id", id);
  if (error) throw error;
}

// --- Outfit generations (History) ---

export interface OutfitGenerationRow {
  id: string;
  user_id: string;
  model_id: string | null;
  location: string;
  location_lat: number | null;
  location_lon: number | null;
  occasion_date: string;
  occasion: string;
  additional_notes: string | null;
  result_image_path: string | null;
  result_message: string | null;
  result_description: string | null;
  selected_item_ids: string[] | null;
  is_liked: boolean;
  created_at: string;
}

export interface SelectedWardrobeItem {
  id: string;
  imageUrl: string;
  name: string;
  category: WardrobeCategory;
  metadata?: WardrobeItemMetadata | null;
}

export interface HistoryItem {
  id: string;
  date: Date;
  occasion: string;
  location: string;
  additionalNotes?: string | null;
  imageUrl?: string | null;
  imagePath?: string | null;
  message?: string;
  description?: string;
  isLiked?: boolean;
  selectedItems?: SelectedWardrobeItem[];
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

  // Collect all unique wardrobe item IDs across all records
  const allItemIds = [
    ...new Set(
      typedRows.flatMap((r) =>
        Array.isArray(r.selected_item_ids) ? r.selected_item_ids : []
      )
    ),
  ];

  // Batch fetch full wardrobe item info for all referenced items
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

  // Generate signed URLs for all unique image paths in one pass
  const uniquePaths = [...new Set([...itemInfoMap.values()].map((r) => r.image_path))];
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

export interface AddOutfitGenerationInput {
  modelId?: string | null;
  location: string;
  locationLat?: number | null;
  locationLon?: number | null;
  occasionDate: Date;
  occasion: string;
  additionalNotes?: string | null;
  resultImagePath?: string | null;
  resultMessage?: string | null;
  resultDescription?: string | null;
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
