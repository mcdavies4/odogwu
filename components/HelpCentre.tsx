"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { FaqGroup } from "@/lib/faq";

type Check =
  | { found: false; reference: string }
  | { found: true; reference: string; status: "success" | "pending" | "failed"; slug: string; title: string; amount: number; remaining: number; ageMinutes: number };

const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");

const TOPICS: [string, string][] = [
  ["paid", "I paid but can't spray"],
  ["payout", "Payout to the celebrant"],
  ["host", "Setting up or running a celebration"],
  ["wall", "Spray wall or projector"],
  ["partner", "Partnering (venue or planner)"],
  ["feedback", "Feedback after a celebration"],
  ["other", "Something else"],
];

export function HelpCentre({ groups, initial, supportEmail }: {
  groups: FaqGroup[];
  initial: { ref?: string; topic?: string; event?: string };
  supportEmail: string;
}) {
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // ---- spray pack checker
  const [ref, setRef] = useState(initial.ref ?? "");
  const [onPhone, setOnPhone] = useState<{ slug: string; ref: string }[]>([]);
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<Check | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  // ---- contact form
  const [form, setForm] = useState({ topic: initial.topic && TOPICS.some(([k]) => k === initial.topic) ? initial.topic : initial.ref ? "paid" : "", name: "", email: "", phone: "", event: initial.event ?? "", reference: initial.ref ?? "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<number | null | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    // Spray packs bought on this phone, so guests don't need to find a reference.
    try {
      const found: { slug: string; ref: string }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || "";
        if (k.startsWith("odogwu:ref:")) {
          const r = localStorage.getItem(k);
          if (r && r.startsWith("odg_")) found.push({ slug: k.slice("odogwu:ref:".length), ref: r });
        }
      }
      setOnPhone(found.slice(0, 5));
      const name = localStorage.getItem("odogwu:name");
      if (name) setForm((f) => ({ ...f, name: f.name || name }));
    } catch {}
    if (initial.ref) void runCheck(initial.ref);
    if (initial.topic && initial.topic !== "paid") setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runCheck(value = ref) {
    setChecking(true);
    setCheck(null);
    setCheckError(null);
    try {
      const r = await fetch("/api/help/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference: value }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCheck(d);
      setRef(d.reference);
      setForm((f) => ({ ...f, reference: d.reference, topic: f.topic || "paid" }));
    } catch (e) {
      setCheckError((e as Error).message || "Couldn't check that. Try again.");
    } finally {
      setChecking(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setFormError(null);
    try {
      const r = await fetch("/api/help", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setSent(d.ticket ?? null);
    } catch (err) {
      setFormError((err as Error).message || `Couldn't send. Email ${supportEmail} instead.`);
    } finally {
      setSending(false);
    }
  }

  const term = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      groups
        .map((g) => ({ ...g, items: g.items.filter((i) => !term || `${i.q} ${i.a}`.toLowerCase().includes(term)) }))
        .filter((g) => g.items.length),
    [groups, term]
  );
  const hits = filtered.reduce((n, g) => n + g.items.length, 0);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const goToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="stack help">
      <div className="help-search">
        <input className="input" type="search" placeholder="Search: payout, lost link, projector…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search help" />
      </div>

      {!term && (
        <div className="tool-grid">
          <a className="tool" href="#pack"><span>💸</span><strong>I paid but can&apos;t spray</strong><small>Check your pack with Paystack</small></a>
          <Link className="tool" href="/host/login"><span>🔑</span><strong>Lost my host link</strong><small>Sign in with your email</small></Link>
          <a className="tool" href="#hosts"><span>🏦</span><strong>Payouts</strong><small>When the money arrives, wrong account</small></a>
          <a className="tool" href="#hosts"><span>📺</span><strong>Spray wall</strong><small>Projector, sound, not updating</small></a>
        </div>
      )}

      {/* ---- Self-fix: check a spray pack */}
      {!term && (
        <section className="panel stack" id="pack">
          <div>
            <h2 style={{ fontSize: 20 }}>Check my spray pack</h2>
            <p className="small muted">We ask Paystack directly. If your payment went through, you go straight back to your notes.</p>
          </div>
          {onPhone.length > 0 && (
            <div className="stack" style={{ gap: 8 }}>
              <span className="small">Packs bought on this phone:</span>
              <div className="chips">
                {onPhone.map((p) => (
                  <button key={p.ref} type="button" className="chip" onClick={() => { setRef(p.ref); void runCheck(p.ref); }}>
                    {p.slug.replace(/-[a-z0-9]{4}$/, "").replace(/-/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          )}
          <form className="stack" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); void runCheck(); }}>
            <input className="input" placeholder="Paste your reference (odg_…)" value={ref} onChange={(e) => setRef(e.target.value.trim())} aria-label="Payment reference" />
            <button className="btn btn-block" disabled={checking || ref.length < 8}>{checking ? "Checking…" : "Check"}</button>
          </form>
          <p className="small muted">The reference is in the Paystack receipt email and at the bottom of the spray screen. It starts with <code>odg_</code>.</p>
          {checkError && <div className="error small" role="alert">{checkError}</div>}
          {check && <PackResult c={check} onContact={goToForm} />}
        </section>
      )}

      {/* ---- Answers */}
      {term && <p className="small muted">{hits ? `${hits} answer${hits === 1 ? "" : "s"}` : "No answers match. Send us a message below."}</p>}
      {filtered.map((g) => (
        <section key={g.id} id={g.id} className="stack" style={{ gap: 8 }}>
          <h2 style={{ fontSize: 20 }}>{g.icon} {g.title}</h2>
          <div className="faq">
            {g.items.map((i) => {
              const id = `${g.id}:${i.q}`;
              const open = !!term || openId === id;
              return (
                <div key={id} className={`faq-item${open ? " open" : ""}`}>
                  <button type="button" onClick={() => setOpenId(open && !term ? null : id)} aria-expanded={open}>
                    <span>{i.q}</span><span aria-hidden="true">{open ? "−" : "+"}</span>
                  </button>
                  {open && (
                    <div className="faq-a">
                      <p>{i.a}</p>
                      {i.link && <Link className="chip" href={i.link.href}>{i.link.label}</Link>}
                      {i.fix === "pack" && term && <a className="chip" href="#pack" onClick={() => setQ("")}>Check my spray pack</a>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* ---- Contact */}
      <section className="panel stack" id="contact">
        <div>
          <h2 style={{ fontSize: 20 }}>Still stuck? Message us</h2>
          <p className="small muted">A real person replies by email, usually within a few hours.</p>
        </div>
        {sent !== undefined ? (
          <div className="ok" role="status">
            <strong>Sent{sent ? ` (request #${sent})` : ""}.</strong> We&apos;ve emailed you a copy. We&apos;ll reply to <strong>{form.email}</strong>. Check your spam folder too.
          </div>
        ) : (
          <form ref={formRef} className="stack" onSubmit={send}>
            <label className="field"><span>What&apos;s it about?</span>
              <select className="input" required value={form.topic} onChange={set("topic")}>
                <option value="" disabled>Choose one</option>
                {TOPICS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </label>
            <label className="field"><span>Your name</span>
              <input className="input" maxLength={60} autoComplete="name" value={form.name} onChange={set("name")} />
            </label>
            <label className="field"><span>Your email</span>
              <input className="input" type="email" inputMode="email" autoComplete="email" required value={form.email} onChange={set("email")} />
              <small>We reply here.</small>
            </label>
            <label className="field"><span>Phone or WhatsApp (optional)</span>
              <input className="input" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} value={form.phone} onChange={set("phone")} />
            </label>
            <label className="field"><span>Celebration name (if it&apos;s about one)</span>
              <input className="input" maxLength={160} placeholder="Tolu & Chidi's wedding" value={form.event} onChange={set("event")} />
              <small>Don&apos;t paste your private host link. The name is enough.</small>
            </label>
            {(form.topic === "paid" || form.reference) && (
              <label className="field"><span>Payment reference</span>
                <input className="input" placeholder="odg_…" value={form.reference} onChange={set("reference")} />
              </label>
            )}
            <label className="field"><span>What happened?</span>
              <textarea className="input" required minLength={10} maxLength={2000} rows={5} value={form.message} onChange={set("message")} />
            </label>
            {formError && <div className="error small" role="alert">{formError}</div>}
            <button className="btn btn-block" disabled={sending}>{sending ? "Sending…" : "Send message"}</button>
            <p className="small muted center">Or email <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
          </form>
        )}
      </section>
    </div>
  );
}

function PackResult({ c, onContact }: { c: Check; onContact: () => void }) {
  if (!c.found) {
    return (
      <div className="error small">
        We couldn&apos;t find a spray pack with that reference. Check it&apos;s copied exactly from the Paystack receipt, or{" "}
        <button type="button" className="linkish" onClick={onContact}>send us a message</button>.
      </div>
    );
  }
  const spray = `/e/${c.slug}/spray?reference=${encodeURIComponent(c.reference)}`;
  if (c.status === "success") {
    return c.remaining > 0 ? (
      <div className="ok stack" style={{ gap: 10 }}>
        <span>✅ <strong>Payment confirmed.</strong> You have <strong>{naira(c.remaining)}</strong> left to spray at {c.title}.</span>
        <Link className="btn btn-block" href={spray}>Continue spraying</Link>
      </div>
    ) : (
      <div className="ok">
        ✅ <strong>Payment confirmed, and every note is sprayed.</strong> The {naira(c.amount)} goes to the celebrant&apos;s bank the next working day. Nothing else to do.
      </div>
    );
  }
  if (c.status === "pending") {
    return c.ageMinutes < 30 ? (
      <div className="panel small" style={{ background: "var(--wine)" }}>
        ⏳ <strong>Paystack hasn&apos;t confirmed this payment yet.</strong> Bank transfers and USSD can take a few minutes. Keep this page open and check again shortly, or{" "}
        <Link href={spray}>open the spray screen</Link>. It unlocks by itself the moment Paystack confirms.
      </div>
    ) : (
      <div className="error small">
        ⏳ <strong>Paystack still hasn&apos;t received this payment</strong> ({c.ageMinutes} minutes on). If the money left your account, it&apos;s usually reversed by your bank. If not,{" "}
        <button type="button" className="linkish" onClick={onContact}>send us a message</button> and we&apos;ll check with Paystack. Your reference is already filled in.
      </div>
    );
  }
  return (
    <div className="error small">
      <strong>This payment didn&apos;t go through</strong>, so it wasn&apos;t received by Odogwu or the celebrant. If your bank shows a debit, it&apos;s usually reversed automatically within 24 hours.{" "}
      <Link href={`/e/${c.slug}`}>Try again</Link>.
    </div>
  );
}
