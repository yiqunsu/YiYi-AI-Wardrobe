import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey } from "@/lib/llm/config";
import { llmConfig } from "@/lib/llm/config";
import { UPLOAD_CLOTHING_REGENERATE_PROMPT } from "@/lib/llm/prompts";

/** 支持的图片 MIME，与 Gemini 一致 */
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

function toAllowedMime(mime: string | undefined): "image/jpeg" | "image/png" | "image/webp" {
  if (mime != null && typeof mime === "string") {
    const normalized = mime.split(";")[0].trim().toLowerCase();
    if (ALLOWED_MIME.includes(normalized as (typeof ALLOWED_MIME)[number])) {
      return normalized as "image/jpeg" | "image/png" | "image/webp";
    }
  }
  return "image/jpeg";
}

/**
 * 根据上传的衣服原图 + 产品图 prompt，用 Gemini 生成「简洁产品图」（仅产品、统一底色）
 * 使用 Nano Banana：Gemini 2.5 Flash Image (gemini-2.5-flash-image)。
 * 输入：原图 Buffer + MIME；输出：生成图的 PNG Buffer
 *
 * 调用方式与官方 Image editing (text-and-image-to-image) 一致：
 * contents: [{ text }, { inlineData: { mimeType, data } }]，解析 response.candidates[0].content.parts 中的 inlineData。
 */
export async function generateProductImage(
  imageBuffer: Buffer,
  mimeType?: string
): Promise<Buffer> {
  const base64Image = imageBuffer.toString("base64");
  const mime: "image/jpeg" | "image/png" | "image/webp" = toAllowedMime(mimeType);

  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  const model = llmConfig.geminiImageModel;

  const prompt = [
    { text: UPLOAD_CLOTHING_REGENERATE_PROMPT },
    {
      inlineData: {
        mimeType: mime,
        data: base64Image,
      },
    },
  ];

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: "3:4",
      },
    },
  });

  // 按官方示例解析：response.candidates[0].content.parts → part.inlineData.data
  const candidates = (response as { candidates?: Array<{ content?: { parts?: Array<{ text?: string; inlineData?: { data?: string } }> } }> }).candidates;
  if (candidates?.[0]?.content?.parts) {
    for (const part of candidates[0].content.parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, "base64");
      }
    }
  }

  // 兼容 SDK 的 data getter
  const data = (response as { data?: string }).data;
  if (data) {
    return Buffer.from(data, "base64");
  }

  throw new Error(
    "Gemini did not return an image. Model: " + model + ". Check quota and response format."
  );
}
