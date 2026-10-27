import "server-only";
import { supabaseAdmin } from "./supabase-server";
import { themeOf, type ThemeId } from "./themes";

export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  celebrant_name: string;
  event_date: string | null;
  is_open: boolean;
  account_name: string;
  bank_name: string;
  theme: ThemeId;
  now_dancing: string | null;
  venue_name: string | null;
};

// "*" so the site keeps working whether or not supabase/features.sql has been run.
// Only safe, public fields are returned: never the host key or Paystack subaccount.
export async function getPublicEvent(slug: string): Promise<PublicEvent | null> {
  const db = supabaseAdmin();
  const { data } = await db.from("events").select("*").eq("slug", slug).maybeSingle();
  if (!data) return null;
  let venue_name: string | null = null;
  if (data.venue_id) {
    const { data: v } = await db.from("venues").select("name").eq("id", data.venue_id).maybeSingle();
    venue_name = v?.name ?? null;
  }
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    celebrant_name: data.celebrant_name,
    event_date: data.event_date ?? null,
    is_open: Boolean(data.is_open),
    account_name: data.account_name,
    bank_name: data.bank_name,
    theme: themeOf(data.theme),
    now_dancing: data.now_dancing ?? null,
    venue_name,
  };
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
