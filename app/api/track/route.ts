import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { allow, clientId } from "@/lib/security";

// Records one opening of a demo page. Called from the browser, so link-preview
// bots that don't run JavaScript are not counted.
const BOT = /bot|crawl|spider|preview|scanner|safelinks|proofpoint|mimecast|barracuda|headless|lighthouse/i;

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") || "";
  if (BOT.test(ua)) return NextResponse.json({ ok: true, skipped: "bot" });

  if (!(await allow(`track:${clientId(req.headers)}`, 3600, 30))) return NextResponse.json({ ok: true, skipped: "limit" });
  const body = await req.json().catch(() => ({}));
  const page = body.page === "wall" ? "wall" : "spray";
  const ref = String(body.ref || "").toLowerCase().replace(/[^a-z0-9-_]/g, "").slice(0, 60) || null;

  const country = req.headers.get("x-vercel-ip-country") || null;
  const cityRaw = req.headers.get("x-vercel-ip-city");
  const city = cityRaw ? decodeURIComponent(cityRaw).slice(0, 80) : null;
  const device = /Mobi|Android|iPhone|iPad/i.test(ua) ? "phone" : "computer";

  try {
    await supabaseAdmin().from("demo_visits").insert({ ref, page, country, city, device });
  } catch {
    // Tracking must never break the demo.
  }
  return NextResponse.json({ ok: true });
}
