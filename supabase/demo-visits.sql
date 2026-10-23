-- Demo link tracking. Run once in Supabase → SQL Editor (after schema.sql).
-- Logs each opening of /demo and /demo/wall, with the ?ref= tag you put on each
-- venue's link, so you can see which event centres actually looked.

create table if not exists public.demo_visits (
  id          bigserial primary key,
  ref         text,                 -- e.g. "eko-hall" from ?ref=eko-hall
  page        text not null,        -- "wall" or "spray"
  country     text,
  city        text,
  device      text,                 -- "phone" or "computer"
  created_at  timestamptz not null default now()
);
create index if not exists demo_visits_ref_idx on public.demo_visits(ref, created_at desc);

-- Only the server (service role) reads or writes this table.
alter table public.demo_visits enable row level security;
