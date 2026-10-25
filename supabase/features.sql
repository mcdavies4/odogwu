-- Odogwu feature upgrade: venue partners, wall themes, "Now dancing".
-- Run once in Supabase → SQL Editor. Safe to run more than once.
-- (Spray-from-abroad needs no database change.)

-- 1. Venue partners (event centres). Only the server reads this table.
create table if not exists public.venues (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,           -- public code used in the "create celebration" link
  name        text not null,
  city        text,
  contact     text,                           -- phone or email, for you to pay their share
  venue_key   text not null,                  -- secret for the venue dashboard link
  share_bps   integer not null default 100 check (share_bps between 0 and 500), -- 100 = 1% of pack value
  created_at  timestamptz not null default now()
);
alter table public.venues enable row level security;

-- 2. New celebration settings
alter table public.events add column if not exists venue_id        uuid references public.venues(id) on delete set null;
alter table public.events add column if not exists theme           text not null default 'classic';
alter table public.events add column if not exists themes_unlocked boolean not null default false;
alter table public.events add column if not exists now_dancing     text;
alter table public.events add column if not exists now_dancing_at  timestamptz;
create index if not exists events_venue_idx on public.events(venue_id);

-- 3. Payments for premium wall themes (go to Odogwu's own Paystack balance, not a celebrant)
create table if not exists public.theme_payments (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  reference   text unique not null,
  amount_kobo bigint not null check (amount_kobo > 0),
  status      text not null default 'pending' check (status in ('pending','success','failed')),
  created_at  timestamptz not null default now()
);
alter table public.theme_payments enable row level security;

-- The public key can't touch any of this.
revoke all on public.venues, public.theme_payments from anon, authenticated;
