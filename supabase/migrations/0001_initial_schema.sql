-- MyLife OS initial schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in ('study','fitness','skills','certifications','projects','journal','expenses','goals','habits','tasks','calendar')),
  title text not null,
  details text,
  entry_date date not null default current_date,
  data jsonb not null default '{}'::jsonb,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entries_user_module_date_idx on public.entries(user_id, module, entry_date desc);
create index if not exists entries_user_updated_idx on public.entries(user_id, updated_at desc);
create index if not exists entries_data_gin_idx on public.entries using gin(data);

create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.entries(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists share_links_user_idx on public.share_links(user_id, created_at desc);

-- Updated-at maintenance.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists entries_set_updated_at on public.entries;
create trigger entries_set_updated_at before update on public.entries for each row execute function public.set_updated_at();

-- Create profile automatically after signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))) on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.entries enable row level security;
alter table public.share_links enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "entries select own" on public.entries;
create policy "entries select own" on public.entries for select to authenticated using (auth.uid() = user_id);
drop policy if exists "entries insert own" on public.entries;
create policy "entries insert own" on public.entries for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "entries update own" on public.entries;
create policy "entries update own" on public.entries for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "entries delete own" on public.entries;
create policy "entries delete own" on public.entries for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "share links select own" on public.share_links;
create policy "share links select own" on public.share_links for select to authenticated using (auth.uid() = user_id);
drop policy if exists "share links insert own" on public.share_links;
create policy "share links insert own" on public.share_links for insert to authenticated with check (auth.uid() = user_id and exists (select 1 from public.entries e where e.id = entry_id and e.user_id = auth.uid()));
drop policy if exists "share links update own" on public.share_links;
create policy "share links update own" on public.share_links for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "share links delete own" on public.share_links;
create policy "share links delete own" on public.share_links for delete to authenticated using (auth.uid() = user_id);

-- No anonymous table policies are created. Public sharing is handled by a server route
-- that hashes the token, checks expiry/revocation, and returns only the selected entry.

-- Enable Supabase Realtime for entries
alter publication supabase_realtime add table public.entries;
alter table public.entries replica identity full;
