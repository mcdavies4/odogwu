import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { allow, clientId, safeEqual, tooMany } from "@/lib/security";
import { confirmPayment } from "@/lib/payments";
import { confirmThemePayment } from "@/lib/themePayments";
import { buildReport } from "@/lib/report";
import { sendEmail } from "@/lib/email";
import { digestEmail, hostGetReadyEmail, hostWeekEmail, partnerCheckInEmail, partnerFirstClientEmail, reminderEmail, summaryEmail } from "@/lib/emailTemplates";
import { siteUrl } from "@/lib/events";
import { adminEmail } from "@/lib/ops";
import { SUPPORT_EMAIL } from "@/lib/contact";
import { removeSelfies } from "@/lib/selfies";

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

  // ---- 0b. Guest selfies are only for the party: delete them 3 days later
  try {
    const { data: old, error } = await db.from("payments").select("id,photo_url").not("photo_url", "is", null).lt("created_at", ago(3 * 86400_000)).limit(500);
    if (!error && old?.length) out.selfies_deleted = await removeSelfies(old);
  } catch {}

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

  // ---- 2b. Follow-ups for people who signed up but haven't got going (needs followups.sql)
  let getReady = 0, weekBefore = 0, partnerNudges = 0;
  const followUpsOn = !(await db.from("events").select("getready_sent_at").limit(1)).error;
  if (!followUpsOn) attention.push("Follow-up emails to new hosts and partners are off: run supabase/followups.sql in Supabase.");
  if (followUpsOn) {
    const hasPaid = async (eventId: string) =>
      ((await db.from("payments").select("id").eq("event_id", eventId).eq("status", "success").limit(1)).data ?? []).length > 0;
    type Fe = Ev & { created_at: string };

    // Host, 2–30 days after creating: "Let's get it ready" (only if nothing has been sprayed and the party isn't in the next 2 days)
    const { data: fresh } = await db
      .from("events")
      .select("id,slug,title,celebrant_name,event_date,host_key,host_email,bank_name,account_name,created_at")
      .is("getready_sent_at", null).eq("emails_off", false).not("host_email", "is", null)
      .lt("created_at", ago(2 * 86400_000)).gt("created_at", ago(30 * 86400_000))
      .limit(200);
    for (const ev of (fresh ?? []) as Fe[]) {
      try {
        const done = async () => { await db.from("events").update({ getready_sent_at: new Date().toISOString() }).eq("id", ev.id); };
        if (ev.event_date && ev.event_date <= tomorrow) { await done(); continue; } // the day-before email covers it
        if (await hasPaid(ev.id)) { await done(); continue; } // already going
        const k = encodeURIComponent(ev.host_key);
        const mail = hostGetReadyEmail({
          title: ev.title, celebrant: ev.celebrant_name, date: ev.event_date, payee: ev.account_name, bank: ev.bank_name,
          link: `${site}/h/${ev.slug}?key=${k}`, cards: `${site}/h/${ev.slug}/cards?key=${k}`, demo: `${site}/demo`,
        });
        if (await sendEmail(ev.host_email!, mail.subject, mail.html, mail.text, { replyTo: SUPPORT_EMAIL })) { await done(); getReady++; }
      } catch (e) { console.error("get-ready email failed", ev.slug, e); }
    }

    // Host, exactly one week before the party
    const { data: nextWeek } = await db
      .from("events")
      .select("id,slug,title,celebrant_name,event_date,host_key,host_email,bank_name,account_name,created_at")
      .eq("event_date", lagosDay(7)).is("week_sent_at", null).eq("emails_off", false).not("host_email", "is", null)
      .limit(200);
    for (const ev of (nextWeek ?? []) as Fe[]) {
      try {
        const k = encodeURIComponent(ev.host_key);
        const mail = hostWeekEmail({
          title: ev.title, celebrant: ev.celebrant_name, date: ev.event_date, link: `${site}/h/${ev.slug}?key=${k}`,
          cards: `${site}/h/${ev.slug}/cards?key=${k}`, mcLive: `${site}/h/${ev.slug}/mc/live?key=${k}`, guestLink: `${site}/e/${ev.slug}`,
        });
        if (await sendEmail(ev.host_email!, mail.subject, mail.html, mail.text, { replyTo: SUPPORT_EMAIL })) {
          await db.from("events").update({ week_sent_at: new Date().toISOString() }).eq("id", ev.id);
          weekBefore++;
        }
      } catch (e) { console.error("week email failed", ev.slug, e); }
    }

    // Partners with no celebrations yet: day 3 "your first client", day 10 a personal check-in from Emeka
    type Pv = { id: string; slug: string; name: string; kind: string; email: string; venue_key: string; share_bps: number; created_at: string; nudge1_sent_at: string | null; nudge2_sent_at: string | null };
    const { data: quiet } = await db
      .from("venues")
      .select("id,slug,name,kind,email,venue_key,share_bps,created_at,nudge1_sent_at,nudge2_sent_at")
      .is("nudge2_sent_at", null).eq("emails_off", false).not("email", "is", null)
      .lt("created_at", ago(3 * 86400_000)).gt("created_at", ago(45 * 86400_000))
      .limit(200);
    for (const v of (quiet ?? []) as Pv[]) {
      try {
        const { count } = await db.from("events").select("id", { count: "exact", head: true }).eq("venue_id", v.id);
        const now = new Date().toISOString();
        if ((count ?? 0) > 0) { await db.from("venues").update({ nudge1_sent_at: v.nudge1_sent_at ?? now, nudge2_sent_at: now }).eq("id", v.id); continue; }
        const clientLink = `${site}/host/new?venue=${v.slug}`;
        if (!v.nudge1_sent_at) {
          const mail = partnerFirstClientEmail({
            name: v.name, kind: v.kind === "planner" ? "planner" : "venue", clientLink,
            dashboard: `${site}/v/${v.slug}?key=${encodeURIComponent(v.venue_key)}`, demo: `${site}/demo/wall`, sharePct: v.share_bps / 100,
          });
          if (await sendEmail(v.email, mail.subject, mail.html, mail.text, { replyTo: SUPPORT_EMAIL })) {
            await db.from("venues").update({ nudge1_sent_at: now }).eq("id", v.id);
            partnerNudges++;
          }
        } else if (Date.now() - new Date(v.created_at).getTime() > 10 * 86400_000 && Date.now() - new Date(v.nudge1_sent_at).getTime() > 5 * 86400_000) {
          const mail = partnerCheckInEmail({ name: v.name, clientLink });
          if (await sendEmail(v.email, mail.subject, mail.html, mail.text, { replyTo: SUPPORT_EMAIL })) {
            await db.from("venues").update({ nudge2_sent_at: now }).eq("id", v.id);
            partnerNudges++;
          }
        }
      } catch (e) { console.error("partner nudge failed", v.slug, e); }
    }
  }
  out.followups = getReady + weekBefore + partnerNudges;

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
    `Host emails sent: ${reminders} day-before, ${summaries} morning-after, ${getReady} get-ready, ${weekBefore} one-week`,
    `Partner follow-ups sent: ${partnerNudges}`,
    ...(payoutChanges ? [`Payout accounts changed by hosts: ${payoutChanges}`] : []),
  ];
  const mail = digestEmail({ date: lagosDay(0), lines, attention, adminLink: `${site}/admin/inbox` });
  await sendEmail(adminEmail(), mail.subject, mail.html, mail.text).catch(() => false);

  return NextResponse.json({ ok: true, ...out, failed, stuck: stuck.length, attention: attention.length });
}
