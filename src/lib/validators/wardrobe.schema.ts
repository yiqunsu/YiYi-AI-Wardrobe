/**
 * Wardrobe metadata validator and sanitizer.
 * Provides strict validation rules for the JSONB metadata field on wardrobe_items.
 * Used by the LLM analysis pipeline, manual edit endpoint, and batch repair operations.
 */

export interface WardrobeMetadata {
  [key: string]: string | number | boolean | null | WardrobeMetadata;
}

function isAllowedValue(
  value: unknown
): value is string | number | boolean | null | WardrobeMetadata {
  if (value === null) return true;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return true;
  if (typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).every(
      ([k, v]) => isAllowedKey(k) && isAllowedValue(v)
    );
  }
  return false;
}

function isAllowedKey(key: string): boolean {
  return typeof key === "string" && key.length > 0 && !key.startsWith("_");
}

/**
 * Returns true if the input is a valid metadata object (or null/undefined).
 * Rejects arrays, disallows keys starting with "_", and disallows non-primitive values.
 */
export function validateMetadata(input: unknown): boolean {
  if (input === null || input === undefined) return true;
  if (typeof input !== "object" || Array.isArray(input)) return false;

  const obj = input as Record<string, unknown>;
  return Object.entries(obj).every(
    ([key, value]) => isAllowedKey(key) && isAllowedValue(value)
  );
}

/**
 * Validates and returns a sanitized copy safe to write to the database.
 * Returns null if the input is invalid or empty.
 */
export function sanitizeMetadata(
  input: unknown
): WardrobeMetadata | null {
  if (!validateMetadata(input)) return null;
  if (input === null || input === undefined) return null;

  const obj = input as Record<string, unknown>;
  const out: WardrobeMetadata = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!isAllowedKey(key) || value === undefined) continue;
    if (!isAllowedValue(value)) continue;
    out[key] = value as string | number | boolean | null | WardrobeMetadata;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Extracts the `description` string from a validated metadata object.
 * Returns an empty string if absent, for safe use in embedding pipelines.
 */
export function getDescriptionFromMetadata(
  metadata: WardrobeMetadata | null
): string {
  if (metadata === null || typeof metadata !== "object") return "";
  const d = metadata.description;
  return typeof d === "string" ? d : "";
}
