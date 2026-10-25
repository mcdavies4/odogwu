"use client";
import { useState } from "react";
import { CopyLink } from "./CopyLink";

type Done = { dashboard: string; clientLink: string; share: number } | { existing: true };

export function PartnerSignup() {
  const [kind, setKind] = useState<"venue" | "planner">("venue");
  const [form, setForm] = useState({ name: "", city: "", person: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/partners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, kind }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setDone(d);
    } catch (err) {
      setError((err as Error).message || "Couldn't sign you up. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done && "existing" in done) {
    return <div className="ok">You&apos;re already a partner with <strong>{form.email}</strong>. We&apos;ve emailed your dashboard link and client link again. Check your spam folder too.</div>;
  }
  if (done) {
    return (
      <div className="stack">
        <div className="ok"><strong>You&apos;re in. 🎉</strong> We&apos;ve also emailed these to {form.email}.</div>
        <CopyLink label="Your link for clients" url={done.clientLink} note="Send this to celebrants. Celebrations made with it count towards your share." />
        <CopyLink label="Your private dashboard" url={done.dashboard} note="Keep this to yourself. It shows every celebration and what you've earned." />
        <a className="btn btn-block" href={done.dashboard}>Open my dashboard</a>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={submit}>
      <div className="seg" role="group" aria-label="I am">
        <button type="button" aria-pressed={kind === "venue"} onClick={() => setKind("venue")}>🏛️ Event centre</button>
        <button type="button" aria-pressed={kind === "planner"} onClick={() => setKind("planner")}>📋 Event planner</button>
      </div>
      <label className="field"><span>{kind === "venue" ? "Venue name" : "Business name"}</span>
        <input className="input" required maxLength={80} placeholder={kind === "venue" ? "Grand Hall, Wuse 2" : "Ada Events"} value={form.name} onChange={set("name")} />
      </label>
      <label className="field"><span>City</span>
        <input className="input" maxLength={60} placeholder="Abuja" value={form.city} onChange={set("city")} />
      </label>
      <label className="field"><span>Your name</span>
        <input className="input" required maxLength={60} autoComplete="name" value={form.person} onChange={set("person")} />
      </label>
      <label className="field"><span>Email</span>
        <input className="input" type="email" inputMode="email" autoComplete="email" required value={form.email} onChange={set("email")} />
        <small>We send your dashboard here, and you sign in with it.</small>
      </label>
      <label className="field"><span>Phone or WhatsApp</span>
        <input className="input" type="tel" inputMode="tel" autoComplete="tel" required placeholder="0803 000 0000" value={form.phone} onChange={set("phone")} />
      </label>
      {error && <div className="error small" role="alert">{error}</div>}
      <button className="btn btn-block" disabled={busy}>{busy ? "Setting you up…" : "Become a partner"}</button>
      <p className="small muted center">Free. By signing up you agree to our <a href="/terms" target="_blank" rel="noopener">Terms</a>.</p>
    </form>
  );
}
