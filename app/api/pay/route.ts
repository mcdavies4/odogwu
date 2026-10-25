import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { initializeTransaction, PaystackError } from "@/lib/paystack";
import { makeReference } from "@/lib/ids";
import { feeKobo, MAX_PACK_NAIRA, MIN_PACK_NAIRA } from "@/lib/money";
import { allow, cleanText, clientId, nameProblem, tooMany } from "@/lib/security";
import { ANONYMOUS } from "@/lib/hype";
import { flagOf, isCountry } from "@/lib/countries";
import { ABROAD_ENABLED } from "@/lib/flags";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  // Generous: a whole hall can share one Wi-Fi or mobile-network address.
  if (!(await allow(`pay:${clientId(req.headers)}`, 300, 60))) return tooMany();
  const body = await req.json().catch(() => ({}));
  const slug = cleanText(body.slug, 60);
  const anonymous = body.anonymous === true;
  const typedName = cleanText(body.guestName, 40);
  // Anonymous guests appear as "Anonymous" everywhere public; their name (if any) stays private.
  // Guests spraying from abroad get their country's flag next to their name on the wall.
  const from = ABROAD_ENABLED && isCountry(body.from) ? body.from : null;
  const guestName = anonymous ? ANONYMOUS : from ? `${typedName} ${flagOf(from)}` : typedName;
  const packNaira = Math.round(Number(body.packNaira));
  let guestEmail = cleanText(body.guestEmail, 120).toLowerCase();

  const nameIssue = anonymous ? (typedName ? nameProblem(typedName) : null) : nameProblem(typedName);
  if (nameIssue) return NextResponse.json({ error: nameIssue }, { status: 400 });
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

  const row: Record<string, unknown> = {
    event_id: ev.id,
    reference,
    guest_name: guestName,
    guest_email: guestEmail,
    amount_kobo: amountKobo,
    fee_kobo: fee,
  };
  let { error } = await db.from("payments").insert(
    anonymous ? { ...row, anonymous: true, private_name: typedName || null } : row
  );
  if (error && anonymous) {
    // anonymous.sql not installed yet: still save them as "Anonymous" (privacy first).
    ({ error } = await db.from("payments").insert(row));
  }
  if (error) return NextResponse.json({ error: "Could not start payment" }, { status: 500 });

  try {
    const tx = await initializeTransaction({
      email: guestEmail,
      amountKobo: amountKobo + fee,
      reference,
      subaccount: ev.subaccount_code,
      platformChargeKobo: fee,
      // Paystack appends ?trxref=…&reference=… itself, so no query string here.
      callbackUrl: `${site}/e/${ev.slug}/spray`,
      metadata: { event: ev.slug, guest_name: guestName, anonymous, from, pack_naira: packNaira },
    });
    return NextResponse.json({ url: tx.authorization_url, reference });
  } catch (e) {
    await db.from("payments").update({ status: "failed" }).eq("reference", reference);
    console.error("pay init failed", e);
    // Paystack's own messages are written for people; network errors are not.
    const msg = e instanceof PaystackError ? e.message : "Couldn't reach the payment provider. Please try again in a moment.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
