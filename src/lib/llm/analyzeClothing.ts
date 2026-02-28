import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { llmConfig, getGeminiApiKey } from "./config";
import { CLOTHING_ANALYSIS_PROMPT } from "./prompts";
import { clothingAnalysisSchema, type ClothingAnalysisSchema } from "./clothingSchema";

export type ClothingAnalysisResult = ClothingAnalysisSchema & Record<string, unknown>;

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

/** 从图片 URL 拉取并转为 base64，保证返回 Gemini 支持的 MIME */
async function imageUrlToBase64(imageUrl: string): Promise<{ data: string; mimeType: "image/jpeg" | "image/png" | "image/webp" }> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buf = await res.arrayBuffer();
  const base64 = Buffer.from(buf).toString("base64");
  const raw = res.headers.get("content-type");
  const normalized = (raw ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const mimeType = ALLOWED_MIME.includes(normalized as (typeof ALLOWED_MIME)[number])
    ? (normalized as (typeof ALLOWED_MIME)[number])
    : "image/jpeg";
  return { data: base64, mimeType };
}

/** 带重试的调用包装 */
async function withRetry<T>(
  fn: () => Promise<T>,
  count: number = llmConfig.retryCount,
  delayMs: number = llmConfig.retryDelayMs
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i <= count; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (i < count) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError ?? new Error("Unknown error");
}

/**
 * 衣服图片 LLM 分析（Gemini 多模态 + Structured Output）
 * 输入：图片 URL；输出：解析后的 JSON（category, color, material, style, description）
 */
export async function analyzeClothing(imageUrl: string): Promise<ClothingAnalysisResult> {
  return withRetry(async () => {
    const { data: imageBase64, mimeType } = await imageUrlToBase64(imageUrl);

    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

    const response = await ai.models.generateContent({
      model: llmConfig.geminiModel,
      contents: [
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
        CLOTHING_ANALYSIS_PROMPT,
      ],
      config: {
        responseMimeType: "application/json",
        // 去掉 $schema 等字段，避免部分后端不兼容
        responseJsonSchema: (() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zod-to-json-schema 与当前 zod 版本类型不完全兼容
          const raw = zodToJsonSchema(clothingAnalysisSchema as any);
          const { $schema, $id, ...rest } = raw as Record<string, unknown>;
          return rest;
        })(),
      },
    });

    const text = response.text;
    if (!text || typeof text !== "string") {
      throw new Error("Gemini returned no text");
    }

    const parsed = JSON.parse(text) as unknown;
    const result = clothingAnalysisSchema.parse(parsed);
    return result as ClothingAnalysisResult;
  });
}
