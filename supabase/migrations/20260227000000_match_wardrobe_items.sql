-- RPC：按 warmth/formality 硬过滤 + cosine 向量相似度排序
-- 在 Supabase SQL Editor 中执行，或使用 supabase db push

CREATE OR REPLACE FUNCTION match_wardrobe_items(
  query_embedding vector(768),
  p_user_id       uuid,
  warmth_min      int DEFAULT 1,
  warmth_max      int DEFAULT 5,
  formality_min   int DEFAULT 1,
  formality_max   int DEFAULT 5
)
RETURNS TABLE (
  wardrobe_item_id uuid,
  category         text,
  similarity       float
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    e.wardrobe_item_id,
    COALESCE(w.metadata->>'category', 'tops') AS category,
    1 - (e.embedding <=> query_embedding)     AS similarity
  FROM wardrobe_item_embeddings e
  JOIN wardrobe_items w ON w.id = e.wardrobe_item_id
  WHERE w.user_id = p_user_id
    AND COALESCE((w.metadata->>'warmth')::int,    3) BETWEEN warmth_min    AND warmth_max
    AND COALESCE((w.metadata->>'formality')::int, 3) BETWEEN formality_min AND formality_max
  ORDER BY e.embedding <=> query_embedding
  LIMIT 100;
$$;

COMMENT ON FUNCTION match_wardrobe_items IS
  '三层检索第一/二层：warmth/formality 硬过滤 + cosine 相似度排序，
   返回最多 100 条，TypeScript 层按 category 各取 top 5';
