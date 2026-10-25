import "server-only";

// Sends email through Resend (resend.com). Set RESEND_API_KEY and EMAIL_FROM in Vercel.
// Until you verify your own domain in Resend, it can only deliver to your own Resend account email.

export function emailReady(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail(to: string, subject: string, html: string, text: string, opts: { replyTo?: string } = {}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const r = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Odogwu <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
        text,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
      cache: "no-store",
    });
    if (!r.ok) console.error("email failed", r.status, await r.text().catch(() => ""));
    return r.ok;
  } catch (e) {
    console.error("email failed", e);
    return false;
  }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
