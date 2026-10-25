"use client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Logo } from "./Note";

type Props = { url: string; celebrant: string; title: string; payee: string; bank: string; backHref: string };

/** A4 sheet of six table cards. Print it, cut along the dashed lines, put one on each table. */
export function TableCards({ url, celebrant, title, payee, bank, backHref }: Props) {
  const [ink, setInk] = useState(false);
  const short = url.replace(/^https?:\/\//, "");
  return (
    <div className={`cards-page${ink ? " ink" : ""}`}>
      <div className="cards-controls no-print">
        <a className="btn btn-ghost" href={backHref}>Back to dashboard</a>
        <label className="ink-toggle">
          <input type="checkbox" checked={ink} onChange={(e) => setInk(e.target.checked)} /> Ink saver (white background)
        </label>
        <button type="button" className="btn" onClick={() => window.print()}>Print cards</button>
        <p className="small muted">Six cards per A4 page. Print as many pages as you have tables, then cut along the dashed lines.</p>
      </div>
      <div className="card-sheet">
        {Array.from({ length: 6 }, (_, i) => (
          <article className="table-card" key={i}>
            <div className="tc-brand"><Logo /> ODOGWU</div>
            <p className="tc-scan">Scan to spray</p>
            <h2 className="tc-name">{celebrant}</h2>
            <p className="tc-title">{title}</p>
            <div className="tc-qr">
              <QRCodeSVG value={url} size={150} bgColor="#ffffff" fgColor="#2a0820" level="M" marginSize={0} />
            </div>
            <p className="tc-how">No cash needed · Card, transfer or USSD</p>
            <p className="tc-payee">Money goes to <strong>{payee}</strong> ({bank}). Check your phone shows this name before you pay.</p>
            <p className="tc-url">{short}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
