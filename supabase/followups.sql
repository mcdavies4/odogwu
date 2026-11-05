-- Odogwu: follow-up emails for hosts and partners who haven't got going yet.
-- Safe to run more than once. Run it in Supabase > SQL Editor.

alter table public.events add column if not exists getready_sent_at timestamptz;  -- 2–3 days after creating
alter table public.events add column if not exists week_sent_at     timestamptz;  -- one week before the party
alter table public.events add column if not exists emails_off       boolean not null default false; -- they replied "stop"

alter table public.venues add column if not exists nudge1_sent_at timestamptz;    -- day 3: how to get your first client
alter table public.venues add column if not exists nudge2_sent_at timestamptz;    -- day 10: personal check-in
alter table public.venues add column if not exists emails_off     boolean not null default false;

-- Celebrations and partners that signed up before today count as already welcomed,
-- except recent ones (last 30 days), who get the follow-ups from tomorrow morning.
update public.events set getready_sent_at = now() where getready_sent_at is null and created_at < now() - interval '30 days';
update public.venues set nudge1_sent_at = now(), nudge2_sent_at = now() where nudge1_sent_at is null and created_at < now() - interval '45 days';
