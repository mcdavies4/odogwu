import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createSubaccount, listBanks, resolveAccount } from "@/lib/paystack";
import { makeHostKey, makeSlug } from "@/lib/ids";
import { allow, cleanText, clientId, nameProblem, tooMany } from "@/lib/security";
import { PaystackError } from "@/lib/paystack";
import { venueBySlug } from "@/lib/venues";
import { EMAIL_RE, sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/emailTemplates";
import { siteUrl } from "@/lib/events";
import { logIncident } from "@/lib/ops";

const clean = (v: unknown, max = 80) => cleanText(v, max);

export async function POST(req: Request) {
  const who = clientId(req.headers);
  if (!(await allow(`event:h:${who}`, 3600, 10)) || !(await allow(`event:d:${who}`, 86400, 30))) {
    return tooMany("Too many celebrations created from this connection. Try again later.");
  }
  const body = await req.json().catch(() => ({}));
  const title = clean(body.title);
  const celebrantName = clean(body.celebrantName);
  const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(body.eventDate || "") ? body.eventDate : null;
  const bankCode = clean(body.bankCode, 20);
  const accountNumber = clean(body.accountNumber, 10);
  const hostPhone = clean(body.hostPhone, 20) || null;
  const hostEmail = clean(body.hostEmail, 120).toLowerCase();
  if (!EMAIL_RE.test(hostEmail)) {
    return NextResponse.json({ error: "Enter your email so we can send you your private host link." }, { status: 400 });
  }

  if (!title || !celebrantName) {
    return NextResponse.json({ error: "Give the celebration a name and say who it's for." }, { status: 400 });
  }
  const titleIssue = nameProblem(title) || nameProblem(celebrantName);
  if (titleIssue) return NextResponse.json({ error: titleIssue.replace("spray wall", "celebration page") }, { status: 400 });
  if (!/^\d{10}$/.test(accountNumber) || !/^[0-9A-Za-z-]{2,20}$/.test(bankCode)) {
    return NextResponse.json({ error: "Enter a valid 10-digit account number and bank." }, { status: 400 });
  }

  try {
    // Re-resolve server-side: the name shown to guests always comes from the bank.
    const resolved = await resolveAccount(accountNumber, bankCode);
    const bank = (await listBanks()).find((b) => b.code === bankCode);

    const sub = await createSubaccount({
      businessName: `${celebrantName} (Odogwu)`.slice(0, 100),
      bankCode,
      accountNumber,
      phone: hostPhone ?? undefined,
    });

    const slug = makeSlug(celebrantName);
    const hostKey = makeHostKey();

    // Made through a venue partner's link? Tag it so the venue earns its share.
    const venue = typeof body.venue === "string" ? await venueBySlug(body.venue) : null;
    const row: Record<string, unknown> = {
      slug,
      title,
      celebrant_name: celebrantName,
      event_date: eventDate,
      host_key: hostKey,
      host_phone: hostPhone,
      bank_name: bank?.name ?? "Bank",
      account_name: resolved.account_name,
      account_last4: accountNumber.slice(-4),
      subaccount_code: sub.subaccount_code,
    };
    const db = supabaseAdmin();
    const full = { ...row, host_email: hostEmail, ...(venue ? { venue_id: venue.id } : {}) };
    let { error } = await db.from("events").insert(full);
    // Older database (features.sql / login.sql not run yet): save what it can.
    if (error && venue) ({ error } = await db.from("events").insert({ ...row, venue_id: venue.id }));
    if (error) ({ error } = await db.from("events").insert(row));
    if (error) throw new Error(`db: ${error.message}`);

    // Email the host their private link, so it's never lost.
    const link = `${siteUrl()}/h/${slug}?key=${hostKey}`;
    const mail = welcomeEmail({
      title, celebrant: celebrantName, date: eventDate, payee: resolved.account_name, bank: bank?.name ?? "your bank", link,
    });
    await sendEmail(hostEmail, mail.subject, mail.html, mail.text).catch(() => false);

    return NextResponse.json({ slug, hostKey });
  } catch (e) {
    // Paystack messages are written for users; anything else stays in the server log only.
    console.error("create event failed", e);
    // A Paystack message is usually the host's own typo (wrong account). Anything else is ours to fix.
    if (!(e instanceof PaystackError) || (e as PaystackError).status >= 500) {
      await logIncident("event_create_failed", { title, error: String(e) }, {
        title: "Someone couldn't create a celebration",
        lines: [`Celebration: ${title} for ${celebrantName}`, `Host: ${hostEmail}`, `Error: ${String(e)}`, "They saw: \"Could not create the celebration. Please try again.\""],
      });
    }
    const msg = e instanceof PaystackError ? e.message : "Could not create the celebration. Please try again.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
