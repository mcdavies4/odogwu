import "server-only";
import { supabaseAdmin } from "./supabase-server";
import { allow, safeEqual } from "./security";

const PAGE = 1000; // Supabase returns at most 1,000 rows per request

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

/** Reads every row, 1,000 at a time, so big parties are never cut off. */
export async function fetchAll<T>(query: (from: number, to: number) => Page<T>, max = 100_000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < max; from += PAGE) {
    const { data, error } = await query(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

export type HostEvent = {
  id: string;
  slug: string;
  title: string;
  celebrant_name: string;
  event_date: string | null;
  host_key: string;
  bank_name: string;
  account_name: string;
  account_last4: string;
  is_open: boolean;
  created_at: string;
  // Added by supabase/features.sql (missing until it's run)
  theme?: string | null;
  themes_unlocked?: boolean | null;
  now_dancing?: string | null;
  venue_id?: string | null;
};

/** Returns the event only if `key` is its host key. Wrong keys are counted per connection. */
export async function hostEvent(slug: string, key: string | undefined | null, who: string): Promise<HostEvent | null> {
  const { data: ev } = await supabaseAdmin()
    .from("events")
    .select("*") // "*" so it works before and after features.sql
    .eq("slug", slug)
    .maybeSingle<HostEvent>();
  if (!ev || !key || !safeEqual(key, ev.host_key)) {
    await allow(`hostfail:${who}`, 600, 30);
    return null;
  }
  return ev;
}

export type GuestLine = {
  name: string;
  gift: number; // naira paid for spray packs (all of it goes to the celebrant)
  sprayed: number; // naira actually swiped onto the wall
  packs: number;
  email: string | null; // only if the guest typed one (never shown for anonymous guests)
  anonymous: boolean; // sprayed as "Secret Odogwu"; name (if any) is private to the celebrant
  first: string;
  last: string;
};

export type Report = {
  total: number;
  sprayed: number;
  notes: number; // individual notes swiped
  packs: number;
  guests: GuestLine[];
  pending: number; // packs started but not paid (e.g. bank transfer not arrived)
};

type PayRow = {
  id: string; guest_name: string; guest_email: string; amount_kobo: number; status: string;
  paid_at: string | null; created_at: string; anonymous?: boolean; private_name?: string | null;
};
type SprayRow = { payment_id: string; amount_naira: number };

const isPlaceholderEmail = (e: string) => /^guest\+odg_/i.test(e);

export async function buildReport(eventId: string): Promise<Report> {
  const db = supabaseAdmin();
  const [payments, sprays] = await Promise.all([
    fetchAll<PayRow>((f, t) =>
      db.from("payments")
        .select("*") // "*" so this keeps working before or after anonymous.sql is installed
        .eq("event_id", eventId)
        .neq("status", "failed")
        .order("created_at", { ascending: true })
        .range(f, t)
    ),
    fetchAll<SprayRow>((f, t) =>
      db.from("sprays").select("payment_id,amount_naira").eq("event_id", eventId).order("id", { ascending: true }).range(f, t)
    ),
  ]);

  const sprayedByPayment = new Map<string, number>();
  for (const s of sprays) sprayedByPayment.set(s.payment_id, (sprayedByPayment.get(s.payment_id) ?? 0) + Number(s.amount_naira));

  const byGuest = new Map<string, GuestLine>();
  let pending = 0;
  for (const p of payments) {
    if (p.status !== "success") { pending++; continue; }
    const anonymous = Boolean(p.anonymous) || p.guest_name.trim() === "Anonymous";
    const privateName = (p.private_name ?? "").trim();
    // Named anonymous guests each get their own row; nameless ones share one "Anonymous" row.
    const name = anonymous ? privateName || "Anonymous" : p.guest_name.trim();
    const k = `${anonymous ? "anon:" : ""}${name.toLowerCase()}`;
    const when = p.paid_at ?? p.created_at;
    const line = byGuest.get(k) ?? { name, gift: 0, sprayed: 0, packs: 0, email: null, anonymous, first: when, last: when };
    line.gift += Number(p.amount_kobo) / 100;
    line.sprayed += sprayedByPayment.get(p.id) ?? 0;
    line.packs += 1;
    if (!anonymous && !line.email && p.guest_email && !isPlaceholderEmail(p.guest_email)) line.email = p.guest_email;
    if (when < line.first) line.first = when;
    if (when > line.last) line.last = when;
    byGuest.set(k, line);
  }

  const guests = [...byGuest.values()].sort((a, b) => b.gift - a.gift || a.name.localeCompare(b.name));
  return {
    total: guests.reduce((s, g) => s + g.gift, 0),
    sprayed: guests.reduce((s, g) => s + g.sprayed, 0),
    packs: guests.reduce((s, g) => s + g.packs, 0),
    notes: sprays.length,
    guests,
    pending,
  };
}
