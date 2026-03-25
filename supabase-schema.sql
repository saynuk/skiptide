-- ============================================================
-- SKIPTIDE DATABASE SCHEMA
-- Run this entire file in: Supabase > SQL Editor > New Query
-- ============================================================

-- Sources (writers/blogs/newsletters)
create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  homepage_url text not null,
  feed_url text not null unique,
  title text not null,
  description text default '',
  favicon_url text default '',
  last_fetched_at timestamptz,
  created_at timestamptz default now()
);

-- Subscriptions (which user follows which source)
create table if not exists subscriptions (
  user_id uuid references auth.users(id) on delete cascade,
  source_id uuid references sources(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, source_id)
);

-- Posts (fetched from feeds)
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete cascade,
  guid text not null,
  title text not null,
  excerpt text default '',
  url text not null,
  published_at timestamptz not null,
  fetched_at timestamptz default now(),
  unique (source_id, guid)
);

-- Read state (per user, per post)
create table if not exists read_state (
  user_id uuid references auth.users(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  read_at timestamptz default now(),
  primary key (user_id, post_id)
);

-- ============================================================
-- INDEXES (for fast queries)
-- ============================================================

create index if not exists posts_source_id_published_at
  on posts(source_id, published_at desc);

create index if not exists posts_published_at
  on posts(published_at desc);

create index if not exists subscriptions_user_id
  on subscriptions(user_id);

create index if not exists read_state_user_id
  on read_state(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- Users can only see their own subscriptions and read state.
-- Posts and sources are readable by all authenticated users
-- (they're not private data — just feed metadata).
-- ============================================================

alter table subscriptions enable row level security;
alter table read_state enable row level security;
alter table sources enable row level security;
alter table posts enable row level security;

-- Subscriptions: users manage only their own
create policy "Users manage own subscriptions"
  on subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Read state: users manage only their own
create policy "Users manage own read state"
  on read_state for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Sources: any authenticated user can read; insert/update via API only
create policy "Authenticated users can read sources"
  on sources for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert sources"
  on sources for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update sources"
  on sources for update
  using (auth.role() = 'authenticated');

-- Posts: any authenticated user can read
create policy "Authenticated users can read posts"
  on posts for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert posts"
  on posts for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update posts"
  on posts for update
  using (auth.role() = 'authenticated');
