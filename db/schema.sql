-- Enable extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- USERS: Supabase manages auth.users; we store profiles minimally if needed
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  homepage_url text not null,
  feed_url text unique,
  title text,
  description text,
  favicon_url text,
  last_fetch_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  user_id uuid not null,
  source_id uuid not null references sources(id) on delete cascade,
  tags text[] default '{}',
  created_at timestamptz default now(),
  primary key (user_id, source_id)
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  guid text not null,
  title text,
  excerpt text,
  url text not null,
  published_at timestamptz,
  fetched_at timestamptz default now(),
  unique (source_id, guid)
);

create table if not exists read_states (
  user_id uuid not null,
  post_id uuid not null references posts(id) on delete cascade,
  read_at timestamptz default now(),
  primary key (user_id, post_id)
);

create table if not exists bookmarks (
  user_id uuid not null,
  post_id uuid not null references posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

-- Indexes
create index if not exists idx_posts_source_published on posts(source_id, published_at desc);
create index if not exists idx_posts_published on posts(published_at desc);
create index if not exists idx_subscriptions_user on subscriptions(user_id);
create index if not exists idx_read_states_user on read_states(user_id, post_id);

-- RLS
alter table users enable row level security;
alter table subscriptions enable row level security;
alter table read_states enable row level security;
alter table bookmarks enable row level security;
alter table posts enable row level security;
alter table sources enable row level security;

-- Policies
-- sources & posts: readable by all authenticated users; writes by service role only (RLS bypassed).
create policy "read sources" on sources for select using (true);
create policy "read posts" on posts for select using (true);

-- subscriptions: user can manage own
create policy "insert own subscription" on subscriptions for insert
  with check (auth.uid() = user_id);
create policy "select own subscription" on subscriptions for select
  using (auth.uid() = user_id);
create policy "delete own subscription" on subscriptions for delete
  using (auth.uid() = user_id);

-- read_states
create policy "insert own read state" on read_states for insert
  with check (auth.uid() = user_id);
create policy "select own read state" on read_states for select
  using (auth.uid() = user_id);
create policy "delete own read state" on read_states for delete
  using (auth.uid() = user_id);

-- bookmarks
create policy "insert own bookmark" on bookmarks for insert
  with check (auth.uid() = user_id);
create policy "select own bookmark" on bookmarks for select
  using (auth.uid() = user_id);
create policy "delete own bookmark" on bookmarks for delete
  using (auth.uid() = user_id);
