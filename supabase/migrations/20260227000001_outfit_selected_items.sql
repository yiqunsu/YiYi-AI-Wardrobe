-- Add selected_item_ids to outfit_generations to track which wardrobe items were chosen
ALTER TABLE outfit_generations
  ADD COLUMN IF NOT EXISTS selected_item_ids uuid[] DEFAULT '{}';
