-- 若之前已用 1536 维（OpenAI）建表，可执行本迁移改为 768 维（Gemini）
-- 新环境请直接使用 20250206000001（已为 768），无需执行本文件
-- 注意：会删除原有 embedding 数据，需对相关 wardrobe_items 重新执行「分析+embedding」以回填

DROP INDEX IF EXISTS idx_wardrobe_item_embeddings_embedding_hnsw;

ALTER TABLE wardrobe_item_embeddings DROP COLUMN IF EXISTS embedding;
ALTER TABLE wardrobe_item_embeddings ADD COLUMN embedding vector(768);

CREATE INDEX IF NOT EXISTS idx_wardrobe_item_embeddings_embedding_hnsw
  ON wardrobe_item_embeddings
  USING hnsw (embedding vector_cosine_ops);

COMMENT ON COLUMN wardrobe_item_embeddings.embedding IS '768 维（Gemini embedding），可为 NULL 待回填';
