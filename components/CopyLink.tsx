"use client";
import { useState } from "react";

/** A link shown in full with a Copy button. */
export function CopyLink({ label, url, note }: { label: string; url: string; note?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="link-row">
      <div>
        <strong>{label}</strong>
        <code>{url}</code>
        {note && <small className="muted">{note}</small>}
      </div>
      <button type="button" className="btn btn-ghost" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
    </div>
  );
}
