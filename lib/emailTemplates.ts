import "server-only";
import { siteUrl } from "./events";
import { COMPANY, SUPPORT_EMAIL } from "./contact";

// Branded Odogwu emails. Table layout and inline styles so they look right in Gmail, Outlook and iPhone Mail.

const C = { wine: "#2a0820", plum: "#431235", gold: "#f2b705", lace: "#fcefd9", ink: "#2a0820", soft: "#6b5862", page: "#f4ece2", line: "#eadfd3" };
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

type Layout = {
  preheader: string;                       // grey preview line shown in the inbox list
  heading: string;
  intro: string[];
  button?: { label: string; url: string };
  code?: string;                           // big 6-digit code box
  facts?: [string, string][];              // label / value rows
  steps?: { title: string; text: string }[];
  after?: string[];                        // paragraphs below the button
};

export type Email = { subject: string; html: string; text: string };

function layout(o: Layout): string {
  const site = siteUrl();
  const logo = `${site}/icon-192.png`;
  const p = (t: string, extra = "") =>
    `<p style="margin:0 0 14px;font:16px/1.6 ${FONT};color:${C.ink};${extra}">${esc(t)}</p>`;

  const button = o.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 8px"><tr><td style="border-radius:999px;background:${C.gold}">
        <a href="${esc(o.button.url)}" style="display:inline-block;padding:15px 30px;font:bold 16px ${FONT};color:${C.wine};text-decoration:none;border-radius:999px">${esc(o.button.label)}</a>
      </td></tr></table>
      <p style="margin:0 0 18px;font:13px/1.5 ${FONT};color:${C.soft}">Button not working? Copy this link:<br><a href="${esc(o.button.url)}" style="color:${C.plum};word-break:break-all">${esc(o.button.url)}</a></p>`
    : "";

  const code = o.code
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px"><tr><td align="center" style="background:${C.page};border-radius:14px;padding:18px">
        <div style="font:13px ${FONT};color:${C.soft};margin-bottom:6px">${o.button ? "Or enter this code" : "Your code"}</div>
        <div style="font:bold 34px/1 'Courier New',monospace;letter-spacing:10px;color:${C.wine}">${esc(o.code)}</div>
      </td></tr></table>`
    : "";

  const facts = o.facts?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 8px;border-top:1px solid ${C.line}">
        ${o.facts.map(([k, v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.line};font:14px ${FONT};color:${C.soft};width:38%">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid ${C.line};font:bold 14px ${FONT};color:${C.ink}">${esc(v)}</td></tr>`).join("")}
      </table>`
    : "";

  const steps = o.steps?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 6px">
        ${o.steps.map((s, i) => `<tr><td valign="top" style="padding:0 12px 14px 0;width:32px"><div style="width:28px;height:28px;border-radius:50%;background:${C.gold};color:${C.wine};font:bold 14px/28px ${FONT};text-align:center">${i + 1}</div></td>
          <td style="padding:0 0 14px;font:15px/1.5 ${FONT};color:${C.ink}"><strong>${esc(s.title)}</strong><br><span style="color:${C.soft}">${esc(s.text)}</span></td></tr>`).join("")}
      </table>`
    : "";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(o.heading)}</title></head>
<body style="margin:0;padding:0;background:${C.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page}"><tr><td align="center" style="padding:28px 14px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden">
    <tr><td style="background:${C.wine};padding:22px 28px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td><img src="${logo}" width="36" height="36" alt="" style="display:block;border:0;border-radius:8px"></td>
        <td style="padding-left:10px;font:bold 22px ${FONT};color:${C.lace};letter-spacing:.3px">Odogwu</td>
      </tr></table>
    </td></tr>
    <tr><td style="height:6px;background:${C.gold};font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="padding:30px 28px 10px">
      <h1 style="margin:0 0 16px;font:bold 26px/1.25 ${FONT};color:${C.wine}">${esc(o.heading)}</h1>
      ${o.intro.map((t) => p(t)).join("")}
      ${facts}
      ${button}
      ${code}
      ${steps}
      ${(o.after ?? []).map((t) => p(t, `font-size:14px;color:${C.soft}`)).join("")}
    </td></tr>
    <tr><td style="padding:18px 28px 26px;border-top:1px solid ${C.line}">
      <p style="margin:0 0 8px;font:13px/1.5 ${FONT};color:${C.soft}">🛡️ <strong style="color:${C.ink}">Odogwu never holds your money.</strong> Payments are processed by Paystack and paid straight into the celebrant's bank.</p>
      <p style="margin:0;font:12px/1.5 ${FONT};color:${C.soft}">Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color:${C.plum}">${SUPPORT_EMAIL}</a> · <a href="${site}/terms" style="color:${C.plum}">Terms</a> · <a href="${site}/privacy" style="color:${C.plum}">Privacy</a><br>${esc(COMPANY)}</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

/** Sign-in email: one-tap magic link, with the 6-digit code as a backup. */
export function loginEmail(link: string, code: string): Email {
  return {
    subject: `Sign in to Odogwu (code ${code})`,
    html: layout({
      preheader: `Tap to open your celebrations, or use code ${code}. Expires in 10 minutes.`,
      heading: "Sign in to Odogwu",
      intro: ["Tap the button to open your celebrations on this device. It works once and expires in 10 minutes."],
      button: { label: "Sign in to my dashboard", url: link },
      code,
      after: ["Didn't ask to sign in? You can ignore this email. Nobody can get in without it."],
    }),
    text: `Sign in to Odogwu\n\nOpen this link to sign in (works once, expires in 10 minutes):\n${link}\n\nOr enter this code: ${code}\n\nDidn't ask to sign in? Ignore this email.`,
  };
}

/** Sent the moment a celebration is created: their private link and what to do next. */
export function welcomeEmail(o: { title: string; celebrant: string; date: string | null; payee: string; bank: string; link: string }): Email {
  const when = o.date
    ? new Date(o.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "Not set";
  return {
    subject: `${o.title} is ready on Odogwu 🎉`,
    html: layout({
      preheader: "Your private host link, and how to get ready for the party.",
      heading: `${o.title} is ready 🎉`,
      intro: [
        "Your celebration is set up. Below is your private host link: it opens your dashboard with the QR code, spray wall, table cards, report and highlight reel.",
      ],
      facts: [
        ["Spraying", o.celebrant],
        ["Date", when],
        ["Money goes to", `${o.payee} (${o.bank})`],
        ["Paid out", "Next working day, by Paystack"],
      ],
      button: { label: "Open my dashboard", url: o.link },
      steps: [
        { title: "Print your table cards", text: "One per table, plus the entrance poster from the MC kit." },
        { title: "Do the rehearsal checklist", text: "The day before: wall on the projector, sound, and one ₦1,000 test spray." },
        { title: "Give the MC the script", text: "So guests know to scan and spray at the right moments." },
      ],
      after: [
        "Keep this email. The link is private: anyone with it can manage your celebration, so don't forward it.",
        "Lost it? Sign in on Odogwu with this email address and we'll send you a new sign-in link.",
      ],
    }),
    text: `${o.title} is ready on Odogwu.\n\nYour private host link (keep it safe, don't forward it):\n${o.link}\n\nSpraying: ${o.celebrant}\nDate: ${when}\nMoney goes to: ${o.payee} (${o.bank})\nPaid out: next working day, by Paystack\n\nNext: print your table cards, do the rehearsal checklist the day before, and give the MC the script.\n\nLost the link? Sign in on Odogwu with this email.`,
  };
}
