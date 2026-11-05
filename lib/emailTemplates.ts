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

/* ------------------------------------------------------------------ */
/* Self-serve and automation emails                                    */
/* ------------------------------------------------------------------ */

const longDate = (d: string | null) =>
  d ? new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "your celebration day";
const money = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

/** To you: something needs a look. */
export function adminAlertEmail(title: string, lines: string[], link?: { label: string; url: string }): Email {
  return {
    subject: `⚠️ Odogwu: ${title}`,
    html: layout({ preheader: lines[0] ?? title, heading: title, intro: lines, button: link }),
    text: `${title}\n\n${lines.join("\n")}${link ? `\n\n${link.label}: ${link.url}` : ""}`,
  };
}

/** To the person who asked for help: we've got it, and what happens next. */
export function helpReceivedEmail(o: { name: string; ticket: number | null; topic: string; message: string }): Email {
  const ref = o.ticket ? `#${o.ticket}` : "";
  return {
    subject: `We've got your message ${ref}`.trim(),
    html: layout({
      preheader: "A real person will reply, usually within a few hours.",
      heading: `Thanks${o.name ? `, ${o.name}` : ""}. We've got your message.`,
      intro: [
        "A real person will reply to this email, usually within a few hours.",
        "Just reply to this email if you want to add anything.",
      ],
      facts: [["Request", ref || "Received"], ["About", o.topic], ["You said", o.message.slice(0, 300)]],
      after: ["If this is about a payment: the money always goes through Paystack to the celebrant's own bank. Odogwu never holds it."],
    }),
    text: `Thanks, we've got your message ${ref}.\n\nA real person will reply, usually within a few hours.\n\nAbout: ${o.topic}\nYou said: ${o.message}`,
  };
}

/** To the host: the payout account was changed. Sent every time, so a leaked link can't be used quietly. */
export function payoutChangedEmail(o: { title: string; payee: string; bank: string; last4: string; link: string }): Email {
  return {
    subject: `Payout account changed for ${o.title}`,
    html: layout({
      preheader: `New spray packs now pay out to ${o.payee}.`,
      heading: "Your payout account was changed",
      intro: [`From now on, new spray packs for ${o.title} pay out to this account. Packs bought before the change still go to the old account.`],
      facts: [["Account name", o.payee], ["Bank", o.bank], ["Account", `····${o.last4}`]],
      button: { label: "Open my dashboard", url: o.link },
      after: ["Didn't make this change? Someone may have your private host link. Reply to this email straight away."],
    }),
    text: `Your payout account for ${o.title} was changed.\n\nNew spray packs now pay out to ${o.payee}, ${o.bank} ····${o.last4}. Earlier packs still go to the old account.\n\nDashboard: ${o.link}\n\nDidn't make this change? Reply to this email straight away.`,
  };
}

/** To the host, the day before: the rehearsal, so nothing is left to the night. */
export function reminderEmail(o: { title: string; date: string | null; payee: string; bank: string; link: string; cards: string; mc: string; wall: string }): Email {
  return {
    subject: `Tomorrow: get ${o.title} ready in 15 minutes`,
    html: layout({
      preheader: "Your rehearsal checklist for tomorrow's spraying.",
      heading: "Your celebration is tomorrow 🎉",
      intro: [`${o.title} is on ${longDate(o.date)}. Spend 15 minutes on these today and the night runs itself.`],
      facts: [["Money goes to", `${o.payee} (${o.bank})`]],
      button: { label: "Open the rehearsal checklist", url: o.link },
      steps: [
        { title: "Check the payout name above", text: "Wrong? Change it from your dashboard before guests start spraying." },
        { title: "Print the table cards", text: `One per table, plus the entrance poster: ${o.cards}` },
        { title: "Test the spray wall on the projector", text: `Open it on the laptop you'll use at the venue: ${o.wall}` },
        { title: "Do one ₦1,000 test spray", text: "It should land on the wall within a second. The money goes to the celebrant." },
        { title: "Give the MC the script", text: o.mc },
      ],
      after: ["Something not working? Every page has a Help button, and most problems fix themselves from there."],
    }),
    text: `${o.title} is tomorrow.\n\n1. Check the payout name: ${o.payee} (${o.bank}). Change it from your dashboard if wrong.\n2. Print table cards: ${o.cards}\n3. Test the wall on the projector: ${o.wall}\n4. Do one ₦1,000 test spray.\n5. Give the MC the script: ${o.mc}\n\nDashboard: ${o.link}`,
  };
}

/** To the host, the morning after: how it went, when the money lands, and what to keep. */
export function summaryEmail(o: {
  title: string; total: number; guests: number; top: string | null; payee: string; bank: string;
  link: string; report: string; recap: string; feedback: string;
}): Email {
  const intro = o.total > 0
    ? [`Your guests sprayed ${money(o.total)} at ${o.title}. 🎉`, `Paystack pays it into ${o.payee}'s account (${o.bank}) the next working day after each payment. Money from a Saturday party usually lands on Monday.`]
    : [`It looks like nobody sprayed through Odogwu at ${o.title}. If that's not right, reply to this email and we'll check.`];
  return {
    subject: o.total > 0 ? `${money(o.total)} sprayed at ${o.title} 🎉` : `How did ${o.title} go?`,
    html: layout({
      preheader: o.total > 0 ? "Your spray report, highlight reel and payout details." : "Tell us how it went.",
      heading: o.total > 0 ? "What a celebration!" : "How did it go?",
      intro,
      facts: o.total > 0 ? [["Total sprayed", money(o.total)], ["Guests who sprayed", String(o.guests)], ...(o.top ? [["Top sprayer", o.top] as [string, string]] : [])] : undefined,
      button: o.total > 0 ? { label: "Download the spray report", url: o.report } : { label: "Open my dashboard", url: o.link },
      steps: o.total > 0 ? [
        { title: "Thank your guests", text: "The spray report lists who gave what, for your thank-you messages." },
        { title: "Post the highlight reel", text: `A 20-second video of the night: ${o.recap}` },
        { title: "Tell us how it went", text: `Two questions, one minute: ${o.feedback}` },
      ] : undefined,
      after: ["Payout not arrived after two working days? Reply to this email with the celebration name and we'll chase it with Paystack."],
    }),
    text: `${intro.join("\n\n")}\n\nSpray report: ${o.report}\nHighlight reel: ${o.recap}\nTell us how it went: ${o.feedback}\nDashboard: ${o.link}`,
  };
}

/** To a new venue or planner partner: their links, straight away. */
export function partnerWelcomeEmail(o: { name: string; kind: "venue" | "planner"; dashboard: string; clientLink: string; sharePct: number }): Email {
  const who = o.kind === "planner" ? "clients" : "celebrants at your hall";
  return {
    subject: `${o.name} is now an Odogwu partner`,
    html: layout({
      preheader: "Your partner dashboard and your link for clients.",
      heading: `Welcome, ${o.name} 🤝`,
      intro: [
        `You're set up. Every celebration made with your link counts towards your share${o.sharePct ? ` of ${o.sharePct}% of everything sprayed` : ""}.`,
      ],
      facts: [["Your link for clients", o.clientLink], ...(o.sharePct ? [["Your share", `${o.sharePct}% of spray pack value`] as [string, string]] : [])],
      button: { label: "Open my partner dashboard", url: o.dashboard },
      steps: [
        { title: `Send ${who} your link`, text: "They create their celebration with it. It takes two minutes." },
        { title: "Put the spray wall on your screen", text: "Each celebration's wall opens from its host dashboard." },
        { title: "Watch your dashboard", text: "See every celebration and what was sprayed, live." },
      ],
      after: [
        "Keep this email. The dashboard link is private. Lost it? Use Host sign-in on Odogwu with this email address.",
        "Your share is paid to you monthly. Reply to this email with the bank account you'd like it paid into.",
      ],
    }),
    text: `Welcome, ${o.name}.\n\nYour link for clients: ${o.clientLink}\nYour private dashboard: ${o.dashboard}\n${o.sharePct ? `Your share: ${o.sharePct}% of spray pack value, paid monthly.\n` : ""}\nReply with the bank account you'd like your share paid into.`,
  };
}

/** To you, every morning: what happened, and only the things that need you. */
export function digestEmail(o: { date: string; lines: string[]; attention: string[]; adminLink: string }): Email {
  const quiet = o.attention.length === 0;
  return {
    subject: quiet ? `Odogwu daily: all good (${o.date})` : `Odogwu daily: ${o.attention.length} thing${o.attention.length === 1 ? "" : "s"} need you (${o.date})`,
    html: layout({
      preheader: quiet ? "Nothing needs you today." : o.attention[0],
      heading: quiet ? "All good ✅" : "Needs you",
      intro: quiet ? ["Nothing needs you today."] : o.attention,
      facts: o.lines.map((l) => { const i = l.indexOf(": "); return [l.slice(0, i), l.slice(i + 2)] as [string, string]; }),
      button: { label: "Open the inbox", url: o.adminLink },
    }),
    text: `${quiet ? "All good. Nothing needs you today." : o.attention.join("\n")}\n\n${o.lines.join("\n")}\n\n${o.adminLink}`,
  };
}

/* ------------------------------------------------------------------ */
/* Follow-ups for people who signed up and haven't got going yet       */
/* ------------------------------------------------------------------ */

const STOP = "Don't want these tips? Reply \"stop\" and we won't send any more.";

/** To a host, 2–3 days after creating a celebration, if nothing has happened yet. */
export function hostGetReadyEmail(o: { title: string; celebrant: string; date: string | null; payee: string; bank: string; link: string; cards: string; demo: string }): Email {
  const noDate = !o.date;
  const intro = [
    `You set up ${o.title} on Odogwu a few days ago. Here's how to get the most out of it, in about 10 minutes.`,
    ...(noDate ? ["You haven't added the date yet. Add it on your dashboard and we'll send you a checklist the day before."] : []),
  ];
  const steps = [
    { title: "Check the payout name", text: `Spray money goes to ${o.payee} (${o.bank}). Wrong? Change it from your dashboard.` },
    ...(noDate ? [{ title: "Add the party date", text: "Under \"Celebration details\" on your dashboard." }] : []),
    { title: "See what your guests will see", text: `Spray a few pretend notes on the demo wall: ${o.demo}` },
    { title: "Print numbered table cards", text: `One per table. Each card tells the wall which table is spraying: ${o.cards}` },
    { title: "Tell your guests: no cash needed", text: "Mention it in your WhatsApp group so nobody queues at the ATM." },
  ];
  return {
    subject: `Getting ${o.title} ready`,
    html: layout({
      preheader: "Ten minutes now saves you stress on the day.",
      heading: `Let's get ${o.title} ready 🎉`,
      intro,
      button: { label: "Open my dashboard", url: o.link },
      steps,
      after: ["Questions? Just reply to this email. A real person reads every one.", STOP],
    }),
    text: `${intro.join("\n\n")}\n\n${steps.map((s, i) => `${i + 1}. ${s.title}: ${s.text}`).join("\n")}\n\nDashboard: ${o.link}\n\nQuestions? Reply to this email.\n${STOP}`,
  };
}

/** To a host, one week before the party. */
export function hostWeekEmail(o: { title: string; celebrant: string; date: string | null; link: string; cards: string; mcLive: string; guestLink: string }): Email {
  const whatsapp = `Hi everyone! 🎉 At ${o.title} on ${longDate(o.date)}, you can spray ${o.celebrant} straight from your phone. No cash needed: just scan the QR code on your table. Add a selfie and your face shows on the big screen! Try it here: ${o.guestLink}`;
  return {
    subject: `One week to ${o.title} 🎉`,
    html: layout({
      preheader: "Four things to sort this week, and a message for your guests.",
      heading: "One week to go!",
      intro: [`${o.title} is on ${longDate(o.date)}. Sort these this week and the day itself runs smoothly.`],
      button: { label: "Open my dashboard", url: o.link },
      steps: [
        { title: "Print the table cards now", text: `Print shops get busy the week of a party: ${o.cards}` },
        { title: "Send your guests this message", text: whatsapp },
        { title: "Brief your MC", text: `Send them the MC live screen. It shows every spray as it lands, with names and tables, so they can shout people out: ${o.mcLive}` },
        { title: "Set your ODOGWU ALERT", text: "On your dashboard, choose how big a spray takes over the whole screen." },
      ],
      after: ["We'll send your rehearsal checklist the day before. Questions? Reply to this email.", STOP],
    }),
    text: `${o.title} is on ${longDate(o.date)}.\n\n1. Print the table cards now: ${o.cards}\n2. Send your guests this message:\n${whatsapp}\n3. Brief your MC with the live screen: ${o.mcLive}\n4. Set your ODOGWU ALERT level on the dashboard.\n\nDashboard: ${o.link}\n\n${STOP}`,
  };
}

/** To a partner, 3 days after signing up with no celebrations yet. */
export function partnerFirstClientEmail(o: { name: string; kind: "venue" | "planner"; clientLink: string; dashboard: string; demo: string; sharePct: number }): Email {
  const forward = `Hi! For your celebration, guests can now spray money from their phones with Odogwu. The notes rain on the big screen with their names, and every naira goes straight into your bank account the next working day. It's free for you, and takes 2 minutes to set up: ${o.clientLink}`;
  return {
    subject: "Your first celebration on Odogwu",
    html: layout({
      preheader: "A ready-to-send message for your next client.",
      heading: `Let's get your first one, ${o.name}`,
      intro: [
        `Every celebration made with your link earns you ${o.sharePct || 1}% of everything sprayed. The quickest way to start is with your very next ${o.kind === "planner" ? "client" : "booking"}.`,
      ],
      steps: [
        { title: "Copy and send this message", text: forward },
        { title: "Show them the demo", text: `Open the demo spray wall on your phone or screen. Clients get it in 10 seconds: ${o.demo}` },
        { title: "Let us set it up for you", text: "Reply with your client's name and party date, and we'll walk them through it." },
      ],
      button: { label: "Open my partner dashboard", url: o.dashboard },
      after: [STOP],
    }),
    text: `Let's get your first one, ${o.name}.\n\nSend your next client this message:\n${forward}\n\nShow them the demo: ${o.demo}\n\nOr reply with your client's name and party date and we'll set it up with them.\n\nDashboard: ${o.dashboard}\n\n${STOP}`,
  };
}

/** To a partner, ~10 days after signing up with still no celebrations: short and personal. */
export function partnerCheckInEmail(o: { name: string; clientLink: string }): Email {
  const lines = [
    `Hi ${o.name},`,
    "Emeka here, from Odogwu. I noticed you signed up but haven't had a celebration on Odogwu yet, so I wanted to check in.",
    "Is anything getting in the way? A question from a client, how payments work, or just timing? Reply and tell me. I read every reply myself.",
    "If you have an event coming up, send me the date and I'll help you set it up so it goes perfectly.",
  ];
  return {
    subject: "Quick question",
    html: layout({
      preheader: "Anything getting in the way?",
      heading: "Quick check-in",
      intro: lines,
      button: { label: "Your link for clients", url: o.clientLink },
      after: ["Emeka, Odogwu", STOP],
    }),
    text: `${lines.join("\n\n")}\n\nYour link for clients: ${o.clientLink}\n\nEmeka, Odogwu\n\n${STOP}`,
  };
}
