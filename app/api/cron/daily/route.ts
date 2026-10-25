import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { allow, clientId, safeEqual, tooMany } from "@/lib/security";
import { confirmPayment } from "@/lib/payments";
import { confirmThemePayment } from "@/lib/themePayments";
import { buildReport } from "@/lib/report";
import { sendEmail } from "@/lib/email";
import { digestEmail, reminderEmail, summaryEmail } from "@/lib/emailTemplates";
import { siteUrl } from "@/lib/events";
import { adminEmail } from "@/lib/ops";
import { SUPPORT_EMAIL } from "@/lib/contact";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const lagosDay = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86400_000).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }); // YYYY-MM-DD
const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

type Ev = {
  id: string; slug: string; title: string; celebrant_name: string; event_date: string | null; host_key: string;
  host_email: string | null; bank_name: string; account_name: string; reminder_sent_at: string | null; summary_sent_at: string | null;
};

/**
 * Runs every morning (vercel.json, 06:00 UTC = 07:00 in Lagos). Everything here is safe to run twice.
 *  1. Re-checks unconfirmed payments with Paystack, so no guest is left stuck.
 *  2. Emails hosts the rehearsal checklist the day before, and their results the morning after.
 *  3. Emails you one summary: what happened, and only what needs you.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (!safeEqual(req.headers.get("authorization") ?? "", `Bearer ${secret}`)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  } else if (!(await allow(`cron:${clientId(req.headers)}`, 3600, 3))) {
    return tooMany();
  }

  const db = supabaseAdmin();
  const site = siteUrl();
  const attention: string[] = [];
  const out: Record<string, number> = {};

  // ---- 0. Keep Supabase's free plan awake, and tidy up
  await db.from("events").select("id", { head: true, count: "exact" }).limit(1);
  try { await db.rpc("housekeeping"); } catch {}

  // ---- 1. Reconcile payments Paystack may have finished after the guest left
  const { data: pending } = await db
    .from("payments")
    .select("reference,created_at,amount_kobo,event_id")
    .eq("status", "pending")
    .lt("created_at", ago(10 * 60_000))
    .gt("created_at", ago(3 * 86400_000))
    .limit(300);
  let fixed = 0, failed = 0;
  const stuck: string[] = [];
  for (const p of pending ?? []) {
    try {
      const r = await confirmPayment(p.reference);
      if (r?.status === "success") fixed++;
      else if (r?.status === "failed") failed++;
      else if (Date.now() - new Date(p.created_at).getTime() > 3600_000) stuck.push(`${p.reference} (${naira(Number(p.amount_kobo) / 100)})`);
    } catch {
      stuck.push(`${p.reference} (couldn't reach Paystack)`);
    }
  }
  out.reconciled = fixed;
  if (stuck.length) attention.push(`${stuck.length} payment${stuck.length === 1 ? " is" : "s are"} still unconfirmed by Paystack after an hour: ${stuck.slice(0, 5).join(", ")}${stuck.length > 5 ? "…" : ""}. Check them in the Paystack dashboard.`);

  try {
    const { data: themes } = await db.from("theme_payments").select("reference").eq("status", "pending").lt("created_at", ago(10 * 60_000)).gt("created_at", ago(3 * 86400_000)).limit(100);
    for (const t of themes ?? []) await confirmThemePayment(t.reference).catch(() => null);
  } catch {}

  // ---- 2. Emails to hosts (needs automation.sql + login.sql)
  let reminders = 0, summaries = 0;
  const tomorrow = lagosDay(1), today = lagosDay(0), threeDaysAgo = lagosDay(-3);
  const { data: soon, error: evErr } = await db
    .from("events")
    .select("id,slug,title,celebrant_name,event_date,host_key,host_email,bank_name,account_name,reminder_sent_at,summary_sent_at")
    .gte("event_date", threeDaysAgo)
    .lte("event_date", tomorrow)
    .not("host_email", "is", null)
    .limit(500);
  if (evErr) attention.push("Host reminder and summary emails are off: run supabase/automation.sql in Supabase.");
  for (const ev of (soon ?? []) as Ev[]) {
    const dash = `${site}/h/${ev.slug}?key=${ev.host_key}`;
    const k = encodeURIComponent(ev.host_key);
    try {
      // Day before (also catches celebrations created the day before, as long as it's not the day itself)
      if (ev.event_date === tomorrow && !ev.reminder_sent_at) {
        const mail = reminderEmail({
          title: ev.title, date: ev.event_date, payee: ev.account_name, bank: ev.bank_name, link: dash,
          cards: `${site}/h/${ev.slug}/cards?key=${k}`, mc: `${site}/h/${ev.slug}/mc?key=${k}`, wall: `${site}/e/${ev.slug}/wall`,
        });
        if (await sendEmail(ev.host_email!, mail.subject, mail.html, mail.text, { replyTo: SUPPORT_EMAIL })) {
          await db.from("events").update({ reminder_sent_at: new Date().toISOString() }).eq("id", ev.id);
          reminders++;
        }
      }
      // Morning after (or up to 3 days late if a run was missed)
      if (ev.event_date && ev.event_date < today && !ev.summary_sent_at) {
        const r = await buildReport(ev.id);
        const top = r.guests.find((g) => !g.anonymous);
        const mail = summaryEmail({
          title: ev.title, total: r.total, guests: r.guests.length, top: top ? `${top.name} (${naira(top.gift)})` : null,
          payee: ev.account_name, bank: ev.bank_name, link: dash,
          report: `${site}/h/${ev.slug}/report?key=${k}`, recap: `${site}/h/${ev.slug}/recap?key=${k}`,
          feedback: `${site}/help?topic=feedback&event=${encodeURIComponent(ev.title)}`,
        });
        if (await sendEmail(ev.host_email!, mail.subject, mail.html, mail.text, { replyTo: SUPPORT_EMAIL })) {
          await db.from("events").update({ summary_sent_at: new Date().toISOString() }).eq("id", ev.id);
          summaries++;
        }
      }
    } catch (e) {
      console.error("host email failed", ev.slug, e);
    }
  }
  out.reminders = reminders;
  out.summaries = summaries;

  // ---- 3. Your morning summary
  const since = ago(86400_000);
  const [created, paid, partners, help, incidents] = await Promise.all([
    db.from("events").select("id", { count: "exact", head: true }).gte("created_at", since),
    db.from("payments").select("amount_kobo,fee_kobo").eq("status", "success").gte("paid_at", since).limit(10000),
    db.from("venues").select("name,kind,city").eq("source", "self").gte("created_at", since),
    db.from("help_requests").select("id,topic,email,created_at").eq("status", "open").order("created_at", { ascending: true }).limit(50),
    db.from("incidents").select("kind,detail").gte("created_at", since).limit(500),
  ]);
  const paidRows = paid.data ?? [];
  const gifted = paidRows.reduce((s, p) => s + Number(p.amount_kobo), 0) / 100;
  const fees = paidRows.reduce((s, p) => s + Number(p.fee_kobo), 0) / 100;

  const openHelp = help.data ?? [];
  if (openHelp.length) attention.unshift(`${openHelp.length} help request${openHelp.length === 1 ? "" : "s"} waiting for a reply (oldest from ${openHelp[0].email}).`);

  const counts = new Map<string, number>();
  for (const i of incidents.data ?? []) counts.set(i.kind, (counts.get(i.kind) ?? 0) + 1);
  const LABEL: Record<string, string> = {
    event_create_failed: "celebrations couldn't be created",
    pay_init_failed: "guests couldn't start a payment",
    webhook_failed: "Paystack webhooks failed",
    amount_mismatch: "payments came in at the wrong amount",
    payout_change_failed: "payout changes failed",
  };
  for (const [kind, n] of counts) if (LABEL[kind]) attention.push(`${n} time${n === 1 ? "" : "s"}: ${LABEL[kind]}.`);
  const payoutChanges = counts.get("payout_changed") ?? 0;

  const lines = [
    `New celebrations: ${created.count ?? 0}`,
    `Spray packs paid: ${paidRows.length} (${naira(gifted)})`,
    `Your fees (before Paystack's): ${naira(fees)}`,
    `New partners: ${(partners.data ?? []).length ? (partners.data ?? []).map((p) => `${p.name} (${p.kind}${p.city ? `, ${p.city}` : ""})`).join(", ") : "0"}`,
    `Payments fixed automatically: ${fixed}`,
    `Host emails sent: ${reminders} day-before, ${summaries} morning-after`,
    ...(payoutChanges ? [`Payout accounts changed by hosts: ${payoutChanges}`] : []),
  ];
  const mail = digestEmail({ date: lagosDay(0), lines, attention, adminLink: `${site}/admin/inbox` });
  await sendEmail(adminEmail(), mail.subject, mail.html, mail.text).catch(() => false);

  return NextResponse.json({ ok: true, ...out, failed, stuck: stuck.length, attention: attention.length });
}
