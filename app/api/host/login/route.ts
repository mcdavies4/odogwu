import { NextResponse } from "next/server";
import { createHash, randomInt } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-server";
import { allow, cleanText, clientId, safeEqual, tooMany } from "@/lib/security";
import { EMAIL_RE, emailHtml, emailReady, sendEmail } from "@/lib/email";

const hash = (email: string, code: string) =>
  createHash("sha256").update(`${email}:${code}:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`).digest("hex");

const NOT_READY = "Email sign-in isn't switched on yet. Use the private link you saved, or contact us.";

/**
 * Host sign-in without passwords.
 *  { email }        → emails a 6-digit code (always answers "sent", so nobody can test which emails are hosts)
 *  { email, code }  → returns that host's celebrations so the phone can save the private links
 */
export async function POST(req: Request) {
  const who = clientId(req.headers);
  const body = await req.json().catch(() => ({}));
  const email = cleanText(body.email, 120).toLowerCase();
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const db = supabaseAdmin();

  // ---- Step 2: check the code
  if (typeof body.code === "string") {
    const code = body.code.replace(/\D/g, "");
    if (!(await allow(`login:v:${email}`, 900, 10)) || !(await allow(`login:vip:${who}`, 900, 30))) {
      return tooMany("Too many wrong codes. Wait 15 minutes and ask for a new one.");
    }
    const { data: row } = await db
      .from("login_codes")
      .select("id,code_hash,expires_at,attempts,used")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const fresh = row && !row.used && new Date(row.expires_at).getTime() > Date.now() && row.attempts < 5;
    if (!row || !fresh || code.length !== 6 || !safeEqual(hash(email, code), row.code_hash)) {
      if (row) await db.from("login_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      return NextResponse.json({ error: "That code is wrong or has expired. Ask for a new one." }, { status: 400 });
    }
    await db.from("login_codes").update({ used: true }).eq("id", row.id);
    const { data: events } = await db
      .from("events")
      .select("slug,title,host_key,created_at")
      .eq("host_email", email)
      .order("created_at", { ascending: false })
      .limit(50);
    return NextResponse.json({
      celebrations: (events ?? []).map((e) => ({ slug: e.slug, key: e.host_key, title: e.title })),
    });
  }

  // ---- Step 1: send a code
  if (!emailReady()) return NextResponse.json({ error: NOT_READY }, { status: 503 });
  if (!(await allow(`login:s:${email}`, 600, 3)) || !(await allow(`login:sip:${who}`, 3600, 10))) {
    return tooMany("We've sent a few codes already. Check your inbox and spam folder, or wait 10 minutes.");
  }
  const { data: hosted, error } = await db.from("events").select("id").eq("host_email", email).limit(1);
  if (error) return NextResponse.json({ error: NOT_READY }, { status: 503 }); // login.sql not run yet
  if (hosted && hosted.length) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const { error: e2 } = await db.from("login_codes").insert({
      email,
      code_hash: hash(email, code),
      expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    });
    if (!e2) {
      await sendEmail(
        email,
        `Your Odogwu code: ${code}`,
        emailHtml(`Your code is ${code}`, [
          "Enter this code on Odogwu to open your celebrations. It works for 10 minutes.",
          "If you didn't ask for it, you can ignore this email.",
        ]),
        `Your Odogwu code is ${code}. It works for 10 minutes. If you didn't ask for it, ignore this email.`
      );
    }
  }
  // Same answer whether or not the email has celebrations.
  return NextResponse.json({ sent: true });
}
