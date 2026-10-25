"use client";
import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Note";
import { Footer } from "@/components/Footer";

type Hosted = { slug: string; key: string; title: string };
type Partner = { name: string; href: string };

/** Lost your private host link? Get back in with a code sent to your email. */
export default function HostLogin() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<Hosted[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  async function call(payload: Record<string, string>) {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/host/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      return d;
    } catch (e) {
      setError((e as Error).message || "Something went wrong. Try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (await call({ email })) setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const d = await call({ email, code });
    if (!d) return;
    const found: Hosted[] = d.celebrations ?? [];
    try {
      const saved = JSON.parse(localStorage.getItem("odogwu:hosted") || "[]") as Hosted[];
      const merged = [...found, ...saved.filter((s) => !found.some((f) => f.slug === s.slug))].slice(0, 30);
      localStorage.setItem("odogwu:hosted", JSON.stringify(merged));
    } catch {}
    setList(found);
    setPartners(d.partners ?? []);
    setStep("done");
  }

  return (
    <>
      <header className="topbar"><Link href="/" className="brand"><Logo />Odogwu</Link></header>
      <main className="wrap stack">
        <h1 style={{ fontSize: 32 }}>Sign in</h1>

        {step === "email" && (
          <form className="stack" onSubmit={send}>
            <p className="muted">For hosts and partners. Enter the email you used when you created your celebration or signed up as a partner, and we&apos;ll email you a sign-in link.</p>
            <label className="field"><span>Email</span>
              <input className="input" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {error && <div className="error small" role="alert">{error}</div>}
            <button className="btn btn-block" disabled={busy}>{busy ? "Sending…" : "Email me a sign-in link"}</button>
          </form>
        )}

        {step === "code" && (
          <form className="stack" onSubmit={verify}>
            <div className="ok small">If <strong>{email}</strong> has celebrations on Odogwu, an email is on its way. <strong>Tap the link in it</strong>, or type the 6-digit code below. Check your spam folder too.</div>
            <label className="field"><span>6-digit code</span>
              <input className="input code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
            </label>
            {error && <div className="error small" role="alert">{error}</div>}
            <button className="btn btn-block" disabled={busy || code.length !== 6}>{busy ? "Checking…" : "Sign in"}</button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => { setStep("email"); setCode(""); setError(null); }}>Use a different email</button>
          </form>
        )}

        {step === "done" && (
          <div className="stack">
            {partners.length > 0 && (
              <ul className="list">
                {partners.map((p) => <li key={p.href}><span>🤝 {p.name}</span><a href={p.href}>Partner dashboard</a></li>)}
              </ul>
            )}
            {list.length || partners.length ? (
              <>
                {list.length > 0 && <div className="ok small">You&apos;re in. These are saved on this device under &quot;Your celebrations&quot; too.</div>}
                <ul className="list">
                  {list.map((h) => (
                    <li key={h.slug}><span>{h.title}</span><a href={`/h/${h.slug}?key=${encodeURIComponent(h.key)}`}>Open dashboard</a></li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="panel">
                <p>We couldn&apos;t find any celebrations for {email}. Celebrations created before email sign-in was added need the private link. <Link href="/help?topic=host">Contact us</Link> if you&apos;re stuck.</p>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
