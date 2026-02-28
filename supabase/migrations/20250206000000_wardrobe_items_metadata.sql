-- 阶段 0.1：为 wardrobe_items 增加 metadata 列（若尚未存在）
-- 在 Supabase SQL Editor 中执行，或使用 supabase db push

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wardrobe_items' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE wardrobe_items ADD COLUMN metadata jsonb;
  END IF;
END $$;

COMMENT ON COLUMN wardrobe_items.metadata IS 'LLM 分析的服装元数据：category, color, material, style, description 等';
