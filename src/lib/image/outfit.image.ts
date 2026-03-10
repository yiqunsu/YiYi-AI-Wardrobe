/**
 * Outfit image generator using Gemini multimodal image generation.
 * Two modes:
 *  - With model photo: virtual try-on (model wearing the selected items).
 *  - Without model photo: editorial flat-lay of the selected items.
 */
import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey, llmConfig } from "@/lib/llm/llm.config";

/**
 * Generates an outfit visualization image from clothing item buffers and a style description.
 * If a model buffer is provided, generates a virtual try-on; otherwise generates a flat-lay.
 */
export async function generateOutfitImage(
  modelBuffer: Buffer | null,
  itemBuffers: Buffer[],
  outfitDesc: string
): Promise<Buffer> {
  if (itemBuffers.length === 0) {
    throw new Error(
      "generateOutfitImage: at least one clothing item image is required"
    );
  }

  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  const model = llmConfig.geminiImageModel;

  type Part =
    | { text: string }
    | {
        inlineData: {
          mimeType: "image/jpeg" | "image/png" | "image/webp";
          data: string;
        };
      };

  let prompt: Part[];

  if (modelBuffer) {
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
          data: modelBuffer.toString("base64"),
        },
      },
      { text: "--- END OF BASE MODEL ---" },
      { text: "REFERENCE CLOTHING ITEMS TO APPLY:" },
      ...itemBuffers.map(
        (buf): Part => ({
          inlineData: {
            mimeType: "image/jpeg",
            data: buf.toString("base64"),
          },
        })
      ),
    ];
  } else {
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

  const candidates = (
    response as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
            inlineData?: { data?: string };
          }>;
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
  if (data) return Buffer.from(data, "base64");

  throw new Error(
    `Gemini did not return an outfit image. Model: ${model}. ` +
      "Check quota and that gemini-2.5-flash-image supports multi-image input."
  );
}
