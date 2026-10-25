"use client";
import { useState } from "react";

const QUICK = ["The couple", "The bride", "The groom", "The celebrant", "Bride's family", "Groom's family", "The parents", "Everybody!"];

/** Host control: tell the whole hall who's on the floor right now. */
export function NowDancing({ slug, hostKey, initial }: { slug: string; hostKey: string; initial: string | null }) {
  const [current, setCurrent] = useState<string | null>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(value: string) {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/events/${slug}/dancing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: hostKey, text: value }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCurrent(d.nowDancing);
      setText("");
    } catch (e) {
      setError((e as Error).message || "Couldn't update. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel stack">
      <div>
        <h2 style={{ fontSize: 20 }}>💃 Now dancing</h2>
        <p className="small muted">Like the MC calling people to the floor. It shows big on the spray wall and on guests&apos; phones.</p>
      </div>
      <div className={`dancing-now${current ? " on" : ""}`} aria-live="polite">
        {current ? <>On the floor: <strong>{current}</strong></> : "Nobody set. The wall shows sprays only."}
      </div>
      <div className="chips">
        {QUICK.map((q) => (
          <button key={q} type="button" className="chip" disabled={busy} aria-pressed={current === q} onClick={() => save(q)}>{q}</button>
        ))}
      </div>
      <form className="dancing-form" onSubmit={(e) => { e.preventDefault(); if (text.trim()) save(text); }}>
        <input className="input" maxLength={50} placeholder="Or type a name, e.g. Mama Tolu" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn" disabled={busy || !text.trim()}>Show</button>
      </form>
      {current && <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => save("")}>Clear the floor</button>}
      {error && <div className="error small" role="alert">{error}</div>}
    </section>
  );
}
