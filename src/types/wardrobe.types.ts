/**
 * TypeScript types and interfaces for wardrobe domain.
 * Shared across database query files, API routes, React components, and context providers.
 */

export type WardrobeCategory =
  | "tops"
  | "bottoms"
  | "outerwear"
  | "shoes"
  | "accessories";

export const WARDROBE_CATEGORIES: WardrobeCategory[] = [
  "tops",
  "bottoms",
  "outerwear",
  "shoes",
  "accessories",
];

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

/** Wardrobe item shape used by the outfit recommendation pipeline. */
export interface WardrobeItemForRecommendation {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  warmth?: number | null;
  formality?: number | null;
}

/** Resolves a raw metadata object to a valid WardrobeCategory, defaulting to "tops". */
export function getCategoryFromMetadata(
  meta?: WardrobeItemMetadata | null
): WardrobeCategory {
  const c = meta?.category;
  if (typeof c !== "string") return "tops";
  return WARDROBE_CATEGORIES.includes(c as WardrobeCategory)
    ? (c as WardrobeCategory)
    : "tops";
}
