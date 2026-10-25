-- Host login by email code. Run once in Supabase → SQL Editor. Safe to run more than once.

-- The host's email, used to send their private link and to sign them back in.
alter table public.events add column if not exists host_email text;
create index if not exists events_host_email_idx on public.events (host_email);

-- One-time 6-digit codes. Only a hash of the code is stored, never the code itself.
create table if not exists public.login_codes (
  id          bigserial primary key,
  email       text not null,
  code_hash   text not null,
  expires_at  timestamptz not null,
  attempts    integer not null default 0,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);
-- Magic links: only a hash of the link's secret is stored.
alter table public.login_codes add column if not exists token_hash text;
create index if not exists login_codes_token_idx on public.login_codes (token_hash);
create index if not exists login_codes_email_idx on public.login_codes (email, created_at desc);
alter table public.login_codes enable row level security;
revoke all on public.login_codes from anon, authenticated;
