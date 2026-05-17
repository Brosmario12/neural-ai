create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tx_type') then
    create type public.tx_type as enum ('deposit', 'withdrawal', 'payment');
  end if;

  if not exists (select 1 from pg_type where typname = 'tx_status') then
    create type public.tx_status as enum (
      'pending',
      'processing',
      'approved',
      'declined',
      'error',
      'cancelled'
    );
  end if;
end $$;

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  balance_cents bigint not null default 0,
  nequi_phone text,
  owner_name text,
  legal_id_type text,
  legal_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  type public.tx_type not null,
  status public.tx_status not null default 'pending',
  amount_cents bigint not null check (amount_cents > 0),
  reference text unique,
  wompi_id text,
  payout_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transactions_wallet_id on public.transactions(wallet_id);
create index if not exists idx_transactions_status on public.transactions(status);
create index if not exists idx_transactions_reference on public.transactions(reference);

alter table public.wallets enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "Users ven su wallet" on public.wallets;
drop policy if exists "Users ven sus tx" on public.transactions;
drop policy if exists "Users can view own wallet" on public.wallets;
drop policy if exists "Users can view own transactions" on public.transactions;

create policy "Users can view own wallet"
on public.wallets
for select
using (auth.uid() = user_id);

create policy "Users can view own transactions"
on public.transactions
for select
using (
  wallet_id in (
    select id from public.wallets where user_id = auth.uid()
  )
);

create or replace function public.set_wallet_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_wallet_updated_at on public.wallets;
create trigger set_wallet_updated_at
before update on public.wallets
for each row execute procedure public.set_wallet_updated_at();

create or replace function public.set_transaction_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_transaction_updated_at on public.transactions;
create trigger set_transaction_updated_at
before update on public.transactions
for each row execute procedure public.set_transaction_updated_at();

create or replace function public.handle_tx_approved()
returns trigger as $$
begin
  if new.status = 'approved' and old.status <> 'approved' then
    if new.type = 'deposit' then
      update public.wallets
      set balance_cents = balance_cents + new.amount_cents
      where id = new.wallet_id;
    elsif new.type = 'withdrawal' then
      update public.wallets
      set balance_cents = balance_cents - new.amount_cents
      where id = new.wallet_id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_tx_approved on public.transactions;
create trigger on_tx_approved
after update on public.transactions
for each row execute procedure public.handle_tx_approved();

create or replace function public.ensure_wallet_for_user()
returns trigger as $$
begin
  insert into public.wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_wallet on auth.users;
create trigger on_auth_user_created_wallet
after insert on auth.users
for each row execute procedure public.ensure_wallet_for_user();
