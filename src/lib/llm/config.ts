/**
 * LLM 模型配置
 * 支持 Gemini（GEMINI_API_KEY）与 OpenAI（OPENAI_API_KEY）两种
 */

export const llmConfig = {
  /** Gemini 模型名（使用 GEMINI_API_KEY 时） */
  geminiModel: process.env.GEMINI_LLM_MODEL ?? "gemini-2.5-flash-lite",
  /** Gemini 图像生成模型（上传衣服图生成产品图）。Nano Banana: gemini-2.5-flash-image */
  geminiImageModel: process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image",
  /** OpenAI 模型名（使用 OPENAI_API_KEY 时，当前未用于服装分析） */
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

/** 仅当使用 OpenAI 时需要（当前服装分析使用 Gemini） */
export function getOpenAIApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return key;
}
