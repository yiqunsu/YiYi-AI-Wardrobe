-- User feedback table [module: db / migrations]
-- Stores star ratings and optional text from the in-app feedback button.
create table if not exists user_feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  rating      smallint check (rating between 1 and 5),
  message     text,
  page        text,   -- which page the feedback was submitted from
  created_at  timestamptz default now()
);

-- Users can only read/insert their own feedback; admins use service role
alter table user_feedback enable row level security;

create policy "Users can insert own feedback"
  on user_feedback for insert
  with check (auth.uid() = user_id);

create policy "Users can read own feedback"
  on user_feedback for select
  using (auth.uid() = user_id);

create index on user_feedback (user_id, created_at desc);
create index on user_feedback (created_at desc);
