"use client";
import { useState } from "react";

/** Type a venue name, get its personal tracking links ready to paste into an email. */
export function LinkMaker({ site }: { site: string }) {
  const [name, setName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const tag = name.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  const links = tag
    ? [
        { label: "Spray wall", url: `${site}/demo/wall?ref=${tag}` },
        { label: "Spray on phone", url: `${site}/demo?ref=${tag}` },
      ]
    : [];

  async function copy(url: string) {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="panel stack">
      <h2 style={{ fontSize: 20 }}>Make a tracking link</h2>
      <label className="field"><span>Venue name</span>
        <input className="input" placeholder="Eko Grand Hall" value={name} onChange={(e) => setName(e.target.value)} />
        <small>Use a different link for every venue you email, so you can tell who opened it.</small>
      </label>
      {links.map((l) => (
        <div key={l.url} className="link-row">
          <div>
            <strong>{l.label}</strong>
            <code>{l.url}</code>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => copy(l.url)}>{copied === l.url ? "Copied" : "Copy"}</button>
        </div>
      ))}
    </div>
  );
}
