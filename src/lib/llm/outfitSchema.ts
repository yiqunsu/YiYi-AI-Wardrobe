import { z } from "zod";

/**
 * 穿搭推荐 LLM 结构化输出
 * selectedItemIds: 选中的衣橱单品 id；message: 给用户的文案；imagePrompt: 用于生成穿搭图的英文 prompt
 */
export const outfitRecommendationSchema = z.object({
  selectedItemIds: z
    .array(z.string())
    .describe("Wardrobe item ids you selected for this outfit. Only use ids from the provided list."),
  message: z
    .string()
    .describe("Short, warm reply to the user explaining your outfit choice (1-4 sentences)."),
  imagePrompt: z
    .string()
    .describe(
      "Detailed English prompt for one outfit image: flat lay or catalog shot of the selected garments only, no people. Include colors, textures, composition, lighting."
    ),
});

export type OutfitRecommendationSchema = z.infer<typeof outfitRecommendationSchema>;
