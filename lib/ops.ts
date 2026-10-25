import "server-only";
import { supabaseAdmin } from "./supabase-server";
import { allow } from "./security";
import { sendEmail } from "./email";
import { adminAlertEmail } from "./emailTemplates";
import { SUPPORT_EMAIL } from "./contact";

/** Where alerts and the daily summary go. Set ADMIN_EMAIL in Vercel; falls back to the support email. */
export const adminEmail = () => process.env.ADMIN_EMAIL || SUPPORT_EMAIL;

/** Emails you straight away. Each kind of alert is sent at most once every 10 minutes, so a bad night can't flood your inbox. */
export async function alertAdmin(kind: string, title: string, lines: string[], link?: { label: string; url: string }) {
  if (!(await allow(`alert:${kind}`, 600, 1))) return;
  const mail = adminAlertEmail(title, lines, link);
  await sendEmail(adminEmail(), mail.subject, mail.html, mail.text).catch(() => false);
}

/**
 * Records something that went wrong, for the daily summary. With `alert`, also emails you now.
 * Never throws: logging must not break the thing that's already going wrong.
 */
export async function logIncident(kind: string, detail: Record<string, unknown>, alert?: { title: string; lines: string[] }) {
  try {
    await supabaseAdmin().from("incidents").insert({ kind, detail });
  } catch {
    // automation.sql not run yet
  }
  if (alert) await alertAdmin(kind, alert.title, alert.lines).catch(() => {});
}
