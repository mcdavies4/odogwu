"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MIN_PACK_NAIRA, PACKS_NAIRA, naira, compactNaira } from "@/lib/money";

export function GuestPay({ slug, celebrant, feePct }: { slug: string; celebrant: string; feePct: number }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pack, setPack] = useState<number>(5000);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resume, setResume] = useState<string | null>(null);

  useEffect(() => {
    try {
      setName(localStorage.getItem("odogwu:name") || "");
      setResume(localStorage.getItem(`odogwu:ref:${slug}`));
    } catch {}
  }, [slug]);

  const amount = custom ? Number(custom) : pack;
  const fee = Math.ceil(amount * (feePct / 100));
  const valid = name.trim().length > 0 && amount >= MIN_PACK_NAIRA && amount % 100 === 0;

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, guestName: name, guestEmail: email, packNaira: amount }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      try {
        localStorage.setItem("odogwu:name", name.trim());
        localStorage.setItem(`odogwu:ref:${slug}`, d.reference);
      } catch {}
      window.location.href = d.url;
    } catch (err) {
      setError((err as Error).message || "Couldn't start the payment. Try again.");
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={pay}>
      {resume && (
        <Link href={`/e/${slug}/spray?reference=${resume}`} className="btn btn-ghost btn-block">
          Continue spraying your last pack
        </Link>
      )}

      <label className="field"><span>Your name</span>
        <input className="input" required maxLength={40} placeholder="Shows on the spray wall" value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: 8 }}>How much do you want to spray?</legend>
        <div className="packs">
          {PACKS_NAIRA.map((p) => (
            <button key={p} type="button" className="pack" aria-pressed={!custom && pack === p} onClick={() => { setPack(p); setCustom(""); }}>
              {compactNaira(p)}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="field"><span>Or enter an amount</span>
        <input className="input" inputMode="numeric" placeholder={`From ₦${MIN_PACK_NAIRA.toLocaleString()}`} value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 7))} />
        {custom && amount % 100 !== 0 && <small>Use ₦100 steps.</small>}
      </label>

      <label className="field"><span>Email for your receipt (optional)</span>
        <input className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      {amount >= MIN_PACK_NAIRA && (
        <div className="panel summary">
          <span>Spray pack for {celebrant}</span><span>{naira(amount)}</span>
          <span className="muted">Service fee ({feePct}%)</span><span className="muted">{naira(fee)}</span>
          <span className="total">You pay</span><span className="total">{naira(amount + fee)}</span>
        </div>
      )}

      {error && <div className="error" role="alert">{error}</div>}

      <button className="btn btn-block" disabled={!valid || busy}>
        {busy ? "Opening payment…" : `Pay ${naira(amount + fee)} and start spraying`}
      </button>
      <p className="small muted center">Card, bank transfer or USSD, secured by Paystack.</p>
    </form>
  );
}
