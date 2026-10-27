"use client";
import { useState } from "react";

/** Sends a deletion request to the help inbox (topic "delete"); you get an email and it shows in /admin/inbox. */
export function DeleteRequest() {
  const [form, setForm] = useState({ who: "host", email: "", event: "", reference: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const message = `Please delete my Odogwu data. I'm a ${form.who}.${form.event ? ` Celebration: ${form.event}.` : ""}`;
      const r = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "delete", email: form.email, event: form.event, reference: form.reference, message }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setDone(d.ticket ?? null);
    } catch (err) {
      setError((err as Error).message || "Couldn't send. Please email us instead.");
    } finally {
      setBusy(false);
    }
  }

  if (done !== undefined) {
    return <div className="ok" role="status"><strong>Request received{done ? ` (#${done})` : ""}.</strong> We&apos;ve emailed {form.email} to confirm. We may reply to check it&apos;s really you before we delete anything.</div>;
  }
  return (
    <form className="stack" onSubmit={send}>
      <label className="field"><span>I am a</span>
        <select className="input" value={form.who} onChange={set("who")}>
          <option value="host">Host or celebrant</option>
          <option value="partner">Partner (venue or planner)</option>
          <option value="guest">Guest who sprayed</option>
        </select>
      </label>
      <label className="field"><span>Email you used with Odogwu</span>
        <input className="input" type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
      </label>
      <label className="field"><span>Celebration name (optional)</span>
        <input className="input" maxLength={160} value={form.event} onChange={set("event")} />
      </label>
      {form.who === "guest" && (
        <label className="field"><span>Payment reference (optional)</span>
          <input className="input" placeholder="odg_…" value={form.reference} onChange={set("reference")} />
          <small>It&apos;s in your Paystack receipt email and helps us find your spray packs.</small>
        </label>
      )}
      {error && <div className="error small" role="alert">{error}</div>}
      <button className="btn btn-block" disabled={busy}>{busy ? "Sending…" : "Request deletion"}</button>
    </form>
  );
}
