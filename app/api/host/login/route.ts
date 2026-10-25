import { NextResponse } from "next/server";
import { createHash, randomBytes, randomInt } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-server";
import { allow, cleanText, clientId, safeEqual, tooMany } from "@/lib/security";
import { EMAIL_RE, emailReady, sendEmail } from "@/lib/email";
import { loginEmail } from "@/lib/emailTemplates";
import { siteUrl } from "@/lib/events";

const pepper = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const codeHash = (email: string, code: string) => createHash("sha256").update(`${email}:${code}:${pepper()}`).digest("hex");
const tokenHash = (token: string) => createHash("sha256").update(`link:${token}:${pepper()}`).digest("hex");

const NOT_READY = "Email sign-in isn't switched on yet. Use the private link you saved, or contact us.";
const BAD = "That sign-in link or code is wrong, used or expired. Ask for a new one.";

type CodeRow = { id: number; email: string; code_hash: string; expires_at: string; attempts: number; used: boolean };

async function celebrationsFor(email: string) {
  const { data } = await supabaseAdmin()
    .from("events")
    .select("slug,title,host_key,created_at")
    .eq("host_email", email)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((e) => ({ slug: e.slug, key: e.host_key, title: e.title }));
}

const usable = (r: CodeRow | null) => !!r && !r.used && new Date(r.expires_at).getTime() > Date.now() && r.attempts < 5;

/**
 * Host sign-in without passwords.
 *  { email }         → emails a magic link + 6-digit code (always answers "sent", so nobody can test which emails are hosts)
 *  { email, code }   → signs in with the code
 *  { token }         → signs in with the magic link (only when the person taps the button, so email scanners can't use it up)
 */
export async function POST(req: Request) {
  const who = clientId(req.headers);
  const body = await req.json().catch(() => ({}));
  const db = supabaseAdmin();

  // ---- Magic link
  if (typeof body.token === "string") {
    if (!(await allow(`login:t:${who}`, 900, 30))) return tooMany();
    const token = body.token.replace(/[^A-Za-z0-9_-]/g, "");
    if (token.length < 30) return NextResponse.json({ error: BAD }, { status: 400 });
    const { data: row } = await db.from("login_codes").select("*").eq("token_hash", tokenHash(token)).maybeSingle<CodeRow>();
    if (!usable(row)) return NextResponse.json({ error: BAD }, { status: 400 });
    await db.from("login_codes").update({ used: true }).eq("id", row!.id);
    return NextResponse.json({ celebrations: await celebrationsFor(row!.email) });
  }

  const email = cleanText(body.email, 120).toLowerCase();
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  // ---- 6-digit code
  if (typeof body.code === "string") {
    const code = body.code.replace(/\D/g, "");
    if (!(await allow(`login:v:${email}`, 900, 10)) || !(await allow(`login:vip:${who}`, 900, 30))) {
      return tooMany("Too many wrong codes. Wait 15 minutes and ask for a new one.");
    }
    const { data: row } = await db
      .from("login_codes")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<CodeRow>();
    if (!usable(row) || code.length !== 6 || !safeEqual(codeHash(email, code), row!.code_hash)) {
      if (row) await db.from("login_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      return NextResponse.json({ error: BAD }, { status: 400 });
    }
    await db.from("login_codes").update({ used: true }).eq("id", row!.id);
    return NextResponse.json({ celebrations: await celebrationsFor(email) });
  }

  // ---- Send the email
  if (!emailReady()) return NextResponse.json({ error: NOT_READY }, { status: 503 });
  if (!(await allow(`login:s:${email}`, 600, 3)) || !(await allow(`login:sip:${who}`, 3600, 10))) {
    return tooMany("We've sent a few emails already. Check your inbox and spam folder, or wait 10 minutes.");
  }
  const { data: hosted, error } = await db.from("events").select("id").eq("host_email", email).limit(1);
  if (error) return NextResponse.json({ error: NOT_READY }, { status: 503 }); // login.sql not run yet
  if (hosted && hosted.length) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const token = randomBytes(32).toString("base64url");
    const row = { email, code_hash: codeHash(email, code), expires_at: new Date(Date.now() + 10 * 60_000).toISOString() };
    let { error: e2 } = await db.from("login_codes").insert({ ...row, token_hash: tokenHash(token) });
    let withLink = !e2;
    if (e2) { ({ error: e2 } = await db.from("login_codes").insert(row)); withLink = false; } // older login.sql without token_hash
    if (!e2) {
      const link = `${siteUrl()}/host/login/link?t=${token}`;
      const mail = loginEmail(withLink ? link : `${siteUrl()}/host/login`, code);
      await sendEmail(email, mail.subject, mail.html, mail.text);
    }
  }
  return NextResponse.json({ sent: true }); // same answer whether or not the email has celebrations
}
