import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { allow, cleanText, clientId, nameProblem, safeEqual, tooMany } from "@/lib/security";
import { createSubaccount, listBanks, PaystackError, resolveAccount } from "@/lib/paystack";
import { sendEmail } from "@/lib/email";
import { payoutChangedEmail } from "@/lib/emailTemplates";
import { siteUrl } from "@/lib/events";
import { SUPPORT_EMAIL } from "@/lib/contact";
import { logIncident } from "@/lib/ops";

type Ev = { id: string; slug: string; title: string; celebrant_name: string; host_key: string; host_email?: string | null; host_phone: string | null; account_name: string; account_last4: string; subaccount_code: string };

/**
 * Host only. Lets hosts fix their own mistakes without messaging anyone:
 *  { action: "details", title, celebrantName, eventDate }
 *  { action: "payout", bankCode, accountNumber }   → new Paystack subaccount; future packs pay there
 */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const who = clientId(req.headers);
  if (!(await allow(`settings:${who}`, 600, 20))) return tooMany();
  const body = await req.json().catch(() => ({}));
  const db = supabaseAdmin();
  const { data: ev } = await db.from("events").select("*").eq("slug", slug).maybeSingle<Ev>();
  if (!ev || !safeEqual(String(body.key ?? ""), ev.host_key)) {
    await allow(`hostfail:${who}`, 600, 30);
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  if (body.action === "details") {
    const title = cleanText(body.title, 80);
    const celebrantName = cleanText(body.celebrantName, 80);
    const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(body.eventDate || "") ? body.eventDate : null;
    if (!title || !celebrantName) return NextResponse.json({ error: "Give the celebration a name and say who it's for." }, { status: 400 });
    const issue = nameProblem(title) || nameProblem(celebrantName);
    if (issue) return NextResponse.json({ error: issue.replace("spray wall", "celebration page") }, { status: 400 });
    const changes: Record<string, unknown> = { title, celebrant_name: celebrantName, event_date: eventDate };
    // A new date means the automatic reminder and summary should go out again for the new day.
    let { error } = await db.from("events").update({ ...changes, reminder_sent_at: null, summary_sent_at: null }).eq("id", ev.id);
    if (error) ({ error } = await db.from("events").update(changes).eq("id", ev.id));
    if (error) return NextResponse.json({ error: "Couldn't save. Try again." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "payout") {
    if (!(await allow(`payout:${ev.id}`, 86400, 5))) return tooMany("The payout account has been changed a few times today. Message us from the Help page if you need it changed again.");
    const bankCode = cleanText(body.bankCode, 20);
    const accountNumber = cleanText(body.accountNumber, 10);
    if (!/^\d{10}$/.test(accountNumber) || !/^[0-9A-Za-z-]{2,20}$/.test(bankCode)) {
      return NextResponse.json({ error: "Enter a valid 10-digit account number and bank." }, { status: 400 });
    }
    try {
      const resolved = await resolveAccount(accountNumber, bankCode);
      const bank = (await listBanks()).find((b) => b.code === bankCode);
      const sub = await createSubaccount({
        businessName: `${ev.celebrant_name} (Odogwu)`.slice(0, 100),
        bankCode,
        accountNumber,
        phone: ev.host_phone ?? undefined,
      });
      const { error } = await db.from("events").update({
        bank_name: bank?.name ?? "Bank",
        account_name: resolved.account_name,
        account_last4: accountNumber.slice(-4),
        subaccount_code: sub.subaccount_code,
      }).eq("id", ev.id);
      if (error) throw new Error(`db: ${error.message}`);
      try {
        await db.from("payout_changes").insert({
          event_id: ev.id,
          old_account: `${ev.account_name} ····${ev.account_last4}`,
          new_account: `${resolved.account_name} ····${accountNumber.slice(-4)}`,
          old_subaccount: ev.subaccount_code,
          new_subaccount: sub.subaccount_code,
        });
      } catch {}
      if (ev.host_email) {
        const mail = payoutChangedEmail({
          title: ev.title, payee: resolved.account_name, bank: bank?.name ?? "Bank", last4: accountNumber.slice(-4),
          link: `${siteUrl()}/h/${ev.slug}?key=${ev.host_key}`,
        });
        await sendEmail(ev.host_email, mail.subject, mail.html, mail.text, { replyTo: SUPPORT_EMAIL }).catch(() => false);
      }
      await logIncident("payout_changed", { slug: ev.slug, from: ev.account_last4, to: accountNumber.slice(-4) });
      return NextResponse.json({ ok: true, accountName: resolved.account_name });
    } catch (e) {
      console.error("payout change failed", e);
      const msg = e instanceof PaystackError ? e.message : "Couldn't change the payout account. Try again.";
      if (!(e instanceof PaystackError)) await logIncident("payout_change_failed", { slug: ev.slug, error: String(e) }, { title: "A host couldn't change their payout account", lines: [`Celebration: ${ev.title} (${ev.slug})`, String(e)] });
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
