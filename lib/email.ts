import "server-only";

// Sends email through Resend (resend.com). Set RESEND_API_KEY and EMAIL_FROM in Vercel.
// Until you verify your own domain in Resend, it can only deliver to your own Resend account email.

export function emailReady(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
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

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** A simple branded email body: heading, paragraphs, optional button. */
export function emailHtml(heading: string, paragraphs: string[], button?: { label: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f6efe6;font-family:Arial,Helvetica,sans-serif;color:#2a0820">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#2a0820;padding:18px 24px;color:#f2b705;font-weight:bold;font-size:20px">Odogwu</td></tr>
<tr><td style="padding:24px">
<h1 style="font-size:22px;margin:0 0 14px">${esc(heading)}</h1>
${paragraphs.map((p) => `<p style="font-size:15px;line-height:1.55;margin:0 0 12px">${esc(p)}</p>`).join("")}
${button ? `<p style="margin:20px 0"><a href="${esc(button.url)}" style="background:#f2b705;color:#2a0820;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:999px;display:inline-block">${esc(button.label)}</a></p>` : ""}
<p style="font-size:12px;color:#7a6a72;margin:18px 0 0">Odogwu never holds your money. Payments are processed by Paystack and paid straight to the celebrant's bank.</p>
</td></tr></table></td></tr></table></body></html>`;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
