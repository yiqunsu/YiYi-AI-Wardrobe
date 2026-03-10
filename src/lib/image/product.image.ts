/**
 * Product image generator using Gemini image editing.
 * Transforms a raw clothing photo into a clean catalog-style product image
 * with a neutral beige background and studio lighting, using the Gemini image model.
 */
import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey, llmConfig } from "@/lib/llm/llm.config";
import { UPLOAD_CLOTHING_REGENERATE_PROMPT } from "@/lib/llm/llm.prompts";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

function toAllowedMime(
  mime: string | undefined
): "image/jpeg" | "image/png" | "image/webp" {
  if (mime != null && typeof mime === "string") {
    const normalized = mime.split(";")[0].trim().toLowerCase();
    if (ALLOWED_MIME.includes(normalized as (typeof ALLOWED_MIME)[number])) {
      return normalized as "image/jpeg" | "image/png" | "image/webp";
    }
  }
  return "image/jpeg";
}

/**
 * Sends the original clothing image to Gemini and returns a processed product image buffer.
 * Uses the Gemini 2.5 Flash Image model (text-and-image-to-image editing).
 */
export async function generateProductImage(
  imageBuffer: Buffer,
  mimeType?: string
): Promise<Buffer> {
  const base64Image = imageBuffer.toString("base64");
  const mime: "image/jpeg" | "image/png" | "image/webp" =
    toAllowedMime(mimeType);

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

  const candidates = (
    response as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string; inlineData?: { data?: string } }>;
        };
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
  if (data) {
    return Buffer.from(data, "base64");
  }

  throw new Error(
    "Gemini did not return an image. Model: " +
      model +
      ". Check quota and response format."
  );
}
