-- Starter schema. Every table has row-level security (RLS) turned on in the
-- same migration that creates it. RLS = the database itself refuses to show
-- or change rows that don't belong to the signed-in user.

-- ─── customers: an example table each user owns ──────────────────────────────
create table public.customers (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 200),
  email      text check (email is null or char_length(email) <= 320),
  notes      text check (notes is null or char_length(notes) <= 5000),
  created_at timestamptz not null default now()
);

create index customers_owner_id_idx on public.customers (owner_id);

alter table public.customers enable row level security;

create policy "Users can see their own customers"
  on public.customers for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Users can add their own customers"
  on public.customers for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Users can edit their own customers"
  on public.customers for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Users can delete their own customers"
  on public.customers for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- ─── subscriptions: written ONLY by the Stripe webhook ───────────────────────
-- Users can read their own plan but can never write it. There are no
-- insert/update/delete policies, so only the server's secret key can.
create table public.subscriptions (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  status                 text not null default 'incomplete',
  price_id               text,
  updated_at             timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can see their own subscription"
  on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);
