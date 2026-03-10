/**
 * Application-wide constants.
 * Centralizes storage bucket names, URL expiry durations, and other shared magic values
 * so they are never duplicated across query files and API routes.
 */

// ── Supabase Storage bucket names ───────────────────────────────────────────
export const BUCKET_MODEL_PHOTOS = "model-photos";
export const BUCKET_WARDROBE_ITEMS = "wardrobe-items";
export const BUCKET_GENERATED_OUTFITS = "generated-outfits";

// ── Signed URL expiry durations (in seconds) ────────────────────────────────
export const SIGNED_URL_EXPIRY_1H = 60 * 60;
export const SIGNED_URL_EXPIRY_7D = 60 * 60 * 24 * 7;
