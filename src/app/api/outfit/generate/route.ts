/**
 * POST /api/outfit/generate [module: api / outfit]
 * Core outfit generation pipeline (daily limit: 5 per user):
 * 1. Fetch weather for location/date
 * 2. Vector-search wardrobe for candidate items
 * 3. LLM selects items and writes a style description
 * 4. Gemini generates a virtual try-on or flat-lay image
 * 5. Saves the result to outfit_generations history
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/db/server";
import { getWeatherForLocation } from "@/lib/weather/weather.service";
import { searchWardrobeByEmbedding } from "@/lib/wardrobe/wardrobe.embedding";
import { recommendOutfit } from "@/lib/outfit/outfit.service";
import { generateOutfitImage } from "@/lib/image/outfit.image";
import { stitchImagesVertically } from "@/lib/image/image.utils";
import { logUsage } from "@/lib/analytics/usage.logger";

const BUCKET_WARDROBE = "wardrobe-items";
const BUCKET_MODELS = "model-photos";
const BUCKET_OUTFITS = "generated-outfits";
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

interface GenerateBody {
  lat?: number;
  lon?: number;
  date?: string;
  location?: string;
  occasion?: string;
  modelId?: string;
  additionalNotes?: string;
}

/** 从 Supabase Storage 下载图片为 Buffer，URL 无效时返回 null */
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * POST /api/outfit/generate
 * Body: { lat, lon, date, location, occasion, modelId, additionalNotes }
 * Response: { imageUrl, message, selectedItemIds }
 */
export async function POST(req: NextRequest) {
  // ── 1. 认证 ──────────────────────────────────────────────
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseClient(token);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── 2. 配额检查（支持 user_settings 覆盖）──────────────
  const { data: userSettings } = await supabase
    .from("user_settings")
    .select("outfit_daily_limit")
    .eq("user_id", user.id)
    .maybeSingle();

  const outfitDailyLimit =
    (userSettings as { outfit_daily_limit?: number } | null)?.outfit_daily_limit ?? 5;

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  const { count: todayCount } = await supabase
    .from("outfit_generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", todayStart.toISOString())
    .lte("created_at", todayEnd.toISOString());

  if ((todayCount ?? 0) >= outfitDailyLimit) {
    logUsage({ userId: user.id, action: "outfit_generate", status: "quota_exceeded" });
    return NextResponse.json(
      { error: `Daily limit reached. You can generate up to ${outfitDailyLimit} outfits per day.` },
      { status: 429 }
    );
  }

  // ── 3. 解析请求体 ────────────────────────────────────────
  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { lat, lon, occasion = "", modelId, additionalNotes = "", location = "" } = body;
  const date = body.date ? new Date(body.date) : new Date();

  // ── 4. 获取天气 ──────────────────────────────────────────
  const weather =
    typeof lat === "number" && typeof lon === "number"
      ? await getWeatherForLocation(lat, lon, date).catch(() => null)
      : null;

  // ── 4. 向量检索候选单品 ──────────────────────────────────
  const candidates = await searchWardrobeByEmbedding(
    supabase,
    user.id,
    weather,
    occasion,
    additionalNotes
  );

  // ── 5. LLM 穿搭推荐 ──────────────────────────────────────
  let selectedItemIds: string[] = [];
  let message = "";

  try {
    const result = await recommendOutfit({
      weather,
      date,
      occasion,
      additionalNotes,
      wardrobeItems: candidates,
    });
    selectedItemIds = result.selectedItemIds;
    message = result.message;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "LLM error";
    logUsage({
      userId: user.id,
      action: "outfit_generate",
      status: "error",
      metadata: { error_msg: msg, occasion },
    });
    return NextResponse.json({ error: `Outfit recommendation failed: ${msg}` }, { status: 502 });
  }

  // ── 6. 生成穿搭图片 ──────────────────────────────────────
  // Cap to 4 items for image generation — more items degrade Gemini output quality
  const imageItemIds = selectedItemIds.slice(0, 4);

  let imageUrl: string | null = null;
  let resultImagePath: string | null = null;

  if (imageItemIds.length > 0) {
    try {
      // 6a. 获取选中单品的图片
      const { data: itemRows } = await supabase
        .from("wardrobe_items")
        .select("id, image_path")
        .in("id", imageItemIds);

      const itemBuffers: Buffer[] = [];
      for (const row of (itemRows ?? []) as { id: string; image_path: string }[]) {
        const { data: urlData } = await supabase.storage
          .from(BUCKET_WARDROBE)
          .createSignedUrl(row.image_path, 300);
        if (urlData?.signedUrl) {
          const buf = await fetchImageBuffer(urlData.signedUrl);
          if (buf) itemBuffers.push(buf);
        }
      }

      // 6b. 获取模特图片
      let modelBuffer: Buffer | null = null;
      if (modelId) {
        const { data: modelRow } = await supabase
          .from("models")
          .select("image_path")
          .eq("id", modelId)
          .single();

        if ((modelRow as { image_path?: string } | null)?.image_path) {
          const { data: urlData } = await supabase.storage
            .from(BUCKET_MODELS)
            .createSignedUrl((modelRow as { image_path: string }).image_path, 300);
          if (urlData?.signedUrl) {
            modelBuffer = await fetchImageBuffer(urlData.signedUrl);
          }
        }
      }

      // 6c. 将多张衣服图拼接成一张长图，再与模特图一起传入 Gemini
      if (itemBuffers.length > 0) {
        const stitchedBuffer = await stitchImagesVertically(itemBuffers);
        const outfitBuffer = await generateOutfitImage(modelBuffer, [stitchedBuffer], message);

        // 6d. 上传至 generated-outfits bucket
        const imagePath = `${user.id}/${crypto.randomUUID()}.png`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_OUTFITS)
          .upload(imagePath, outfitBuffer, { contentType: "image/png", upsert: false });

        if (!uploadError) {
          resultImagePath = imagePath;
          const { data: signedData } = await supabase.storage
            .from(BUCKET_OUTFITS)
            .createSignedUrl(imagePath, SIGNED_URL_TTL);
          imageUrl = signedData?.signedUrl ?? null;
        }
      }
    } catch (e) {
      // 图片生成失败不阻断整个流程，只记录日志
      console.error("[outfit/generate] Image generation error:", e);
    }
  }

  // ── 7. 保存历史记录 ──────────────────────────────────────
  let generationId: string | null = null;
  try {
    const { data: insertedRow } = await supabase
      .from("outfit_generations")
      .insert({
        user_id: user.id,
        model_id: modelId || null,
        location: location,
        location_lat: lat ?? null,
        location_lon: lon ?? null,
        occasion_date: date.toISOString().slice(0, 10),
        occasion: occasion,
        additional_notes: additionalNotes || null,
        result_image_path: resultImagePath,
        result_message: message,
        result_description: message,
        selected_item_ids: selectedItemIds,
        is_liked: false,
      })
      .select("id")
      .single();
    generationId = (insertedRow as { id: string } | null)?.id ?? null;
  } catch (e) {
    // 历史保存失败不影响返回结果
    console.error("[outfit/generate] History save error:", e);
  }

  // ── 8. 记录成功日志 + 返回结果 ───────────────────────────
  logUsage({
    userId: user.id,
    action: "outfit_generate",
    status: "success",
    metadata: { occasion, selected_items: selectedItemIds.length, has_image: !!imageUrl },
  });

  return NextResponse.json({ imageUrl, message, description: message, selectedItemIds, generationId });
}
