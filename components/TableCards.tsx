"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Logo } from "./Note";
import { MAX_TABLE } from "@/lib/recognition";

type Props = { url: string; celebrant: string; title: string; payee: string; bank: string; backHref: string };

/**
 * A4 sheets of six table cards. Print, cut along the dashed lines, put one on each table.
 * Numbered cards carry the table number in their QR code, so the wall and the MC know which table is spraying.
 */
export function TableCards({ url, celebrant, title, payee, bank, backHref }: Props) {
  const [ink, setInk] = useState(false);
  const [tables, setTables] = useState(12);
  const storeKey = `odogwu:tables:${url}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      const saved = raw === null ? NaN : Number(raw);
      if (Number.isInteger(saved) && saved >= 0 && saved <= MAX_TABLE) setTables(saved);
    } catch {}
  }, [storeKey]);
  function changeTables(v: string) {
    const n = Math.max(0, Math.min(MAX_TABLE, Number(v.replace(/\D/g, "")) || 0));
    setTables(n);
    try { localStorage.setItem(storeKey, String(n)); } catch {}
  }

  const short = url.replace(/^https?:\/\//, "");
  // 0 tables = six plain cards (no numbers); otherwise one card per table.
  const cards = tables > 0 ? Array.from({ length: tables }, (_, i) => i + 1) : Array.from({ length: 6 }, () => null);

  return (
    <div className={`cards-page${ink ? " ink" : ""}`}>
      <div className="cards-controls no-print">
        <a className="btn btn-ghost" href={backHref}>Back to dashboard</a>
        <label className="field" style={{ maxWidth: 200 }}>
          <span>How many tables?</span>
          <input className="input" inputMode="numeric" value={tables} onChange={(e) => changeTables(e.target.value)} />
        </label>
        <label className="ink-toggle">
          <input type="checkbox" checked={ink} onChange={(e) => setInk(e.target.checked)} /> Ink saver (white background)
        </label>
        <button type="button" className="btn" onClick={() => window.print()}>Print {tables > 0 ? `${tables} cards` : "cards"}</button>
        <p className="small muted">
          {tables > 0
            ? "Each card is numbered and its QR code carries the table number, so the spray wall and the MC can call out which table is spraying. Six cards per A4 page."
            : "Plain cards with no table numbers. Six per A4 page: print as many pages as you have tables."}
        </p>
      </div>
      <div className="card-sheet">
        {cards.map((n, i) => {
          const link = n ? `${url}?t=${n}` : url;
          return (
            <article className="table-card" key={n ?? `plain-${i}`}>
              <div className="tc-brand"><Logo /> ODOGWU{n ? <span className="tc-table">TABLE {n}</span> : null}</div>
              <p className="tc-scan">Scan to spray</p>
              <h2 className="tc-name">{celebrant}</h2>
              <p className="tc-title">{title}</p>
              <div className="tc-qr">
                <QRCodeSVG value={link} size={150} bgColor="#ffffff" fgColor="#2a0820" level="M" marginSize={0} />
              </div>
              <p className="tc-how">{n ? "Add your selfie · your face goes on the big screen" : "No cash needed · Card, transfer or USSD"}</p>
              <p className="tc-payee">Money goes to <strong>{payee}</strong> ({bank}). Check your phone shows this name before you pay.</p>
              <p className="tc-url">{short}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
