import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createSubaccount, listBanks, resolveAccount } from "@/lib/paystack";
import { makeHostKey, makeSlug } from "@/lib/ids";

const clean = (v: unknown, max = 80) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const title = clean(body.title);
  const celebrantName = clean(body.celebrantName);
  const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(body.eventDate || "") ? body.eventDate : null;
  const bankCode = clean(body.bankCode, 20);
  const accountNumber = clean(body.accountNumber, 10);
  const hostPhone = clean(body.hostPhone, 20) || null;

  if (!title || !celebrantName) {
    return NextResponse.json({ error: "Give the celebration a name and say who it's for." }, { status: 400 });
  }
  if (!/^\d{10}$/.test(accountNumber) || !bankCode) {
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

    const { error } = await supabaseAdmin().from("events").insert({
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
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({ slug, hostKey });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Could not create the event." }, { status: 400 });
  }
}
