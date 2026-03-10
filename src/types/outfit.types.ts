/**
 * TypeScript types and interfaces for the outfit generation and history domain.
 * Used by outfit query functions, context providers, API routes, and UI components.
 */

import type { WardrobeCategory, WardrobeItemMetadata } from "./wardrobe.types";

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
