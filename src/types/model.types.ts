/**
 * TypeScript types and interfaces for the model (virtual try-on avatar) domain.
 * Used by model query functions, context providers, and UI components.
 */

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
  /** System-provided default model (user_id is null) — cannot be edited or deleted. */
  isSystemDefault?: boolean;
}
