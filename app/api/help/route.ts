import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { allow, cleanText, clientId, tooMany } from "@/lib/security";
import { EMAIL_RE, sendEmail } from "@/lib/email";
import { checkPack, findReference } from "@/lib/helpCheck";
import { adminEmail } from "@/lib/ops";
import { adminAlertEmail, helpReceivedEmail } from "@/lib/emailTemplates";
import { SUPPORT_EMAIL } from "@/lib/contact";
import { siteUrl } from "@/lib/events";

const TOPICS: Record<string, string> = {
  paid: "I paid but can't spray",
  payout: "Payout to the celebrant",
  host: "Setting up or running a celebration",
  wall: "Spray wall or projector",
  partner: "Partnering (venue or planner)",
  feedback: "Feedback after a celebration",
  other: "Something else",
};

/** Private host/venue links must never land in an inbox or a database row. */
const scrub = (s: string) => s.replace(/([?&]key=)[^\s&#]+/gi, "$1[removed]");

export async function POST(req: Request) {
  const who = clientId(req.headers);
  if (!(await allow(`help:${who}`, 3600, 6))) return tooMany("You've sent a few messages already. We'll reply to those first.");
  const body = await req.json().catch(() => ({}));
  const topicKey = Object.hasOwn(TOPICS, body.topic) ? String(body.topic) : "other";
  const name = cleanText(body.name, 60);
  const email = cleanText(body.email, 120).toLowerCase();
  const phone = cleanText(body.phone, 20) || null;
  const event = scrub(cleanText(body.event, 160)) || null;
  const message = scrub(String(body.message ?? "").replace(/\r/g, "").trim().slice(0, 2000));
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Add your email so we can reply." }, { status: 400 });
  if (message.length < 10) return NextResponse.json({ error: "Tell us a little more about what happened." }, { status: 400 });

  // Before it reaches a person: check any payment reference with Paystack (this also fixes our record if Paystack has the money).
  const reference = findReference(`${body.reference ?? ""} ${message} ${event ?? ""}`);
  let autoCheck: string | null = null;
  if (reference) {
    try {
      autoCheck = (await checkPack(reference)).summary;
    } catch {
      autoCheck = `${reference}: couldn't reach Paystack to check`;
    }
  }
  const slug = event?.match(/\/[ehv]\/([a-z0-9-]{2,60})/)?.[1] ?? null;

  let ticket: number | null = null;
  try {
    const { data } = await supabaseAdmin()
      .from("help_requests")
      .insert({ topic: topicKey, name: name || null, email, phone, event_slug: slug ?? event, reference, message, auto_check: autoCheck })
      .select("id")
      .single();
    ticket = data?.id ?? null;
  } catch {
    // automation.sql not run yet: the email below still reaches you
  }

  const topic = TOPICS[topicKey];
  const lines = [
    `From: ${name || "(no name)"} <${email}>${phone ? ` · ${phone}` : ""}`,
    `About: ${topic}`,
    ...(event ? [`Celebration: ${event}`] : []),
    ...(autoCheck ? [`Automatic check: ${autoCheck}`] : []),
    "",
    message,
    "",
    "Reply to this email to answer them directly.",
  ];
  // No admin key in emails: the inbox page asks for it.
  const inbox = { label: "Open the inbox", url: `${siteUrl()}/admin/inbox` };
  const toYou = adminAlertEmail(`Help request${ticket ? ` #${ticket}` : ""}: ${topic}`, lines, inbox);
  const delivered = await sendEmail(adminEmail(), toYou.subject, toYou.html, toYou.text, { replyTo: email });

  const toThem = helpReceivedEmail({ name, ticket, topic, message });
  await sendEmail(email, toThem.subject, toThem.html, toThem.text, { replyTo: SUPPORT_EMAIL });

  if (!delivered && ticket === null) {
    return NextResponse.json({ error: `We couldn't send that. Please email ${SUPPORT_EMAIL} instead.` }, { status: 503 });
  }
  return NextResponse.json({ ok: true, ticket });
}
