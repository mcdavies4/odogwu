import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { cleanText, clientId, nameProblem } from "@/lib/security";
import { makeHostKey, makeSlug } from "@/lib/ids";
import { siteUrl } from "@/lib/events";

// Admin only: add a venue partner. Returns the venue's private dashboard link and its client link.
export async function POST(req: Request) {
  if (!(await isAdmin(req.headers.get("x-admin-key"), clientId(req.headers)))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const name = cleanText(body.name, 80);
  const city = cleanText(body.city, 60) || null;
  const contact = cleanText(body.contact, 120) || null;
  const pct = Number(body.sharePercent);
  if (!name || nameProblem(name)) return NextResponse.json({ error: "Give the venue a proper name." }, { status: 400 });
  if (!Number.isFinite(pct) || pct < 0 || pct > 5) return NextResponse.json({ error: "Share must be between 0% and 5%." }, { status: 400 });

  const slug = makeSlug(name);
  const venueKey = makeHostKey();
  const { error } = await supabaseAdmin().from("venues").insert({
    slug, name, city, contact, venue_key: venueKey, share_bps: Math.round(pct * 100),
  });
  if (error) {
    console.error("create venue", error.message);
    return NextResponse.json({ error: "Couldn't save. Have you run supabase/features.sql?" }, { status: 500 });
  }
  const site = siteUrl();
  return NextResponse.json({
    slug,
    dashboard: `${site}/v/${slug}?key=${venueKey}`,
    clientLink: `${site}/host/new?venue=${slug}`,
  });
}
