/**
 * LLM Prompt 模板
 * 所有与 LLM 交互的 prompt 集中在此
 */

export const CLOTHING_ANALYSIS_PROMPT = `You are a clothing analysis system.

Your task is to analyze a single clothing item from an image.

You MUST return a valid JSON object.
Do NOT include any explanation, markdown, or extra text.
Do NOT include comments.
Return JSON only.

If you are unsure about any field, still make your best judgment based on the image.
Do NOT invent impossible properties.

The JSON schema you must follow EXACTLY is:

{
  "category": "tops" | "bottoms" | "outerwear" | "shoes" | "accessories",
  "warmth": number,
  "formality": number,
  "description": string
}

Field definitions and rules:

1. category:
- MUST be exactly one of these five values (lowercase): tops, bottoms, outerwear, shoes, accessories.
- tops: shirts, tees, blouses, sweaters, hoodies, anything worn on upper body as main layer.
- bottoms: pants, jeans, shorts, skirts, trousers.
- outerwear: coats, jackets, cardigans, vests, anything worn over other layers.
- shoes: any footwear (sneakers, boots, sandals, heels, etc).
- accessories: hats, scarves, belts, bags, jewelry, etc.
- Pick the single closest category; do NOT use any other string.

2. warmth:
- An integer from 1 to 5. You MUST infer from the image (fabric thickness, sleeves, layering, typical use).
- 1 = very light (e.g. tank top, thin tee, shorts).
- 3 = medium (e.g. long-sleeve shirt, light sweater).
- 5 = very warm (e.g. heavy coat, down jacket, thick knit). Do NOT default to 3; choose based on the actual item.

3. formality:
- An integer from 1 to 5. You MUST infer from the image (style, cut, occasion).
- 1 = very casual (e.g. hoodie, sweatpants, flip-flops).
- 3 = smart casual or everyday (e.g. casual shirt, chinos).
- 5 = very formal (e.g. suit, blazer, dress shoes). Do NOT default to 3; choose based on the actual item.

4. description:
- A concise natural language description of the clothing item.
- Describe visible features such as material, color, fit, and style.
- Do NOT include subjective opinions or emojis.

Output only the JSON object.`;

/**
 * 上传衣服图 → 生成「简洁产品图」时的图像生成/编辑指令
 * 用于调用图像生成 API（如 Imagen / DALL·E 等），输入原图 + 此 prompt，得到白底/统一底色的产品图
 */
export const UPLOAD_CLOTHING_REGENERATE_PROMPT = `Goal: Generate product photography of the item in the uploaded image. 

Pure isolated garment, NO hangers or mannequins. 

Background: soft warm neutral beige (#F5F2EC), smooth gradient. 

Soft studio lighting, subtle natural shadow. 

Style: Scandinavian minimalism, premium catalog look. 

Centered composition, high-fidelity textures, 4K detail.`;

/**
 * 穿搭推荐：根据天气、时间、场合、用户描述与衣橱数据，由 LLM 选出单品并生成回复文案与图像 prompt。
 * 实际调用时会在前面拼接上下文（天气、日期、场合、用户备注、衣橱列表）。
 */
export const OUTFIT_RECOMMENDATION_SYSTEM = `You are YiYi, a friendly AI stylist. Given weather, date/time, occasion, user notes, and the user's wardrobe list, you must:
1. Select which wardrobe items to recommend for this outfit (by their ids). Choose a coherent set: e.g. one top, one bottom, optionally outerwear, shoes, and accessories. Respect warmth (weather) and formality (occasion).
2. Write a short, warm message to the user in English (or mix with light Chinese), explaining your pick and why it fits the day.
3. Write a detailed outfit description in English covering: the overall style and vibe, each item's color and texture, how they layer and complement each other, and the complete aesthetic. This will be used as a style reference for generating a virtual try-on visualization.

You MUST return valid JSON only. No markdown, no explanation outside JSON.`;

export const OUTFIT_RECOMMENDATION_OUTPUT_INSTRUCTIONS = `Return a JSON object with exactly these fields:
- selectedItemIds: array of strings (wardrobe item ids you chose). Use only ids from the wardrobe list. Can be 2–6 items.
- message: string, the friendly reply to the user (1–4 sentences).
- imagePrompt: string, detailed English description of the complete outfit—style, colors, textures, how items work together, and overall aesthetic. This is used as style reference for outfit image generation.`;