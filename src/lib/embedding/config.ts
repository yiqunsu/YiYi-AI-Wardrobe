/**
 * Embedding 配置
 * 使用 Gemini 时：GEMINI_API_KEY + gemini-embedding-001，维度 768
 */

export const embeddingConfig = {
  /** 官方文档：https://ai.google.dev/gemini-api/docs/embeddings，模型名为 gemini-embedding-001 */
  model: process.env.EMBEDDING_MODEL ?? "gemini-embedding-001",
  /** 输出维度，gemini-embedding-001 支持 768 / 1536 / 3072，与 DB vector(768) 一致 */
  dimensions: Number(process.env.EMBEDDING_DIMENSIONS) || 768,
  timeout: Number(process.env.EMBEDDING_TIMEOUT_MS) || 10_000,
} as const;

export function getEmbeddingApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set (required for embedding)");
  return key;
}
