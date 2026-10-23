-- Odogwu v1 schema. Run once in Supabase → SQL Editor.
-- Money never sits in Odogwu: guests pay through Paystack, and Paystack settles the
-- celebrant's share straight to their bank (subaccount split). These tables only
-- record what happened and drive the spraying experience.

create extension if not exists pgcrypto;

-- One celebration (wedding, birthday, naming ceremony...)
create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  celebrant_name   text not null,
  event_date       date,
  host_key         text not null,              -- secret for the host dashboard link
  host_phone       text,
  bank_name        text not null,
  account_name     text not null,              -- resolved by Paystack, not typed by user
  account_last4    text not null,
  subaccount_code  text not null,              -- Paystack ACCT_xxx
  is_open          boolean not null default true,
  created_at       timestamptz not null default now()
);

-- A guest buying a spray pack
create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  reference     text unique not null,
  guest_name    text not null,
  guest_email   text not null,
  amount_kobo   bigint not null check (amount_kobo > 0),
  fee_kobo      bigint not null default 0,
  status        text not null default 'pending' check (status in ('pending','success','failed')),
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists payments_event_idx on public.payments(event_id);

-- Every note sprayed. Public at the party anyway, so the wall can read it live.
create table if not exists public.sprays (
  id           bigserial primary key,
  event_id     uuid not null references public.events(id) on delete cascade,
  payment_id   uuid not null references public.payments(id) on delete cascade,
  guest_name   text not null,
  amount_naira integer not null check (amount_naira > 0),
  created_at   timestamptz not null default now()
);
create index if not exists sprays_event_idx on public.sprays(event_id, created_at);
create index if not exists sprays_payment_idx on public.sprays(payment_id);

-- Atomic spray: locks the payment row so a guest can never spray more than they paid.
create or replace function public.spray_note(p_reference text, p_amount integer)
returns table (remaining_naira bigint, spray_id bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_used    bigint;
  v_id      bigint;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  select * into v_payment from public.payments
   where reference = p_reference
   for update;

  if not found then raise exception 'NOT_FOUND'; end if;
  if v_payment.status <> 'success' then raise exception 'NOT_PAID'; end if;

  select coalesce(sum(amount_naira), 0) into v_used
    from public.sprays where payment_id = v_payment.id;

  if v_used + p_amount > v_payment.amount_kobo / 100 then
    raise exception 'INSUFFICIENT';
  end if;

  insert into public.sprays (event_id, payment_id, guest_name, amount_naira)
  values (v_payment.event_id, v_payment.id, v_payment.guest_name, p_amount)
  returning id into v_id;

  return query select (v_payment.amount_kobo / 100) - v_used - p_amount, v_id;
end;
$$;

-- Row level security: the browser only ever reads sprays (for the live wall).
-- Everything else goes through server routes using the service role key.
alter table public.events   enable row level security;
alter table public.payments enable row level security;
alter table public.sprays   enable row level security;

drop policy if exists "sprays are public" on public.sprays;
create policy "sprays are public" on public.sprays for select using (true);

revoke execute on function public.spray_note(text, integer) from public, anon, authenticated;
grant  execute on function public.spray_note(text, integer) to service_role;

-- Live updates for the spray wall
do $$
begin
  alter publication supabase_realtime add table public.sprays;
exception when duplicate_object then null;
end $$;
