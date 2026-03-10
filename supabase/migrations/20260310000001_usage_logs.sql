-- Usage logs table [module: db / migrations]
-- Tracks every significant API call per user for admin monitoring and
-- per-user usage analysis during the seed user beta period.
create table if not exists usage_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  action      text not null,   -- 'outfit_generate' | 'wardrobe_upload' | 'wardrobe_process'
  status      text not null,   -- 'success' | 'error' | 'quota_exceeded'
  metadata    jsonb,           -- action-specific context: { occasion, wardrobe_count, error_msg, ... }
  created_at  timestamptz default now()
);

-- RLS: logs are admin-only (written via service role, not accessible to users)
alter table usage_logs enable row level security;
-- No user-facing policies — admin access via service role key only

create index on usage_logs (user_id, created_at desc);
create index on usage_logs (action, created_at desc);
create index on usage_logs (status, created_at desc);
