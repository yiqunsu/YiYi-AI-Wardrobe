/**
 * Clothing image analyzer using Gemini multimodal LLM.
 * Fetches an image by URL, sends it to Gemini with a structured output schema,
 * and returns parsed clothing attributes (category, warmth, formality, description).
 */
import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { llmConfig, getGeminiApiKey } from "./llm.config";
import { CLOTHING_ANALYSIS_PROMPT } from "./llm.prompts";
import {
  clothingAnalysisSchema,
  type ClothingAnalysisSchema,
} from "./clothing.schema";

export type ClothingAnalysisResult = ClothingAnalysisSchema &
  Record<string, unknown>;

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

async function imageUrlToBase64(imageUrl: string): Promise<{
  data: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buf = await res.arrayBuffer();
  const base64 = Buffer.from(buf).toString("base64");
  const raw = res.headers.get("content-type");
  const normalized = (raw ?? "").split(";")[0].trim().toLowerCase();
  const mimeType = ALLOWED_MIME.includes(
    normalized as (typeof ALLOWED_MIME)[number]
  )
    ? (normalized as (typeof ALLOWED_MIME)[number])
    : "image/jpeg";
  return { data: base64, mimeType };
}

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
 * Analyzes a clothing item image via Gemini and returns structured attributes.
 * Automatically retries on transient failures.
 */
export async function analyzeClothing(
  imageUrl: string
): Promise<ClothingAnalysisResult> {
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
        responseJsonSchema: (() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
