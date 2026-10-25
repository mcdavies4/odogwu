"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Note";

type Hosted = { slug: string; key: string; title: string };
type Partner = { name: string; href: string };

/**
 * Where the magic link lands. Signing in needs a tap, so email security scanners
 * that "click" links automatically can't use up the one-time link.
 */
export default function MagicLink() {
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<Hosted[] | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t");
    setToken(t);
    // Take the token out of the address bar and browser history.
    if (t) window.history.replaceState(null, "", "/host/login/link");
  }, []);

  async function signIn() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/host/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const found: Hosted[] = d.celebrations ?? [];
      try {
        const saved = JSON.parse(localStorage.getItem("odogwu:hosted") || "[]") as Hosted[];
        localStorage.setItem("odogwu:hosted", JSON.stringify([...found, ...saved.filter((s) => !found.some((f) => f.slug === s.slug))].slice(0, 30)));
      } catch {}
      const ps: Partner[] = d.partners ?? [];
      if (found.length === 1 && !ps.length) {
        window.location.replace(`/h/${found[0].slug}?key=${encodeURIComponent(found[0].key)}`);
        return;
      }
      if (!found.length && ps.length === 1) {
        window.location.replace(ps[0].href);
        return;
      }
      setPartners(ps);
      setList(found);
    } catch (e) {
      setError((e as Error).message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="topbar"><Link href="/" className="brand"><Logo />Odogwu</Link></header>
      <main className="wrap stack center" style={{ minHeight: "70dvh", display: "grid", alignContent: "center", justifyItems: "center" }}>
        {list ? (
          <div className="stack" style={{ width: "100%", textAlign: "left" }}>
            <h1 style={{ fontSize: 28 }}>You&apos;re in</h1>
            {partners.length > 0 && (
              <ul className="list">
                {partners.map((p) => <li key={p.href}><span>🤝 {p.name}</span><a href={p.href}>Partner dashboard</a></li>)}
              </ul>
            )}
            {list.length ? (
              <ul className="list">
                {list.map((h) => <li key={h.slug}><span>{h.title}</span><a href={`/h/${h.slug}?key=${encodeURIComponent(h.key)}`}>Open dashboard</a></li>)}
              </ul>
            ) : (
              <p className="muted">{partners.length ? "No celebrations of your own yet." : "There are no celebrations for this email yet."} <Link href="/host/new">Create one</Link>.</p>
            )}
          </div>
        ) : token === null ? (
          <p className="muted">Loading…</p>
        ) : !token ? (
          <>
            <h1 style={{ fontSize: 28 }}>This link is incomplete</h1>
            <p className="muted">Open the link straight from your email, or ask for a new one.</p>
            <Link className="btn" href="/host/login">Get a new sign-in link</Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 30 }}>Sign in to Odogwu</h1>
            <p className="muted">Tap below to open your celebrations on this device.</p>
            {error && <div className="error small" role="alert">{error}</div>}
            <button type="button" className="btn btn-block" style={{ maxWidth: 360 }} disabled={busy} onClick={signIn}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
            {error && <Link href="/host/login">Get a new sign-in link</Link>}
          </>
        )}
      </main>
    </>
  );
}
