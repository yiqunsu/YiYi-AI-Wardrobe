/**
 * Zod schema for structured outfit recommendation output from the LLM.
 * Used as the responseJsonSchema for Gemini's structured output mode
 * and for runtime validation of the recommendation result.
 */
import { z } from "zod";

export const outfitRecommendationSchema = z.object({
  selectedItemIds: z
    .array(z.string())
    .describe(
      "Wardrobe item ids you selected for this outfit. Only use ids from the provided list."
    ),
  message: z
    .string()
    .describe(
      "A friendly message to the user (2-4 sentences). Briefly mention date/weather, explain why these items were chosen (color harmony, occasion fit, layering), and describe the overall style vibe."
    ),
});

export type OutfitRecommendationSchema = z.infer<
  typeof outfitRecommendationSchema
>;
