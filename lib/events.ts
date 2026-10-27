import { supabaseAdmin } from "./supabase";

export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  celebrant_name: string;
  event_date: string | null;
  is_open: boolean;
  account_name: string;
  bank_name: string;
};

export async function getPublicEvent(slug: string): Promise<PublicEvent | null> {
  const { data } = await supabaseAdmin()
    .from("events")
    .select("id,slug,title,celebrant_name,event_date,is_open,account_name,bank_name")
    .eq("slug", slug)
    .maybeSingle<PublicEvent>();
  return data ?? null;
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
