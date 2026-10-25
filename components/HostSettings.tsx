"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BankPicker } from "./BankPicker";

type Bank = { name: string; code: string };
type Payout = { id: number; status: string; naira: number; date: string | null };

const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "");

async function post(url: string, body: Record<string, unknown>) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Something went wrong. Try again.");
  return d;
}

/** Payouts from Paystack. Loaded only when opened, so the dashboard stays fast. */
export function Payouts({ slug, hostKey, received }: { slug: string; hostKey: string; received: number }) {
  const [list, setList] = useState<Payout[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (!opened || list) return;
    post(`/api/events/${slug}/payouts`, { key: hostKey }).then((d) => setList(d.payouts)).catch((e) => setError(e.message));
  }, [opened, list, slug, hostKey]);

  const paid = (list ?? []).filter((p) => p.status === "success").reduce((s, p) => s + p.naira, 0);

  return (
    <details className="panel settings" onToggle={(e) => setOpened((e.target as HTMLDetailsElement).open)}>
      <summary>🏦 Payouts from Paystack</summary>
      <div className="stack" style={{ marginTop: 12 }}>
        {error && <div className="error small">{error}</div>}
        {!list && !error && <p className="small muted">Asking Paystack…</p>}
        {list && (list.length === 0 ? (
          <p className="small muted">
            {received > 0
              ? "No payouts yet. Paystack pays the next working day after each payment, so payments from today or the weekend show up here then."
              : "No payouts yet. They start the working day after your first spray pack."}
          </p>
        ) : (
          <>
            <ul className="list payouts">
              {list.map((p) => (
                <li key={p.id}>
                  <span>{day(p.date)} <span className={`pill ${p.status === "success" ? "success" : "pending"}`}>{p.status === "success" ? "Paid" : p.status === "failed" ? "Failed" : "On its way"}</span></span>
                  <strong>{naira(p.naira)}</strong>
                </li>
              ))}
            </ul>
            <p className="small muted">
              {naira(paid)} paid out so far. Amounts are what Paystack sent to the bank. If a payout says failed, or nothing has arrived 2 working days
              after the party, <a href="/help?topic=payout">tell us</a> and we&apos;ll chase it with Paystack.
            </p>
          </>
        ))}
      </div>
    </details>
  );
}

/** Edit the name/date, and change the payout account, without messaging anyone. */
export function HostSettings({ slug, hostKey, title, celebrant, date, payee }: {
  slug: string; hostKey: string; title: string; celebrant: string; date: string | null; payee: string;
}) {
  const router = useRouter();
  const [details, setDetails] = useState({ title, celebrantName: celebrant, eventDate: date ?? "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [changing, setChanging] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutDone, setPayoutDone] = useState<string | null>(null);
  const [showPayout, setShowPayout] = useState(false);

  useEffect(() => {
    if (!showPayout || banks.length) return;
    fetch("/api/banks").then((r) => r.json()).then((d) => setBanks(d.banks || [])).catch(() => setPayoutError("Couldn't load the bank list. Refresh to try again."));
  }, [showPayout, banks.length]);

  useEffect(() => {
    setAccountName(null);
    if (!bankCode || !/^\d{10}$/.test(accountNumber)) return;
    const ctrl = new AbortController();
    setResolving(true);
    fetch("/api/banks/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bankCode, accountNumber }), signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => { if (d.accountName) { setAccountName(d.accountName); setPayoutError(null); } else setPayoutError(d.error); })
      .catch(() => {})
      .finally(() => setResolving(false));
    return () => ctrl.abort();
  }, [bankCode, accountNumber]);

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setDetailsError(null); setSaved(false);
    try {
      await post(`/api/events/${slug}/settings`, { key: hostKey, action: "details", ...details });
      setSaved(true);
      router.refresh();
    } catch (err) { setDetailsError((err as Error).message); } finally { setSaving(false); }
  }

  async function changePayout(e: React.FormEvent) {
    e.preventDefault();
    if (!accountName) return;
    if (!confirm(`Pay all new spray packs to ${accountName}? Packs already bought still go to ${payee}.`)) return;
    setChanging(true); setPayoutError(null);
    try {
      const d = await post(`/api/events/${slug}/settings`, { key: hostKey, action: "payout", bankCode, accountNumber });
      setPayoutDone(d.accountName);
      setShowPayout(false); setAccountNumber(""); setBankCode("");
      router.refresh();
    } catch (err) { setPayoutError((err as Error).message); } finally { setChanging(false); }
  }

  return (
    <>
      <details className="panel settings">
        <summary>✏️ Celebration details</summary>
        <form className="stack" style={{ marginTop: 12 }} onSubmit={saveDetails}>
          <label className="field"><span>Celebration name</span>
            <input className="input" required maxLength={80} value={details.title} onChange={(e) => setDetails((d) => ({ ...d, title: e.target.value }))} />
          </label>
          <label className="field"><span>Who are guests spraying?</span>
            <input className="input" required maxLength={80} value={details.celebrantName} onChange={(e) => setDetails((d) => ({ ...d, celebrantName: e.target.value }))} />
          </label>
          <label className="field"><span>Date</span>
            <input className="input" type="date" value={details.eventDate} onChange={(e) => setDetails((d) => ({ ...d, eventDate: e.target.value }))} />
            <small>We email you a checklist the day before, and your spray report the morning after.</small>
          </label>
          {detailsError && <div className="error small" role="alert">{detailsError}</div>}
          {saved && <div className="ok small" role="status">Saved.</div>}
          <button className="btn" disabled={saving}>{saving ? "Saving…" : "Save details"}</button>
        </form>
      </details>

      <details className="panel settings" open={showPayout} onToggle={(e) => setShowPayout((e.target as HTMLDetailsElement).open)}>
        <summary>🔁 Change payout account</summary>
        <form className="stack" style={{ marginTop: 12 }} onSubmit={changePayout}>
          {payoutDone && <div className="ok small">New spray packs now pay out to <strong>{payoutDone}</strong>. We&apos;ve emailed you to confirm.</div>}
          <p className="small muted">
            Right now, money goes to <strong>{payee}</strong>. A new account applies to spray packs bought from now on.
            Packs already bought still go to the old account.
          </p>
          <div className="field"><span>Bank</span>
            <BankPicker banks={banks} loading={showPayout && banks.length === 0} value={bankCode} onChange={setBankCode} />
          </div>
          <label className="field"><span>Account number</span>
            <input className="input" inputMode="numeric" autoComplete="off" placeholder="10 digits" value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} />
            <small>{resolving ? "Checking with the bank…" : "We check the name with the bank before anything changes."}</small>
          </label>
          {accountName && <div className="ok small">New payouts go to <strong>{accountName}</strong></div>}
          {payoutError && <div className="error small" role="alert">{payoutError}</div>}
          <button className="btn" disabled={!accountName || changing}>{changing ? "Changing…" : "Use this account"}</button>
        </form>
      </details>
    </>
  );
}
