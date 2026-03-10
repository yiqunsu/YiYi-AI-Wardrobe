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
      "Short, warm reply to the user explaining your outfit choice (1-4 sentences)."
    ),
  imagePrompt: z
    .string()
    .describe(
      "Detailed English prompt for one outfit image: flat lay or catalog shot of the selected garments only, no people. Include colors, textures, composition, lighting."
    ),
});

export type OutfitRecommendationSchema = z.infer<
  typeof outfitRecommendationSchema
>;
