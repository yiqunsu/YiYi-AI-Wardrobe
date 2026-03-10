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

/** Returns true when the error is a Gemini rate-limit / quota error. */
function isRateLimitError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("quota") ||
    msg.includes("rate")
  );
}

/**
 * Retries `fn` up to `maxRetries` times with exponential backoff.
 * Rate-limit errors (429 / RESOURCE_EXHAUSTED) use a longer base delay
 * (2 s → 4 s → 8 s → 16 s) with ±500 ms jitter.
 * Other transient errors use a shorter base delay (500 ms → 1 s → 2 s → 4 s).
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  let lastError: Error = new Error("Unknown error");
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt === maxRetries) break;
      const base = isRateLimitError(e) ? 2000 : 500;
      const delay = base * 2 ** attempt + Math.random() * 500;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
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
