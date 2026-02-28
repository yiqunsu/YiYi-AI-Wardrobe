import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey } from "@/lib/llm/config";
import { llmConfig } from "@/lib/llm/config";

/**
 * 用 Gemini 生成穿搭效果图。
 * - 有模特图时：生成虚拟试穿图（模特穿上选中的单品）
 * - 无模特图时：生成平铺产品图（所有单品的编辑风格 flat-lay）
 *
 * 输入：
 *   modelBuffer   - 模特图 Buffer（可为 null）
 *   itemBuffers   - 选中单品图 Buffer 列表
 *   outfitDesc    - LLM 生成的穿搭描述（颜色/风格/质感等）
 * 输出：生成图 PNG Buffer
 */
export async function generateOutfitImage(
  modelBuffer: Buffer | null,
  itemBuffers: Buffer[],
  outfitDesc: string
): Promise<Buffer> {
  if (itemBuffers.length === 0) {
    throw new Error("generateOutfitImage: at least one clothing item image is required");
  }

  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  const model = llmConfig.geminiImageModel;

  type Part =
    | { text: string }
    | { inlineData: { mimeType: "image/jpeg" | "image/png" | "image/webp"; data: string } };

  let prompt: Part[];

  if (modelBuffer) {
    // ── 换装编辑模式（text-and-image-to-image）────────────
    // 模特图紧跟 prompt 文字，作为被编辑的主体图片
    prompt = [
      {
        text: `TASK: Virtual Try-On & Clothing Replacement.

INSTRUCTIONS:
1. IDENTIFY SUBJECT: Use the FIRST image below as the 'Base Model'. You must LOCK and maintain the person's identity, face, hairstyle, body shape, and the background exactly.
2. IDENTIFY CLOTHING: Use the subsequent images as 'Reference Garments'.
3. ACTION: Generate a new image where the 'Base Model' is wearing the 'Reference Garments'. 
4. CONSTRAINTS: Ensure realistic draping and proportions. Do NOT alter the person's physical features.

Outfit Style to match: ${outfitDesc}`,
      },
      {
        inlineData: { 
          mimeType: "image/jpeg", 
          data: modelBuffer.toString("base64") },
      },
      { text: "--- END OF BASE MODEL ---" },

      { text: "REFERENCE CLOTHING ITEMS TO APPLY:" },
      ...itemBuffers.map(
        (buf): Part => ({
          inlineData: { 
            mimeType: "image/jpeg", 
            data: buf.toString("base64") },
        })
      ),
    ];
  } else {
    // ── 无模特时：flat-lay 生成模式 ───────────────────────
    prompt = [
      {
        text:
          `Create a clean editorial fashion flat-lay of the following clothing items arranged together as a complete outfit. ` +
          `Warm neutral beige background (#F5F2EC), soft studio lighting, subtle natural shadows, Scandinavian minimalist aesthetic. ` +
          `Outfit: ${outfitDesc}`,
      },
      ...itemBuffers.map(
        (buf): Part => ({
          inlineData: { mimeType: "image/jpeg", data: buf.toString("base64") },
        })
      ),
    ];
  }

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: "3:4",
      },
    },
  });

  // ── 解析响应（与 generateProductImage 相同的模式）────────
  const candidates = (
    response as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string; inlineData?: { data?: string } }> };
      }>;
    }
  ).candidates;

  if (candidates?.[0]?.content?.parts) {
    for (const part of candidates[0].content.parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, "base64");
      }
    }
  }

  const data = (response as { data?: string }).data;
  if (data) return Buffer.from(data, "base64");

  throw new Error(
    `Gemini did not return an outfit image. Model: ${model}. ` +
      "Check quota and that gemini-2.5-flash-image supports multi-image input."
  );
}
