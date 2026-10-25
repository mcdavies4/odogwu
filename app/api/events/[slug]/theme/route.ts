import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { clientId, allow, tooMany } from "@/lib/security";
import { hostEvent } from "@/lib/report";
import { isPremium, isThemeId } from "@/lib/themes";
import { themePrice } from "@/lib/money";
import { makeThemeReference } from "@/lib/ids";
import { initializeOwnTransaction } from "@/lib/paystack";
import { siteUrl } from "@/lib/events";

const NEEDS_SQL = "Run supabase/features.sql in Supabase to turn on wall themes.";

// Host only. { key, theme } switches the wall theme; { key, unlock: true } starts the one-off unlock payment.
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const who = clientId(req.headers);
  if (!(await allow(`theme:${who}`, 60, 30))) return tooMany();
  const { slug } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const ev = await hostEvent(slug, typeof body.key === "string" ? body.key : null, who);
  if (!ev) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  if (ev.theme === undefined) return NextResponse.json({ error: NEEDS_SQL }, { status: 500 });

  const db = supabaseAdmin();
  const price = themePrice();
  const unlocked = Boolean(ev.themes_unlocked) || price === 0;

  if (body.unlock === true) {
    if (unlocked) {
      await db.from("events").update({ themes_unlocked: true }).eq("id", ev.id);
      return NextResponse.json({ ok: true, unlocked: true });
    }
    const reference = makeThemeReference();
    const amountKobo = price * 100;
    const { error } = await db.from("theme_payments").insert({ event_id: ev.id, reference, amount_kobo: amountKobo });
    if (error) return NextResponse.json({ error: NEEDS_SQL }, { status: 500 });
    const site = siteUrl();
    try {
      const tx = await initializeOwnTransaction({
        email: `host+${reference}@${new URL(site).hostname.replace(/^localhost$/, "odogwu.app")}`,
        amountKobo,
        reference,
        callbackUrl: `${site}/themes/paid`,
        metadata: { kind: "wall_themes", event: ev.slug },
      });
      return NextResponse.json({ url: tx.authorization_url });
    } catch (e) {
      console.error("theme unlock", e);
      return NextResponse.json({ error: "Couldn't start the payment. Try again." }, { status: 502 });
    }
  }

  if (!isThemeId(body.theme)) return NextResponse.json({ error: "Unknown theme" }, { status: 400 });
  if (isPremium(body.theme) && !unlocked) return NextResponse.json({ error: "Unlock themes first.", locked: true }, { status: 402 });
  const { error } = await db.from("events").update({ theme: body.theme }).eq("id", ev.id);
  if (error) return NextResponse.json({ error: NEEDS_SQL }, { status: 500 });
  return NextResponse.json({ ok: true, theme: body.theme });
}
