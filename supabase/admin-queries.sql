-- ============================================================
-- YiYi AI — Admin Monitoring Queries
-- Run these in the Supabase SQL Editor (requires service role)
-- ============================================================

-- ── 1. 人均每日生成次数（近 7 天）──────────────────────────
-- Shows how actively users are generating outfits day by day.
select
  date(created_at at time zone 'utc') as day,
  count(*)                              as total_generations,
  count(distinct user_id)               as active_users,
  round(count(*)::numeric / nullif(count(distinct user_id), 0), 1) as avg_per_user
from outfit_generations
where created_at > now() - interval '7 days'
group by 1
order by 1 desc;

-- ── 2. 最活跃用户 Top 15（所有时间）────────────────────────
-- Identify power users and seed users to prioritize support.
select
  u.email,
  og.user_id,
  count(*)                       as total_generates,
  count(*) filter (where og.created_at > now() - interval '7 days') as last_7d,
  min(og.created_at)             as first_generation,
  max(og.created_at)             as last_generation
from outfit_generations og
join auth.users u on u.id = og.user_id
group by og.user_id, u.email
order by total_generates desc
limit 15;

-- ── 3. 今日配额命中率 ────────────────────────────────────
-- Percentage of users who hit the daily limit today.
with today_usage as (
  select
    user_id,
    count(*) as today_count
  from outfit_generations
  where date(created_at at time zone 'utc') = current_date
  group by user_id
),
settings as (
  select user_id, outfit_daily_limit from user_settings
)
select
  t.user_id,
  u.email,
  t.today_count,
  coalesce(s.outfit_daily_limit, 5) as limit_value,
  t.today_count >= coalesce(s.outfit_daily_limit, 5) as hit_limit
from today_usage t
join auth.users u on u.id = t.user_id
left join settings s on s.user_id = t.user_id
order by today_count desc;

-- ── 4. API 错误率统计（近 24 小时）──────────────────────
-- Monitor for spikes in LLM errors or quota exceeded events.
select
  action,
  status,
  count(*) as event_count,
  round(count(*) * 100.0 / sum(count(*)) over (partition by action), 1) as pct
from usage_logs
where created_at > now() - interval '24 hours'
group by action, status
order by action, status;

-- ── 5. 新用户注册趋势（近 30 天）────────────────────────
select
  date(created_at at time zone 'utc') as day,
  count(*) as new_users
from auth.users
where created_at > now() - interval '30 days'
group by 1
order by 1 desc;

-- ── 6. 用户反馈汇总 ──────────────────────────────────────
select
  rating,
  count(*) as responses,
  round(count(*) * 100.0 / sum(count(*)) over (), 1) as pct
from user_feedback
group by rating
order by rating desc;

-- Recent written feedback (last 20)
select
  u.email,
  uf.rating,
  uf.message,
  uf.page,
  uf.created_at
from user_feedback uf
left join auth.users u on u.id = uf.user_id
where uf.message is not null
order by uf.created_at desc
limit 20;

-- ── 7. 种子用户配额设置查看 ──────────────────────────────
select
  u.email,
  us.outfit_daily_limit,
  us.wardrobe_limit,
  us.notes,
  us.created_at
from user_settings us
join auth.users u on u.id = us.user_id
order by us.created_at;

-- ── 8. 衣橱使用情况分布 ──────────────────────────────────
select
  case
    when item_count = 0    then '0 items'
    when item_count < 10   then '1–9 items'
    when item_count < 25   then '10–24 items'
    when item_count < 50   then '25–49 items'
    else '50 items (full)'
  end as bucket,
  count(*) as user_count
from (
  select user_id, count(*) as item_count
  from wardrobe_items
  group by user_id
) sub
group by bucket
order by min(sub.item_count);
