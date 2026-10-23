"use client";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

export function ShareQR({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const text = `Spray ${title} from your phone on Odogwu`;
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="qr-big">
      <QRCodeSVG value={url} size={220} bgColor="#fcefd9" fgColor="#2a0820" level="M" marginSize={0} />
      <p>Scan to spray {title}</p>
      <div className="row" style={{ width: "100%" }}>
        <button className="btn" onClick={share} type="button">{copied ? "Link copied" : "Share guest link"}</button>
        <button className="btn btn-ghost" style={{ color: "var(--wine)", borderColor: "rgba(42,8,32,.3)" }} onClick={() => window.print()} type="button">Print QR</button>
      </div>
    </div>
  );
}
