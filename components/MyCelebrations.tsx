"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Hosted = { slug: string; key: string; title: string };
const STORE = "odogwu:hosted";

function read(): Hosted[] {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) || "[]");
    return Array.isArray(v) ? v.filter((h) => h && h.slug && h.key) : [];
  } catch {
    return [];
  }
}

/** Saves this host dashboard on the phone so the installed app can reopen it. */
export function RememberHost({ slug, hostKey, title }: { slug: string; hostKey: string; title: string }) {
  useEffect(() => {
    try {
      const rest = read().filter((h) => h.slug !== slug);
      localStorage.setItem(STORE, JSON.stringify([{ slug, key: hostKey, title }, ...rest].slice(0, 20)));
    } catch {}
  }, [slug, hostKey, title]);
  return null;
}

/** "Your celebrations" — shown on the home screen when this phone has hosted before. */
export function MyCelebrations() {
  const [list, setList] = useState<Hosted[]>([]);
  useEffect(() => setList(read()), []);
  if (!list.length) return null;
  return (
    <section className="section" style={{ paddingBottom: 0 }}>
      <div className="panel stack">
        <h2 style={{ fontSize: 22, marginBottom: 0 }}>Your celebrations</h2>
        <ul className="list">
          {list.map((h) => (
            <li key={h.slug}>
              <span>{h.title}</span>
              <Link href={`/h/${h.slug}?key=${h.key}`}>Open dashboard</Link>
            </li>
          ))}
        </ul>
        <p className="small muted">Not here? <Link href="/host/login">Sign in with your email</Link>.</p>
      </div>
    </section>
  );
}
