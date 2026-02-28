import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { llmConfig, getGeminiApiKey } from "@/lib/llm/config";
import { OUTFIT_RECOMMENDATION_SYSTEM, OUTFIT_RECOMMENDATION_OUTPUT_INSTRUCTIONS } from "@/lib/llm/prompts";
import { outfitRecommendationSchema, type OutfitRecommendationSchema } from "@/lib/llm/outfitSchema";
import type { WeatherSummary } from "@/lib/weather/getWeatherForLocation";
import { formatWeatherForPrompt } from "@/lib/weather/getWeatherForLocation";

export interface WardrobeItemForRecommendation {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  warmth?: number | null;
  formality?: number | null;
}

export interface RecommendOutfitInput {
  weather: WeatherSummary | null;
  date: Date;
  occasion: string;
  additionalNotes: string;
  wardrobeItems: WardrobeItemForRecommendation[];
}

export interface RecommendOutfitResult extends OutfitRecommendationSchema {
  selectedItemIds: string[];
  message: string;
  imagePrompt: string;
}

function buildContextBlock(input: RecommendOutfitInput): string {
  const parts: string[] = [];

  if (input.weather) {
    parts.push(`Weather: ${formatWeatherForPrompt(input.weather)}`);
  } else {
    parts.push("Weather: unknown (no location or API). Consider moderate temperatures and versatile pieces.");
  }

  const dateStr = input.date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  parts.push(`Date/Time: ${dateStr}.`);

  parts.push(`Occasion/Vibe: ${input.occasion || "Casual / Everyday"}.`);

  if (input.additionalNotes.trim()) {
    parts.push(`User notes: ${input.additionalNotes.trim()}.`);
  }

  if (input.wardrobeItems.length === 0) {
    parts.push(
      "Wardrobe: The user has no items in their wardrobe yet. Return selectedItemIds as empty array, message explaining they should add clothes first, and imagePrompt describing a generic minimal style placeholder (e.g. 'Minimal flat lay with neutral tones, soft lighting, empty canvas')."
    );
  } else {
    parts.push(
      "Wardrobe (id, category, description, warmth 1-5, formality 1-5):",
      ...input.wardrobeItems.map(
        (i) =>
          `- id: "${i.id}", category: ${i.category}, description: ${i.description ?? "—"}, warmth: ${i.warmth ?? "—"}, formality: ${i.formality ?? "—"}`
      )
    );
  }

  return parts.join("\n");
}

/**
 * 根据天气、日期、场合、用户备注和衣橱列表，用 LLM 生成穿搭推荐（选中单品 id、回复文案、图像 prompt）。
 */
export async function recommendOutfit(input: RecommendOutfitInput): Promise<RecommendOutfitResult> {
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  const context = buildContextBlock(input);

  const userContent = `${OUTFIT_RECOMMENDATION_SYSTEM}\n\nContext:\n${context}\n\n${OUTFIT_RECOMMENDATION_OUTPUT_INSTRUCTIONS}`;

  const response = await ai.models.generateContent({
    model: llmConfig.geminiModel,
    contents: userContent,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: (() => {
        const raw = zodToJsonSchema(outfitRecommendationSchema as Parameters<typeof zodToJsonSchema>[0]);
        const { $schema, $id, ...rest } = (raw ?? {}) as Record<string, unknown>;
        return rest;
      })(),
    },
  });

  const text = response.text;
  if (!text || typeof text !== "string") {
    throw new Error("LLM did not return outfit recommendation JSON");
  }

  const parsed = JSON.parse(text) as unknown;
  const result = outfitRecommendationSchema.parse(parsed);
  return {
    selectedItemIds: result.selectedItemIds ?? [],
    message: result.message ?? "",
    imagePrompt: result.imagePrompt ?? "",
  };
}
