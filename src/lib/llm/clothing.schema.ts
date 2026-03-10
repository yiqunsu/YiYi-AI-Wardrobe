/**
 * Zod schema for structured clothing analysis output from the LLM.
 * Mirrors the field definitions in CLOTHING_ANALYSIS_PROMPT and is used
 * as the responseJsonSchema for Gemini's structured output mode.
 */
import { z } from "zod";

export const CATEGORY_VALUES = [
  "tops",
  "bottoms",
  "outerwear",
  "shoes",
  "accessories",
] as const;

export type ClothingCategory = (typeof CATEGORY_VALUES)[number];

export const clothingAnalysisSchema = z.object({
  category: z
    .enum(CATEGORY_VALUES)
    .describe(
      "Exactly one of: tops, bottoms, outerwear, shoes, accessories. Map the item to the closest (e.g. shirt→tops, pants→bottoms, coat→outerwear, sneakers→shoes, hat→accessories)."
    ),
  warmth: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe(
      "1=very light, 3=medium, 5=very warm. MUST infer from image (fabric thickness, sleeves, etc)."
    ),
  formality: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe(
      "1=very casual, 3=smart casual, 5=very formal. MUST infer from image (style, occasion)."
    ),
  description: z
    .string()
    .describe(
      "Concise natural language description: material, color, fit, style. No opinions or emojis."
    ),
});

export type ClothingAnalysisSchema = z.infer<typeof clothingAnalysisSchema>;
