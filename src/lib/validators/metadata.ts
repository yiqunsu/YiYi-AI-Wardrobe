/**
 * 系统稳定性核心：metadata 校验器
 * LLM 输出、用户编辑、批量修复 —— 全部复用此校验
 */

export type WardrobeMetadata = Record<string, string | number | boolean | null | WardrobeMetadata>;

/** 允许的 value 类型（可嵌套对象，不允许数组） */
function isAllowedValue(value: unknown): value is string | number | boolean | null | WardrobeMetadata {
  if (value === null) return true;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return true;
  if (typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).every(
      ([k, v]) => isAllowedKey(k) && isAllowedValue(v)
    );
  }
  return false;
}

/** 允许的 key：非空、不以 _ 开头 */
function isAllowedKey(key: string): boolean {
  return typeof key === "string" && key.length > 0 && !key.startsWith("_");
}

/**
 * 校验 metadata 是否合法
 * - null/undefined 视为合法（表示无 metadata）
 * - 必须为普通对象，非数组
 * - 每个 key 满足 isAllowedKey
 * - 每个 value 满足 isAllowedValue（可嵌套）
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
 * 校验并返回可入库的干净对象；不合法则返回 null
 * 与 validateMetadata 共用同一套规则，供写入 DB 时使用
 */
export function sanitizeMetadata(input: unknown): WardrobeMetadata | null {
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
 * 从已校验的 metadata 中取出 description，用于 embedding。
 * 保证返回 string（无则空字符串），便于上层安全调用。
 */
export function getDescriptionFromMetadata(metadata: WardrobeMetadata | null): string {
  if (metadata === null || typeof metadata !== "object") return "";
  const d = metadata.description;
  return typeof d === "string" ? d : "";
}
