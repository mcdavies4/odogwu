import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-server";
import { allow, clientId } from "@/lib/security";

const BOT = /bot|crawl|spider|preview|scanner|safelinks|proofpoint|mimecast|barracuda|headless|lighthouse|monitor|uptime/i;

const RULES: [RegExp, string][] = [
  [/^\/e\/[^/]+\/spray$/, "/e/:slug/spray"],
  [/^\/e\/[^/]+\/wall$/, "/e/:slug/wall"],
  [/^\/e\/[^/]+$/, "/e/:slug"],
  [/^\/h\/[^/]+\/(cards|mc|recap|report)$/, "/h/:slug/$1"],
  [/^\/h\/[^/]+$/, "/h/:slug"],
  [/^\/v\/[^/]+$/, "/v/:slug"],
];
const STATIC = new Set([
  "/", "/contact", "/delete-account", "/demo", "/demo/recap", "/demo/wall", "/help",
  "/host/login", "/host/login/link", "/host/new", "/partners", "/privacy", "/terms", "/themes/paid",
]);

function normalisePath(raw: unknown): string | null {
  let p = String(raw ?? "").slice(0, 200).split(/[?#]/)[0];
  if (!p.startsWith("/")) return null;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  if (p.startsWith("/admin") || p.startsWith("/api") || p.startsWith("/notes-render")) return null;
  for (const [re, out] of RULES) if (re.test(p)) return p.replace(re, out);
  return STATIC.has(p) ? p : "/other";
}

function referrerHost(raw: unknown, ownHost: string | null): string | null {
  const s = String(raw ?? "").trim().slice(0, 300);
  if (!s) return null;
  try {
    const u = new URL(s);
    if (!/^(https?|android-app):$/.test(u.protocol)) return null;
    const host = u.hostname.replace(/^www\./, "").toLowerCase().slice(0, 80);
    const own = (ownHost ?? "").replace(/:\d+$/, "").replace(/^www\./, "").toLowerCase();
    if (!host || host === own || host === "localhost") return null;
    return host;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") || "";
  if (!ua || BOT.test(ua)) return NextResponse.json({ ok: true, skipped: "bot" });

  const who = clientId(req.headers);
  if (!(await allow(`usage:${who}`, 3600, 200))) return NextResponse.json({ ok: true, skipped: "limit" });

  const body = await req.json().catch(() => ({}));
  const path = normalisePath(body.path);
  if (!path) return NextResponse.json({ ok: true, skipped: "path" });

  const referrer = referrerHost(body.referrer, req.headers.get("x-forwarded-host") || req.headers.get("host"));
  const source = String(body.source || "").toLowerCase().replace(/[^a-z0-9-_]/g, "").slice(0, 40) || null;

  const country = req.headers.get("x-vercel-ip-country") || null;
  let city: string | null = null;
  try {
    const raw = req.headers.get("x-vercel-ip-city");
    city = raw ? decodeURIComponent(raw).slice(0, 80) : null;
  } catch {}
  const device = /iPad|Tablet/i.test(ua) ? "tablet" : /Mobi|Android|iPhone/i.test(ua) ? "phone" : "computer";

  const day = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
  const salt = process.env.ANALYTICS_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const visitor = createHash("sha256").update(`${who}|${ua}|${day}|${salt}`).digest("hex").slice(0, 16);

  try {
    await supabaseAdmin().from("page_views").insert({ path, referrer, source, country, city, device, visitor });
  } catch {
    // Tracking must never break the site.
  }
  return NextResponse.json({ ok: true });
}
