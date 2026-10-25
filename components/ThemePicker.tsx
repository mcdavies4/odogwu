"use client";
import { useState } from "react";
import { THEMES, type ThemeId } from "@/lib/themes";

/** Host control: choose the spray wall's look. Premium themes unlock once per celebration. */
export function ThemePicker({ slug, hostKey, initial, unlocked, price }: {
  slug: string; hostKey: string; initial: ThemeId; unlocked: boolean; price: number;
}) {
  const [theme, setTheme] = useState<ThemeId>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = unlocked || price === 0;
  const priceLabel = "₦" + price.toLocaleString("en-NG");

  async function call(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/events/${slug}/theme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: hostKey, ...payload }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      return d;
    } catch (e) {
      setError((e as Error).message || "Couldn't update. Try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function choose(id: ThemeId) {
    const d = await call({ theme: id });
    if (d?.ok) setTheme(id);
  }

  async function unlock() {
    const d = await call({ unlock: true });
    if (d?.url) window.location.href = d.url;
    else if (d?.unlocked) window.location.reload();
  }

  return (
    <section className="panel stack">
      <div>
        <h2 style={{ fontSize: 20 }}>🎨 Wall theme</h2>
        <p className="small muted">Changes the spray wall straight away, even mid-party.</p>
      </div>
      <div className="theme-grid">
        {THEMES.map((t) => {
          const locked = t.premium && !open;
          return (
            <div key={t.id} className={`theme-card${theme === t.id ? " on" : ""}`}>
              <div className="theme-swatch" style={{ background: t.swatch[0] }} aria-hidden="true">
                <span style={{ background: t.swatch[1] }} /><span style={{ background: t.swatch[2] }} />
              </div>
              <strong>{t.name}</strong>
              <small className="muted">{t.blurb}</small>
              <div className="theme-actions">
                {theme === t.id ? (
                  <span className="pill success">In use</span>
                ) : locked ? (
                  <span className="pill">🔒 Premium</span>
                ) : (
                  <button type="button" className="chip" disabled={busy} onClick={() => choose(t.id)}>Use</button>
                )}
                <a className="small" href={`/demo/wall?theme=${t.id}`} target="_blank" rel="noopener">Preview</a>
              </div>
            </div>
          );
        })}
      </div>
      {!open && (
        <button type="button" className="btn btn-block" disabled={busy} onClick={unlock}>
          Unlock all themes for {priceLabel}
        </button>
      )}
      {!open && <p className="small muted">One-off for this celebration, paid securely through Paystack.</p>}
      {error && <div className="error small" role="alert">{error}</div>}
    </section>
  );
}
