/**
 * POST /api/wardrobe/upload-batch [module: api / wardrobe]
 * Accepts up to 10 clothing image files, enforces wardrobe (50 items) and monthly (50 uploads) quotas.
 * Optionally generates a clean product image via Gemini before storing in Supabase Storage.
 *
 * Files are processed sequentially and progress is streamed back as NDJSON so the client
 * can display a real-time "Uploading 3 / 10…" progress bar.
 *
 * Stream event shapes:
 *   {"type":"progress","name":"shirt.jpg","completed":1,"total":5,"id":"uuid"}
 *   {"type":"progress","name":"pants.jpg","completed":2,"total":5,"id":"uuid","warning":"…"}
 *   {"type":"done","wardrobeItemIds":["…"],"warnings":["…"]}
 *   {"type":"error","error":"…"}  ← fatal; stream ends immediately
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/db/server";
import { generateProductImage } from "@/lib/image/product.image";
import sharp from "sharp";
import { logUsage } from "@/lib/analytics/usage.logger";

/** Allow up to 60 s for large batch uploads on Vercel / Next.js edge runtime. */
export const maxDuration = 60;

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
 * 接收 multipart 多文件，校验数量与大小，顺序上传 Storage + 插入 wardrobe_items，
 * 以 NDJSON 流式返回每张图的上传进度。
 * 当 ENABLE_PRODUCT_IMAGE_GENERATION=true 时：先调用 Gemini 生成产品图再上传；否则直接上传原图（功能默认暂停）。
 * 若生成失败且为配额/限流错误则降级为上传原图并在 progress 事件里附 warning。
 */
export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseClient(token);
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 配额检查 ──────────────────────────────────────────────
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
    return NextResponse.json({ error: `At most ${MAX_FILES} files per batch` }, { status: 400 });
  }
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

  // All validation passed — stream progress events back while uploading sequentially.
  const enc = new TextEncoder();
  const total = list.length;

  const stream = new ReadableStream({
    async start(controller) {
      const wardrobeItemIds: string[] = [];
      const warnings: string[] = [];

      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        const name = file.name.replace(/\.[^/.]+$/, "") || "Item";
        const arrayBuffer = await file.arrayBuffer();
        const rawBuffer = Buffer.from(arrayBuffer);

        // Compress to max 1200px wide, JPEG quality 80 before any further
        // processing — reduces Gemini API token cost and storage size.
        const inputBuffer = await sharp(rawBuffer)
          .resize({ width: 1200, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer()
          .catch(() => rawBuffer); // fall back to original on sharp error

        let body: Buffer;
        let ext: string;
        let warning: string | undefined;

        if (!PRODUCT_IMAGE_GENERATION_ENABLED) {
          body = inputBuffer;
          ext = "jpg";
        } else {
          try {
            body = await generateProductImage(inputBuffer, file.type || "image/jpeg");
            ext = "png";
          } catch (e) {
            if (isQuotaOrRateLimitError(e)) {
              body = inputBuffer;
              ext = getFileExt(file);
              warning = `Product image generation skipped (quota/rate limit). Original image saved for "${name}".`;
            } else {
              const msg = e instanceof Error ? e.message : String(e);
              controller.enqueue(
                enc.encode(
                  JSON.stringify({ type: "error", error: `Product image generation failed: ${msg}` }) + "\n"
                )
              );
              controller.close();
              return;
            }
          }
        }

        const path = `${user.id}/${crypto.randomUUID()}.${ext!}`;
        const contentType = ext! === "png" ? "image/png" : "image/jpeg";

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, body!, { upsert: false, contentType });

        if (uploadError) {
          controller.enqueue(
            enc.encode(
              JSON.stringify({ type: "error", error: `Upload failed: ${uploadError.message}` }) + "\n"
            )
          );
          controller.close();
          return;
        }

        const { data: row, error: insertError } = await supabase
          .from("wardrobe_items")
          .insert({ user_id: user.id, name, image_path: path, metadata: null })
          .select("id")
          .single();

        if (insertError) {
          controller.enqueue(
            enc.encode(
              JSON.stringify({ type: "error", error: `Insert failed: ${insertError.message}` }) + "\n"
            )
          );
          controller.close();
          return;
        }

        const id = (row as { id: string }).id;
        wardrobeItemIds.push(id);
        if (warning) warnings.push(warning);

        const event = warning
          ? { type: "progress", name, completed: i + 1, total, id, warning }
          : { type: "progress", name, completed: i + 1, total, id };

        controller.enqueue(enc.encode(JSON.stringify(event) + "\n"));
      }

      logUsage({
        userId: user.id,
        action: "wardrobe_upload",
        status: "success",
        metadata: { count: wardrobeItemIds.length, warnings: warnings.length },
      });

      controller.enqueue(
        enc.encode(JSON.stringify({ type: "done", wardrobeItemIds, warnings }) + "\n")
      );
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
