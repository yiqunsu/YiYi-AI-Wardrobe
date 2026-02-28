import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/server";

const BUCKET_WARDROBE_ITEMS = "wardrobe-items";
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 7; // 7 days

type WardrobeCategory =
  | "tops"
  | "bottoms"
  | "outerwear"
  | "shoes"
  | "accessories";

const WARDROBE_CATEGORIES: WardrobeCategory[] = [
  "tops",
  "bottoms",
  "outerwear",
  "shoes",
  "accessories",
];

function getCategoryFromMetadata(meta?: { category?: string } | null): WardrobeCategory {
  const c = meta?.category;
  if (typeof c !== "string") return "tops";
  return WARDROBE_CATEGORIES.includes(c as WardrobeCategory) ? (c as WardrobeCategory) : "tops";
}

interface WardrobeRow {
  id: string;
  user_id: string;
  name: string;
  image_path: string;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

/** GET /api/wardrobe — 返回当前用户衣橱列表及所有 signed URL（一次请求，后端并行生成 URL） */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createSupabaseClient(token);

    const { data: rows, error } = await supabase
      .from("wardrobe_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!rows?.length) return NextResponse.json({ items: [] });

    const typedRows = rows as WardrobeRow[];

    const signedUrls = await Promise.all(
      typedRows.map((row) =>
        supabase.storage
          .from(BUCKET_WARDROBE_ITEMS)
          .createSignedUrl(row.image_path, SIGNED_URL_EXPIRY)
      )
    );

    const items = typedRows.map((row, i) => {
      const { data } = signedUrls[i];
      const meta = row.metadata as { category?: string } | undefined;
      return {
        id: row.id,
        name: row.name || "",
        category: getCategoryFromMetadata(meta),
        imageUrl: data?.signedUrl ?? "",
        uploadedAt: row.created_at,
        metadata: row.metadata ?? null,
      };
    });

    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
