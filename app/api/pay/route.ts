import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { initializeTransaction } from "@/lib/paystack";
import { makeReference } from "@/lib/ids";
import { feeKobo, MAX_PACK_NAIRA, MIN_PACK_NAIRA } from "@/lib/money";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const slug = String(body.slug || "");
  const guestName = String(body.guestName || "").trim().replace(/\s+/g, " ").slice(0, 40);
  const packNaira = Math.round(Number(body.packNaira));
  let guestEmail = String(body.guestEmail || "").trim().toLowerCase();

  if (!guestName) return NextResponse.json({ error: "Tell the celebrant who's spraying!" }, { status: 400 });
  if (!Number.isFinite(packNaira) || packNaira < MIN_PACK_NAIRA || packNaira > MAX_PACK_NAIRA) {
    return NextResponse.json({ error: `Spray packs are ₦${MIN_PACK_NAIRA.toLocaleString()} and up.` }, { status: 400 });
  }
  if (packNaira % 100 !== 0) {
    return NextResponse.json({ error: "Pick an amount in ₦100 steps." }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: ev } = await db
    .from("events")
    .select("id,slug,title,is_open,subaccount_code")
    .eq("slug", slug)
    .maybeSingle();
  if (!ev) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (!ev.is_open) return NextResponse.json({ error: "Spraying has closed for this event." }, { status: 400 });

  const site = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
  const reference = makeReference();
  if (!EMAIL.test(guestEmail)) {
    // Paystack needs an email; guests at a party often won't want to type one.
    guestEmail = `guest+${reference}@${new URL(site).hostname.replace(/^localhost$/, "odogwu.app")}`;
  }

  const amountKobo = packNaira * 100;
  const fee = feeKobo(packNaira);

  const { error } = await db.from("payments").insert({
    event_id: ev.id,
    reference,
    guest_name: guestName,
    guest_email: guestEmail,
    amount_kobo: amountKobo,
    fee_kobo: fee,
  });
  if (error) return NextResponse.json({ error: "Could not start payment" }, { status: 500 });

  try {
    const tx = await initializeTransaction({
      email: guestEmail,
      amountKobo: amountKobo + fee,
      reference,
      subaccount: ev.subaccount_code,
      platformChargeKobo: fee,
      callbackUrl: `${site}/e/${ev.slug}/spray?reference=${reference}`,
      metadata: { event: ev.slug, guest_name: guestName, pack_naira: packNaira },
    });
    return NextResponse.json({ url: tx.authorization_url, reference });
  } catch (e) {
    await db.from("payments").update({ status: "failed" }).eq("reference", reference);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
