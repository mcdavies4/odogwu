"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Admin: change a partner's share in place (0–5%). */
export function ShareEdit({ slug, adminKey, pct }: { slug: string; adminKey: string; pct: number }) {
  const router = useRouter();
  const [v, setV] = useState(String(pct));
  const [busy, setBusy] = useState(false);
  const dirty = Number(v) !== pct;
  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
      <input className="input" style={{ width: 64, minHeight: 36, padding: "0 8px" }} inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} aria-label="Share percent" />%
      {dirty && (
        <button type="button" className="chip" disabled={busy} onClick={async () => {
          setBusy(true);
          const r = await fetch("/api/admin/venues", { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify({ slug, sharePercent: Number(v) }) });
          setBusy(false);
          if (!r.ok) alert((await r.json().catch(() => ({}))).error || "Couldn't save");
          router.refresh();
        }}>Save</button>
      )}
    </span>
  );
}
