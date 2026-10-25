"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CopyLink } from "./CopyLink";

/** Admin form: add a venue partner and get their two links. */
export function VenueAdmin({ adminKey }: { adminKey: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", city: "", contact: "", sharePercent: "1" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [made, setMade] = useState<{ dashboard: string; clientLink: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ ...form, sharePercent: Number(form.sharePercent) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMade(d);
      setForm({ name: "", city: "", contact: "", sharePercent: form.sharePercent });
      router.refresh();
    } catch (err) {
      setError((err as Error).message || "Couldn't add the venue.");
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="panel stack">
      <h2 style={{ fontSize: 20 }}>Add a venue partner</h2>
      <form className="stack" onSubmit={submit}>
        <label className="field"><span>Venue name</span><input className="input" required maxLength={80} placeholder="Eko Grand Hall" value={form.name} onChange={set("name")} /></label>
        <div className="row">
          <label className="field"><span>City</span><input className="input" maxLength={60} placeholder="Abuja" value={form.city} onChange={set("city")} /></label>
          <label className="field"><span>Their share (% of packs)</span><input className="input" inputMode="decimal" value={form.sharePercent} onChange={set("sharePercent")} /></label>
        </div>
        <label className="field"><span>Contact (phone or email)</span><input className="input" maxLength={120} value={form.contact} onChange={set("contact")} /></label>
        {error && <div className="error small" role="alert">{error}</div>}
        <button className="btn" disabled={busy || !form.name.trim()}>{busy ? "Adding…" : "Add venue"}</button>
      </form>
      {made && (
        <div className="stack">
          <div className="ok small">Venue added. Send them both links. The dashboard link is private.</div>
          <CopyLink label="Their private dashboard" url={made.dashboard} />
          <CopyLink label="Link for their clients" url={made.clientLink} note="Celebrations created with this link count towards their share." />
        </div>
      )}
    </div>
  );
}
