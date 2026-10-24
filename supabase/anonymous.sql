-- Anonymous spraying. Run once in Supabase → SQL Editor.
-- Anonymous guests are saved as "Anonymous" (what the wall and phones see).
-- If they chose to give their name, it goes in private_name, which only the
-- server reads for the celebrant's private spray report.
alter table public.payments add column if not exists anonymous boolean not null default false;
alter table public.payments add column if not exists private_name text;
