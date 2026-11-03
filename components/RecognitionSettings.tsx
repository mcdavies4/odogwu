"use client";
import { useState } from "react";
import { BIG_SPRAY_LEVELS } from "@/lib/recognition";
import { naira } from "@/lib/money";

/** Host control: the ODOGWU ALERT takeover level, and whether guests' selfies show on the wall. */
export function RecognitionSettings({ slug, hostKey, bigSpray, showPhotos, mcHref }: {
  slug: string; hostKey: string; bigSpray: number; showPhotos: boolean; mcHref: string;
}) {
  const [level, setLevel] = useState(bigSpray);
  const [photos, setPhotos] = useState(showPhotos);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(nextLevel: number, nextPhotos: boolean) {
    setLevel(nextLevel);
    setPhotos(nextPhotos);
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/events/${slug}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: hostKey, action: "recognition", bigSpray: nextLevel, showPhotos: nextPhotos }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMsg({ ok: true, text: "Saved. The wall updates within a few seconds." });
    } catch (e) {
      setLevel(bigSpray);
      setPhotos(showPhotos);
      setMsg({ ok: false, text: (e as Error).message || "Couldn't save. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel stack">
      <div>
        <h2 style={{ fontSize: 20 }}>👑 Recognise the big sprayers</h2>
        <p className="small muted">
          Guests can add a selfie and their table number. Their face shows on the wall when they spray, and a big spray takes over
          the whole screen with an <strong>ODOGWU ALERT</strong>.
        </p>
      </div>
      <label className="field"><span>ODOGWU ALERT when one guest sprays</span>
        <select className="input" value={level} disabled={busy} onChange={(e) => save(Number(e.target.value), photos)}>
          {BIG_SPRAY_LEVELS.map((v) => <option key={v} value={v}>{v === 0 ? "Off" : `${naira(v)} or more`}</option>)}
        </select>
      </label>
      <label className="anon-toggle">
        <input type="checkbox" role="switch" checked={photos} disabled={busy} onChange={(e) => save(level, e.target.checked)} />
        <span className="anon-track" aria-hidden="true"><span className="anon-thumb" /></span>
        <span className="anon-text">
          <strong>Guest photos on the wall</strong>
          <small>Turn off for quiet events. Photos are deleted 3 days after the party.</small>
        </span>
      </label>
      {msg && <div className={msg.ok ? "ok small" : "error small"} role="status">{msg.text}</div>}
      <a className="btn btn-ghost btn-block" href={mcHref} target="_blank" rel="noopener">🎤 Open the MC live screen</a>
      <p className="small muted">Send that screen to your MC. It shows every spray as it lands, with the guest&apos;s table, so they can shout them out.</p>
    </section>
  );
}
