/**
 * Database query functions for the models (virtual try-on avatars) domain.
 * Handles CRUD operations and Storage uploads for the `models` table
 * and the `model-photos` storage bucket.
 */
"use client";

import { supabase } from "../client";
import type { ModelRow, ModelItem } from "@/types/model.types";
import {
  BUCKET_MODEL_PHOTOS,
  SIGNED_URL_EXPIRY_7D,
} from "@/config/constants";

async function getSignedUrl(
  bucket: string,
  path: string,
  expiry: number = SIGNED_URL_EXPIRY_7D
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiry);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

function getFileExt(file: File): string {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "jpg";
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
      (await getSignedUrl(BUCKET_MODEL_PHOTOS, row.image_path, SIGNED_URL_EXPIRY_7D)) ?? "";
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
  await supabase.storage.from(BUCKET_MODEL_PHOTOS).remove([r.image_path]);
  const { error } = await supabase.from("models").delete().eq("id", id);
  if (error) throw error;
}
