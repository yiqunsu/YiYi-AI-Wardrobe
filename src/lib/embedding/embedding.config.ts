/**
 * Embedding model configuration.
 * Uses Gemini embedding-001 by default (768-dimensional vectors),
 * matching the pgvector column definition in the database schema.
 */

export const embeddingConfig = {
  /** Gemini embedding model. See: https://ai.google.dev/gemini-api/docs/embeddings */
  model: process.env.EMBEDDING_MODEL ?? "gemini-embedding-001",
  /** Output dimensionality — must match the DB vector(768) column. */
  dimensions: Number(process.env.EMBEDDING_DIMENSIONS) || 768,
  timeout: Number(process.env.EMBEDDING_TIMEOUT_MS) || 10_000,
} as const;

export function getEmbeddingApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set (required for embedding)");
  return key;
}
