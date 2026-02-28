import { GoogleGenAI } from "@google/genai";
import { embeddingConfig, getEmbeddingApiKey } from "./config";

/**
 * 对一段文本做 embedding，返回向量
 * 使用 Gemini embedContent API
 */
export async function embed(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Cannot embed empty text");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), embeddingConfig.timeout);

  try {
    const ai = new GoogleGenAI({ apiKey: getEmbeddingApiKey() });

    const response = await ai.models.embedContent({
      model: embeddingConfig.model,
      contents: trimmed,
      config: {
        abortSignal: controller.signal,
        outputDimensionality: embeddingConfig.dimensions,
      },
    });

    const values = response.embeddings?.[0]?.values;
    if (!Array.isArray(values) || values.length !== embeddingConfig.dimensions) {
      throw new Error(
        `Invalid embedding response: expected length ${embeddingConfig.dimensions}, got ${values?.length ?? 0}`
      );
    }
    return values;
  } finally {
    clearTimeout(timeoutId);
  }
}
