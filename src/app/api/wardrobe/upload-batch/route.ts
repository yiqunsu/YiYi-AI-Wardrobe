import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/server";
import { generateProductImage } from "@/lib/image/generateProductImage";

const BUCKET = "wardrobe-items";
const MAX_FILES = 10;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

/** 设为 "true" 时才会调用 Gemini 生成产品图；未设置或非 "true" 时直接上传原图（功能暂停） */
const PRODUCT_IMAGE_GENERATION_ENABLED =
  process.env.ENABLE_PRODUCT_IMAGE_GENERATION === "true";

function getFileExt(file: File): string {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "jpg";
}

/** 是否为配额/限流类错误（可降级为上传原图） */
function isQuotaOrRateLimitError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("quota") ||
    msg.includes("rate") ||
    msg.includes("limit: 0")
  );
}

/**
 * POST /api/wardrobe/upload-batch
 * 接收 multipart 多文件，校验数量与大小，上传 Storage + 插入 wardrobe_items（metadata 为 null），返回 id 列表。
 * 当 ENABLE_PRODUCT_IMAGE_GENERATION=true 时：先调用 Gemini 生成产品图再上传；否则直接上传原图（功能默认暂停）。
 * 若生成失败且为配额/限流错误则降级为上传原图并返回 warnings；其他错误仍返回 502。
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createSupabaseClient(token);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 配额检查 ──────────────────────────────────────────────
    // 1. 衣橱总量上限 50 件
    const { count: totalItems } = await supabase
      .from("wardrobe_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((totalItems ?? 0) >= 50) {
      return NextResponse.json(
        { error: "Wardrobe limit reached. You can store up to 50 items." },
        { status: 429 }
      );
    }

    // 2. 本月上传上限 50 件
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { count: monthItems } = await supabase
      .from("wardrobe_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString());

    if ((monthItems ?? 0) >= 50) {
      return NextResponse.json(
        { error: "Monthly upload limit reached. You can upload up to 50 items per month." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const byNameFiles = formData.getAll("files") as File[];
    const list = (byNameFiles.length > 0 ? byNameFiles : (formData.getAll("file") as File[])).filter(
      (f): f is File => f instanceof File
    );

    if (list.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    if (list.length > MAX_FILES) {
      return NextResponse.json(
        { error: `At most ${MAX_FILES} files per batch` },
        { status: 400 }
      );
    }

    // 批次上传后是否超过总量/月度上限
    if ((totalItems ?? 0) + list.length > 50) {
      return NextResponse.json(
        {
          error: `This batch would exceed the 50-item wardrobe limit (currently ${totalItems ?? 0} items). Please remove some items first.`,
        },
        { status: 429 }
      );
    }
    if ((monthItems ?? 0) + list.length > 50) {
      return NextResponse.json(
        {
          error: `This batch would exceed the 50-upload monthly limit (${monthItems ?? 0} uploaded this month). Try again next month.`,
        },
        { status: 429 }
      );
    }

    for (const file of list) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds ${MAX_FILE_BYTES / 1024 / 1024}MB` },
          { status: 400 }
        );
      }
    }

    const wardrobeItemIds: string[] = [];
    const warnings: string[] = [];

    for (const file of list) {
      const name = file.name.replace(/\.[^/.]+$/, "") || "Item";
      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);

      let body: Buffer;
      let ext: string;
      if (!PRODUCT_IMAGE_GENERATION_ENABLED) {
        body = inputBuffer;
        ext = getFileExt(file);
      } else {
        try {
          body = await generateProductImage(inputBuffer, file.type || "image/jpeg");
          ext = "png";
        } catch (e) {
          if (isQuotaOrRateLimitError(e)) {
            body = inputBuffer;
            ext = getFileExt(file);
            warnings.push(
              `Product image generation skipped (quota/rate limit). Original image saved for "${name}".`
            );
          } else {
            const msg = e instanceof Error ? e.message : String(e);
            return NextResponse.json(
              { error: `Product image generation failed: ${msg}` },
              { status: 502 }
            );
          }
        }
      }

      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const contentType =
        ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, body, { upsert: false, contentType });

      if (uploadError) {
        return NextResponse.json(
          { error: `Upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }

      const { data: row, error: insertError } = await supabase
        .from("wardrobe_items")
        .insert({
          user_id: user.id,
          name,
          image_path: path,
          metadata: null,
        })
        .select("id")
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: `Insert failed: ${insertError.message}` },
          { status: 500 }
        );
      }

      wardrobeItemIds.push((row as { id: string }).id);
    }

    return NextResponse.json(
      warnings.length > 0 ? { wardrobeItemIds, warnings } : { wardrobeItemIds }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
