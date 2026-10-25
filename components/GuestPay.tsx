"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MIN_PACK_NAIRA, PACKS_NAIRA, naira, compactNaira, serviceFee } from "@/lib/money";
import { COUNTRIES, flagOf } from "@/lib/countries";

export function GuestPay({ slug, celebrant, feePct, feeFlat }: { slug: string; celebrant: string; feePct: number; feeFlat: number }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pack, setPack] = useState<number>(5000);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resume, setResume] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [abroad, setAbroad] = useState(false);
  const [from, setFrom] = useState("");

  useEffect(() => {
    try {
      setName(localStorage.getItem("odogwu:name") || "");
      setResume(localStorage.getItem(`odogwu:ref:${slug}`));
      const savedFrom = localStorage.getItem("odogwu:from");
      if (savedFrom) { setAbroad(true); setFrom(savedFrom); }
    } catch {}
  }, [slug]);

  const amount = custom ? Number(custom) : pack;
  const fee = serviceFee(amount, feePct, feeFlat);
  const valid = (anonymous || name.trim().length > 0) && amount >= MIN_PACK_NAIRA && amount % 100 === 0 && (!abroad || !!from);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, guestName: name, guestEmail: email, packNaira: amount, anonymous, from: abroad ? from : undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      try {
        if (!anonymous) localStorage.setItem("odogwu:name", name.trim());
        if (abroad && from) localStorage.setItem("odogwu:from", from); else localStorage.removeItem("odogwu:from");
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

      <label className="anon-toggle">
        <input type="checkbox" role="switch" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
        <span className="anon-track" aria-hidden="true"><span className="anon-thumb" /></span>
        <span className="anon-text">
          <strong>Spray anonymously 🤫</strong>
          <small>You&apos;ll show on the wall as &quot;Secret Odogwu&quot;. Your name won&apos;t appear on screen.</small>
        </span>
      </label>

      <label className="field"><span>{anonymous ? "Your name (optional)" : "Your name"}</span>
        <input className="input" required={!anonymous} maxLength={40}
          placeholder={anonymous ? "Only the celebrant will see it" : "Shows on the spray wall"}
          value={name} onChange={(e) => setName(e.target.value)} />
        {anonymous && <small>Only {celebrant} sees it, in their private thank-you list. Leave it blank to stay completely anonymous.</small>}
      </label>

      <label className="anon-toggle">
        <input type="checkbox" role="switch" checked={abroad} onChange={(e) => setAbroad(e.target.checked)} />
        <span className="anon-track" aria-hidden="true"><span className="anon-thumb" /></span>
        <span className="anon-text">
          <strong>I&apos;m spraying from abroad ✈️</strong>
          <small>Not at the party? Spray from wherever you are. {anonymous ? "Your flag stays hidden while you're anonymous." : "Your flag shows next to your name."}</small>
        </span>
      </label>
      {abroad && (
        <div className="panel stack abroad-panel">
          <label className="field"><span>Where are you?</span>
            <select className="input" value={from} onChange={(e) => setFrom(e.target.value)} required>
              <option value="">Choose your country</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{flagOf(c.code)} {c.name}</option>)}
            </select>
          </label>
          <a className="btn btn-ghost btn-block" href={`/e/${slug}/wall`} target="_blank" rel="noopener">📺 Watch the spray wall live</a>
          <p className="small muted">Paying with a card from outside Nigeria? It works. Your bank converts from naira and may add its own small charge.</p>
        </div>
      )}

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
          <span className="muted">Odogwu service fee ({feePct}% + {naira(feeFlat)})</span><span className="muted">{naira(fee)}</span>
          <span className="total">You pay</span><span className="total">{naira(amount + fee)}</span>
          <span className="small muted fee-note">
            {celebrant} receives the full {naira(amount)}. The service fee covers card and bank charges and keeps Odogwu running.{" "}
            <a href="/#fees" target="_blank" rel="noopener">How fees work</a>
          </span>
        </div>
      )}

      {error && <div className="error" role="alert">{error}</div>}

      <button className="btn btn-block" disabled={!valid || busy}>
        {busy ? "Opening payment…" : `Pay ${naira(amount + fee)} and start spraying`}
      </button>
      <p className="small muted center">
        Card, bank transfer or USSD, secured by Paystack. Spray packs are gifts to the celebrant and can&apos;t be refunded.
        By paying you agree to our <a href="/terms" target="_blank" rel="noopener">Terms</a>.
      </p>
    </form>
  );
}
