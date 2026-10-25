import "server-only";
import { supabaseAdmin } from "./supabase-server";
import { allow, safeEqual } from "./security";
import { fetchAll } from "./report";

export type Venue = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  contact: string | null;
  venue_key: string;
  share_bps: number;
  created_at: string;
};

/** Public lookup for the "create a celebration at…" link. Never returns the venue key. */
export async function venueBySlug(slug: string): Promise<{ id: string; slug: string; name: string } | null> {
  if (!/^[a-z0-9-]{2,60}$/.test(slug)) return null;
  const { data, error } = await supabaseAdmin().from("venues").select("id,slug,name").eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return data;
}

/** The venue, only if `key` is its dashboard key. Wrong keys are counted per connection. */
export async function venueWithKey(slug: string, key: string | null | undefined, who: string): Promise<Venue | null> {
  const { data } = await supabaseAdmin().from("venues").select("*").eq("slug", slug).maybeSingle<Venue>();
  if (!data || !key || !safeEqual(key, data.venue_key)) {
    await allow(`venuefail:${who}`, 600, 30);
    return null;
  }
  return data;
}

export type VenueEvent = {
  id: string;
  slug: string;
  title: string;
  celebrant_name: string;
  event_date: string | null;
  is_open: boolean;
  created_at: string;
  total: number; // naira gifted (pack value), successful payments only
};

/** Celebrations created through a venue's link, with what was sprayed at each. */
export async function venueEvents(venueIds: string[]): Promise<Map<string, VenueEvent[]>> {
  const out = new Map<string, VenueEvent[]>();
  if (!venueIds.length) return out;
  const db = supabaseAdmin();
  const { data: events } = await db
    .from("events")
    .select("id,slug,title,celebrant_name,event_date,is_open,created_at,venue_id")
    .in("venue_id", venueIds)
    .order("created_at", { ascending: false });
  const list = events ?? [];
  const ids = list.map((e) => e.id);
  const totals = new Map<string, number>();
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const pays = await fetchAll<{ event_id: string; amount_kobo: number }>((f, t) =>
      db.from("payments").select("event_id,amount_kobo").in("event_id", chunk).eq("status", "success").range(f, t)
    );
    for (const p of pays) totals.set(p.event_id, (totals.get(p.event_id) ?? 0) + Number(p.amount_kobo) / 100);
  }
  for (const e of list) {
    const row: VenueEvent = { ...e, total: totals.get(e.id) ?? 0 };
    const arr = out.get(e.venue_id) ?? [];
    arr.push(row);
    out.set(e.venue_id, arr);
  }
  return out;
}

export const sharePct = (bps: number) => bps / 100;
export const earnings = (total: number, bps: number) => Math.floor((total * bps) / 10000);
