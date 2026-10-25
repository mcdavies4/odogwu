-- Self-serve and automation. Run once in Supabase → SQL Editor, after the other files.
-- Safe to run more than once.

-- 1. Automatic emails to hosts: so each one is only sent once.
alter table public.events add column if not exists reminder_sent_at timestamptz;
alter table public.events add column if not exists summary_sent_at  timestamptz;

-- 2. Partners (venues and event planners) who sign themselves up.
alter table public.venues add column if not exists kind   text not null default 'venue';   -- 'venue' or 'planner'
alter table public.venues add column if not exists email  text;
alter table public.venues add column if not exists phone  text;
alter table public.venues add column if not exists source text not null default 'admin';   -- 'admin' or 'self'
create index if not exists venues_email_idx on public.venues (email);

-- 3. Help requests from the Help page. Also emailed to you; kept here in case an email goes missing.
create table if not exists public.help_requests (
  id          bigserial primary key,
  topic       text not null,
  name        text,
  email       text,
  phone       text,
  event_slug  text,
  reference   text,
  message     text not null,
  auto_check  text,                          -- what the automatic check found before it reached you
  status      text not null default 'open',  -- 'open' or 'done'
  created_at  timestamptz not null default now()
);
create index if not exists help_requests_created_idx on public.help_requests (created_at desc);

-- 4. Things that went wrong, so the daily email can list them.
create table if not exists public.incidents (
  id          bigserial primary key,
  kind        text not null,
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists incidents_created_idx on public.incidents (created_at desc);

-- 5. Payout account changes, as an audit trail.
create table if not exists public.payout_changes (
  id               bigserial primary key,
  event_id         uuid not null references public.events(id) on delete cascade,
  old_account      text not null,
  new_account      text not null,
  old_subaccount   text not null,
  new_subaccount   text not null,
  created_at       timestamptz not null default now()
);

-- Lookups the daily job uses.
create index if not exists payments_pending_idx on public.payments (status, created_at) where status = 'pending';
create index if not exists events_date_idx on public.events (event_date);

-- Server-only, like everything else.
alter table public.help_requests  enable row level security;
alter table public.incidents      enable row level security;
alter table public.payout_changes enable row level security;
revoke all on public.help_requests, public.incidents, public.payout_changes from anon, authenticated;
