/**
 * LLM provider configuration.
 * Centralizes model names, temperature, token limits, and timeout settings
 * for both Gemini and OpenAI. All values can be overridden via environment variables.
 */

export const llmConfig = {
  /** Gemini text model used for clothing analysis and outfit recommendation. */
  geminiModel: process.env.GEMINI_LLM_MODEL ?? "gemini-2.5-flash-lite",
  /** Gemini image generation model used for virtual try-on and product images. */
  geminiImageModel: process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image",
  /** OpenAI text model (currently unused; kept for future fallback support). */
  openaiModel: process.env.LLM_MODEL ?? "gpt-4o",
  temperature: Number(process.env.LLM_TEMPERATURE) || 0.3,
  maxTokens: Number(process.env.LLM_MAX_TOKENS) || 1024,
  timeout: Number(process.env.LLM_TIMEOUT_MS) || 30_000,
  retryCount: Number(process.env.LLM_RETRY_COUNT) || 2,
  retryDelayMs: Number(process.env.LLM_RETRY_DELAY_MS) || 1000,
} as const;

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return key;
}

/** Only needed when using OpenAI (clothing analysis currently uses Gemini). */
export function getOpenAIApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return key;
}
