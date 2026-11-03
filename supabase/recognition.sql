-- Odogwu: recognising sprayers in the hall.
-- Guest selfies on the wall, table numbers from the table cards, and the big-spray takeover.
-- Safe to run more than once. Run it in Supabase > SQL Editor after the earlier .sql files.

-- Which table a guest is at (from the numbered table card they scanned) and their optional selfie.
alter table public.payments add column if not exists table_no smallint;
alter table public.payments add column if not exists photo_url text;

-- Copied onto every note so the live wall and the MC screen can show them without extra lookups.
alter table public.sprays add column if not exists table_no smallint;
alter table public.sprays add column if not exists photo_url text;

-- Host settings: the "ODOGWU ALERT" takeover level (0 = off) and whether guest photos show on the wall.
alter table public.events add column if not exists big_spray_naira integer not null default 50000;
alter table public.events add column if not exists show_photos boolean not null default true;

-- Every new note picks up its guest's table and photo from the spray pack.
create or replace function public.fill_spray_recognition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_id is not null then
    select p.table_no, p.photo_url into new.table_no, new.photo_url
    from public.payments p where p.id = new.payment_id;
  end if;
  return new;
end;
$$;

drop trigger if exists sprays_fill_recognition on public.sprays;
create trigger sprays_fill_recognition
  before insert on public.sprays
  for each row execute function public.fill_spray_recognition();

-- The wall hears about removed photos (MC taps "Remove photo") through realtime updates.
alter table public.sprays replica identity full;

-- Selfies: public to view (the wall needs them), but only the server can upload or delete.
-- File names are the guest's random payment reference, so they can't be guessed.
-- The daily job deletes them 3 days after the party.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('selfies', 'selfies', true, 300000, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 300000, allowed_mime_types = array['image/jpeg'];
