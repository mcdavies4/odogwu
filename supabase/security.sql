-- Odogwu security upgrade. Run once in Supabase → SQL Editor.
-- Safe to run more than once.

-- 1. Shared rate-limit counter used by every API route (works across all servers).
create table if not exists public.rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  hits         integer not null default 0
);
alter table public.rate_limits enable row level security;

create or replace function public.rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hits integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into v_hits;
  return v_hits <= p_max;
end;
$$;

-- Daily tidy-up, called by the keep-alive job.
create or replace function public.housekeeping()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limits where window_start < now() - interval '1 day';
  delete from public.payments where status = 'pending' and created_at < now() - interval '7 days';
$$;

revoke execute on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.housekeeping() from public, anon, authenticated;
grant  execute on function public.rate_limit_hit(text, integer, integer) to service_role;
grant  execute on function public.housekeeping() to service_role;

-- 2. The public can only read sprays from the last 3 days (enough for any live wall),
--    so nobody can scrape guest names from past celebrations.
drop policy if exists "sprays are public" on public.sprays;
drop policy if exists "recent sprays are public" on public.sprays;
create policy "recent sprays are public" on public.sprays
  for select using (created_at > now() - interval '3 days');

-- 3. Belt and braces: the public key can never write to any table.
revoke insert, update, delete on all tables in schema public from anon, authenticated;

-- 4. Make sure Row Level Security is on everywhere.
alter table public.events      enable row level security;
alter table public.payments    enable row level security;
alter table public.sprays      enable row level security;
do $$ begin
  alter table public.demo_visits enable row level security;
exception when undefined_table then null;
end $$;
