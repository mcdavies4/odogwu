"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Note";

type Bank = { name: string; code: string };

export default function NewCelebration() {
  const router = useRouter();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [form, setForm] = useState({ title: "", celebrantName: "", eventDate: "", bankCode: "", accountNumber: "", hostPhone: "" });
  const [accountName, setAccountName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/banks").then((r) => r.json()).then((d) => setBanks(d.banks || [])).catch(() => setError("Couldn't load the bank list. Refresh to try again."));
  }, []);

  // Check the account name as soon as we have a bank and 10 digits.
  useEffect(() => {
    setAccountName(null);
    if (!form.bankCode || !/^\d{10}$/.test(form.accountNumber)) return;
    const ctrl = new AbortController();
    setResolving(true);
    fetch("/api/banks/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankCode: form.bankCode, accountNumber: form.accountNumber }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((d) => { if (d.accountName) { setAccountName(d.accountName); setError(null); } else setError(d.error); })
      .catch(() => {})
      .finally(() => setResolving(false));
    return () => ctrl.abort();
  }, [form.bankCode, form.accountNumber]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: k === "accountNumber" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const r = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      try {
        const saved = JSON.parse(localStorage.getItem("odogwu:hosted") || "[]");
        localStorage.setItem("odogwu:hosted", JSON.stringify([{ slug: d.slug, key: d.hostKey, title: form.title }, ...saved].slice(0, 20)));
      } catch {}
      router.push(`/h/${d.slug}?key=${d.hostKey}`);
    } catch (err) {
      setError((err as Error).message || "Couldn't create the celebration.");
      setSaving(false);
    }
  }

  return (
    <>
      <header className="topbar"><Link href="/" className="brand"><Logo />Odogwu</Link></header>
      <main className="wrap">
        <form className="stack" onSubmit={submit}>
          <h1 style={{ fontSize: 32 }}>Create a celebration</h1>
          <p className="muted">Guests will see these details when they scan your code.</p>

          <label className="field"><span>Celebration name</span>
            <input className="input" required maxLength={80} placeholder="Tolu & Chidi's wedding" value={form.title} onChange={set("title")} />
          </label>
          <label className="field"><span>Who are guests spraying?</span>
            <input className="input" required maxLength={80} placeholder="The couple" value={form.celebrantName} onChange={set("celebrantName")} />
          </label>
          <label className="field"><span>Date</span>
            <input className="input" type="date" value={form.eventDate} onChange={set("eventDate")} />
          </label>

          <div className="panel stack">
            <h2 style={{ fontSize: 20 }}>Where should the money go?</h2>
            <label className="field"><span>Bank</span>
              <select className="input" required value={form.bankCode} onChange={set("bankCode")}>
                <option value="">{banks.length ? "Choose your bank" : "Loading banks…"}</option>
                {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </label>
            <label className="field"><span>Account number</span>
              <input className="input" required inputMode="numeric" autoComplete="off" placeholder="10 digits" value={form.accountNumber} onChange={set("accountNumber")} />
              <small>{resolving ? "Checking with your bank…" : "Payouts land here the next working day."}</small>
            </label>
            {accountName && <div className="ok">Paying out to <strong>{accountName}</strong></div>}
          </div>

          <label className="field"><span>Your phone number (optional)</span>
            <input className="input" type="tel" inputMode="tel" placeholder="0803 000 0000" value={form.hostPhone} onChange={set("hostPhone")} />
          </label>

          {error && <div className="error" role="alert">{error}</div>}

          <button className="btn btn-block" disabled={!accountName || saving}>
            {saving ? "Creating…" : "Create celebration"}
          </button>
          <p className="small muted center">Payments are processed and settled by Paystack. Odogwu never holds your money.</p>
        </form>
      </main>
    </>
  );
}
