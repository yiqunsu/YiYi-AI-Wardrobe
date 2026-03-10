-- User settings table [module: db / migrations]
-- Allows per-user quota overrides for seed users / power users.
-- Rows are inserted manually by admins via the Supabase dashboard.
-- If no row exists for a user, the application falls back to defaults:
--   outfit_daily_limit = 5, wardrobe_limit = 50.
create table if not exists user_settings (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  outfit_daily_limit  int  default 5   check (outfit_daily_limit > 0),
  wardrobe_limit      int  default 50  check (wardrobe_limit > 0),
  notes               text,            -- admin notes, e.g. "Seed user #3 — influencer"
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Only admins (service role) can read/write; users cannot see their own settings row.
alter table user_settings enable row level security;
-- No user-facing RLS policies — access via service role key only.

-- Example: grant a seed user 20 daily outfit generations
-- INSERT INTO user_settings (user_id, outfit_daily_limit, wardrobe_limit, notes)
-- VALUES ('<user-uuid>', 20, 100, 'Seed user #1 — closed beta');
