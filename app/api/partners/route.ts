import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { allow, cleanText, clientId, nameProblem, tooMany } from "@/lib/security";
import { makeHostKey, makeSlug } from "@/lib/ids";
import { EMAIL_RE, sendEmail } from "@/lib/email";
import { partnerWelcomeEmail } from "@/lib/emailTemplates";
import { siteUrl } from "@/lib/events";
import { alertAdmin } from "@/lib/ops";
import { SUPPORT_EMAIL } from "@/lib/contact";
import { partnerShare } from "@/lib/money";

/** Venues and event planners sign up themselves and get their dashboard straight away. */
export async function POST(req: Request) {
  const who = clientId(req.headers);
  if (!(await allow(`partner:${who}`, 3600, 4))) return tooMany();
  const body = await req.json().catch(() => ({}));
  const kind = body.kind === "planner" ? "planner" : "venue";
  const name = cleanText(body.name, 80);
  const city = cleanText(body.city, 60) || null;
  const person = cleanText(body.person, 60);
  const email = cleanText(body.email, 120).toLowerCase();
  const phone = cleanText(body.phone, 20) || null;
  if (!name || nameProblem(name)) return NextResponse.json({ error: `Enter your ${kind === "planner" ? "business" : "venue"}'s real name.` }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter an email we can send your dashboard link to." }, { status: 400 });
  if (!phone || phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Add a phone number so celebrants can reach you if they need to." }, { status: 400 });

  const db = supabaseAdmin();
  const site = siteUrl();

  // Already a partner with this email: resend their links by email only (never show them on screen).
  const { data: existing, error: lookupErr } = await db.from("venues").select("slug,name,kind,venue_key,share_bps").eq("email", email).limit(1);
  if (lookupErr) {
    console.error("partner lookup", lookupErr.message);
    return NextResponse.json({ error: `Partner sign-up isn't switched on yet. Email ${SUPPORT_EMAIL} and we'll set you up.` }, { status: 503 });
  }
  if (existing?.length) {
    const v = existing[0];
    const mail = partnerWelcomeEmail({ name: v.name, kind: v.kind === "planner" ? "planner" : "venue", dashboard: `${site}/v/${v.slug}?key=${v.venue_key}`, clientLink: `${site}/host/new?venue=${v.slug}`, sharePct: v.share_bps / 100 });
    await sendEmail(email, mail.subject, mail.html, mail.text, { replyTo: SUPPORT_EMAIL });
    return NextResponse.json({ existing: true });
  }

  const slug = makeSlug(name);
  const venueKey = makeHostKey();
  const share = partnerShare();
  const { error } = await db.from("venues").insert({
    slug, name, city, kind, email, phone, source: "self",
    contact: [person, phone, email].filter(Boolean).join(" · "),
    venue_key: venueKey, share_bps: Math.round(share * 100),
  });
  if (error) {
    console.error("partner signup", error.message);
    return NextResponse.json({ error: `Couldn't sign you up just now. Email ${SUPPORT_EMAIL} and we'll set you up.` }, { status: 500 });
  }

  const dashboard = `${site}/v/${slug}?key=${venueKey}`;
  const clientLink = `${site}/host/new?venue=${slug}`;
  const mail = partnerWelcomeEmail({ name, kind, dashboard, clientLink, sharePct: share });
  await sendEmail(email, mail.subject, mail.html, mail.text, { replyTo: SUPPORT_EMAIL });
  await alertAdmin(`partner:${slug}`, `New ${kind}: ${name}`, [
    `${name}${city ? `, ${city}` : ""}`,
    `Contact: ${person || "(no name)"} · ${phone} · ${email}`,
    `Share: ${share}%. Change it on the Partners admin page if needed.`,
  ]);

  return NextResponse.json({ dashboard, clientLink, share });
}
