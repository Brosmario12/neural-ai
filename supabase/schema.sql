create extension if not exists pgcrypto;

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  prompt text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  prompt text not null,
  data_url text not null,
  created_at timestamptz not null default now()
);

alter table public.ai_messages enable row level security;
alter table public.ai_assets enable row level security;

create policy "public read ai messages"
on public.ai_messages for select
to anon, authenticated
using (true);

create policy "public read ai assets"
on public.ai_assets for select
to anon, authenticated
using (true);

