-- 阶段 1：pgvector 扩展 + wardrobe_item_embeddings 表 + RLS

-- 1.1 启用 pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 1.2 建表（embedding 维度 768，对应 Gemini text-embedding-004 / gemini-embedding-001）
CREATE TABLE IF NOT EXISTS wardrobe_item_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wardrobe_item_id uuid NOT NULL REFERENCES wardrobe_items(id) ON DELETE CASCADE,
  embedding vector(768) NOT NULL,
  raw_description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(wardrobe_item_id)
);

CREATE INDEX IF NOT EXISTS idx_wardrobe_item_embeddings_wardrobe_item_id
  ON wardrobe_item_embeddings(wardrobe_item_id);

-- HNSW 索引便于相似度搜索
CREATE INDEX IF NOT EXISTS idx_wardrobe_item_embeddings_embedding_hnsw
  ON wardrobe_item_embeddings
  USING hnsw (embedding vector_cosine_ops);

COMMENT ON TABLE wardrobe_item_embeddings IS 'wardrobe 单品 description 的向量，用于语义检索';

-- 1.3 RLS：仅允许用户对自己拥有的 wardrobe_item 读写
ALTER TABLE wardrobe_item_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wardrobe item embeddings"
  ON wardrobe_item_embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wardrobe_items w
      WHERE w.id = wardrobe_item_embeddings.wardrobe_item_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own wardrobe item embeddings"
  ON wardrobe_item_embeddings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wardrobe_items w
      WHERE w.id = wardrobe_item_embeddings.wardrobe_item_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own wardrobe item embeddings"
  ON wardrobe_item_embeddings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM wardrobe_items w
      WHERE w.id = wardrobe_item_embeddings.wardrobe_item_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own wardrobe item embeddings"
  ON wardrobe_item_embeddings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM wardrobe_items w
      WHERE w.id = wardrobe_item_embeddings.wardrobe_item_id
      AND w.user_id = auth.uid()
    )
  );
