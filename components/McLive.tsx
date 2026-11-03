"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { naira, compactNaira } from "@/lib/money";
import { displayName } from "@/lib/hype";
import { initials } from "@/lib/recognition";

export type McSpray = { id: number; payment_id: string; guest_name: string; amount_naira: number; created_at: string; table_no?: number | null; photo_url?: string | null };
type Card = { key: number; who: string; name: string; paymentId: string; amount: number; table: number | null; photo: string | null; at: number };

const COLUMNS = "id,payment_id,guest_name,amount_naira,created_at,table_no,photo_url";
const BASIC = "id,payment_id,guest_name,amount_naira,created_at";
const STREAK_MS = 12_000;

function ago(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

/**
 * The MC's live shout-out screen, on their phone: who just sprayed, from which table, how much,
 * so they can call it out on the mic. Big sprays are marked and buzz the phone.
 */
export function McLive({ eventId, slug, hostKey, title, celebrant, bigSpray, showPhotos, initial }: {
  eventId: string; slug: string; hostKey: string; title: string; celebrant: string; bigSpray: number; showPhotos: boolean; initial: McSpray[];
}) {
  const [sprays, setSprays] = useState<McSpray[]>(initial);
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [confirming, setConfirming] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const seen = useRef(new Set(initial.map((s) => s.id)));
  const lastId = useRef(initial.length ? Math.max(...initial.map((s) => s.id)) : 0);
  const buzzed = useRef(new Set<string>());
  const primed = useRef(false);

  // Live: realtime first, with a catch-up poll for patchy venue Wi-Fi.
  useEffect(() => {
    const sb = supabaseBrowser();
    const add = (rows: McSpray[]) => {
      const fresh = rows.filter((r) => !seen.current.has(r.id));
      if (!fresh.length) return;
      fresh.forEach((r) => { seen.current.add(r.id); lastId.current = Math.max(lastId.current, r.id); });
      setSprays((prev) => [...prev, ...fresh].slice(-3000));
    };
    const channel = sb
      .channel(`mc:${eventId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sprays", filter: `event_id=eq.${eventId}` }, (p) => add([p.new as McSpray]))
      .subscribe();
    let cols = COLUMNS;
    const poll = setInterval(async () => {
      const q = () => sb.from("sprays").select(cols).eq("event_id", eventId).gt("id", lastId.current).order("id", { ascending: true }).limit(500);
      let { data, error } = await q();
      if (error && cols === COLUMNS) { cols = BASIC; ({ data } = await q()); }
      if (data?.length) add(data as unknown as McSpray[]);
    }, 6000);
    const tick = setInterval(() => setNow(Date.now()), 10_000);
    return () => { sb.removeChannel(channel); clearInterval(poll); clearInterval(tick); };
  }, [eventId]);

  // Keep the MC's phone awake.
  useEffect(() => {
    type Sentinel = { release: () => Promise<void> };
    let lock: Sentinel | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<Sentinel> } };
    const grab = async () => { try { if (nav.wakeLock && document.visibilityState === "visible") lock = await nav.wakeLock.request("screen"); } catch {} };
    void grab();
    const again = () => { if (document.visibilityState === "visible") void grab(); };
    document.addEventListener("visibilitychange", again);
    return () => { document.removeEventListener("visibilitychange", again); void lock?.release().catch(() => {}); };
  }, []);

  // Streaks: one card per guest while they keep spraying, newest on top.
  const cards = useMemo(() => {
    const out: Card[] = [];
    const open = new Map<string, Card>();
    for (const s of [...sprays].sort((a, b) => a.id - b.id)) {
      const who = s.guest_name.trim().toLowerCase();
      const at = new Date(s.created_at).getTime();
      const c = open.get(who);
      if (c && at - c.at < STREAK_MS) {
        c.amount += s.amount_naira;
        c.at = at;
        c.table = s.table_no ?? c.table;
        c.photo = s.photo_url ?? c.photo;
      } else {
        const card: Card = { key: s.id, who, name: displayName(s.guest_name), paymentId: s.payment_id, amount: s.amount_naira, table: s.table_no ?? null, photo: s.photo_url ?? null, at };
        open.set(who, card);
        out.push(card);
      }
    }
    return out.reverse().slice(0, 40);
  }, [sprays]);

  // Buzz the MC's phone for a big spray, once per streak.
  useEffect(() => {
    if (!bigSpray) return;
    if (!primed.current) { // sprays from before the page opened don't buzz
      primed.current = true;
      cards.forEach((c) => buzzed.current.add(`${c.key}`));
      return;
    }
    for (const c of cards.slice(0, 5)) {
      const id = `${c.key}`;
      if (c.amount >= bigSpray && !buzzed.current.has(id)) {
        buzzed.current.add(id);
        try { navigator.vibrate?.([200, 80, 200]); } catch {}
      }
    }
  }, [cards, bigSpray]);

  const total = useMemo(() => sprays.reduce((s, r) => s + r.amount_naira, 0), [sprays]);
  const top = useMemo(() => {
    const m = new Map<string, { name: string; amt: number; table: number | null }>();
    for (const s of sprays) {
      const k = s.guest_name.trim().toLowerCase();
      const cur = m.get(k) ?? { name: displayName(s.guest_name), amt: 0, table: null };
      cur.amt += s.amount_naira;
      cur.table = s.table_no ?? cur.table;
      m.set(k, cur);
    }
    return [...m.values()].sort((a, b) => b.amt - a.amt).slice(0, 5);
  }, [sprays]);
  const tables = useMemo(() => {
    const m = new Map<number, number>();
    for (const s of sprays) if (s.table_no) m.set(s.table_no, (m.get(s.table_no) ?? 0) + s.amount_naira);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [sprays]);

  async function removePhoto(c: Card) {
    if (confirming !== c.paymentId) { setConfirming(c.paymentId); return; }
    setConfirming(null);
    setError(null);
    try {
      const r = await fetch(`/api/events/${slug}/photo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: hostKey, paymentId: c.paymentId }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setRemoved((s) => new Set(s).add(c.who));
    } catch (e) {
      setError((e as Error).message || "Couldn't remove the photo. Try again.");
    }
  }

  const pic = (url: string | null, who: string) => (showPhotos && url && !removed.has(who) ? url : null);

  return (
    <main className="mc-live">
      <div className="mc-head">
        <div>
          <p className="small muted">🎤 MC live · {title}</p>
          <h1 style={{ fontSize: 24 }}>Sprayed on {celebrant}</h1>
        </div>
        <div className="mc-total">{naira(total)}</div>
      </div>
      <p className="small muted" style={{ marginTop: 6 }}>
        Call out the names as they come in. {bigSpray ? <>Gold cards are big sprays of {naira(bigSpray)}+ and buzz your phone.</> : null}
      </p>
      {error && <div className="error small" role="alert">{error}</div>}

      {cards.length === 0 ? (
        <div className="panel" style={{ marginTop: 14 }}><p>Nobody has sprayed yet. Invite the first guest to scan the QR on their table!</p></div>
      ) : (
        <ul className="mc-feed" aria-live="polite">
          {cards.map((c) => {
            const photo = pic(c.photo, c.who);
            const big = !!bigSpray && c.amount >= bigSpray;
            return (
              <li key={c.key} className={`mc-item${big ? " big" : ""}`}>
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="mc-avatar avatar" src={photo} alt="" />
                ) : (
                  <span className="mc-avatar avatar avatar-initials" aria-hidden="true">{c.name.includes("Secret") ? "🤫" : initials(c.name)}</span>
                )}
                <div>
                  <div className="mc-name">{c.name}{big && <span className="mc-badge">BIG SPRAY</span>}</div>
                  <div className="mc-meta">{c.table ? `Table ${c.table} · ` : ""}{ago(now - c.at)}</div>
                  {photo && (
                    <button type="button" className="mc-remove" onClick={() => removePhoto(c)}>
                      {confirming === c.paymentId ? "Tap again to remove this photo" : "Remove photo"}
                    </button>
                  )}
                </div>
                <div className="mc-amt">{compactNaira(c.amount)}</div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mc-cols">
        <section className="panel">
          <h2 style={{ fontSize: 17 }}>👑 Top sprayers</h2>
          <ol>{top.map((t, i) => <li key={t.name}><span>{i + 1}. {t.name}{t.table ? ` (T${t.table})` : ""}</span><b>{compactNaira(t.amt)}</b></li>)}</ol>
        </section>
        <section className="panel">
          <h2 style={{ fontSize: 17 }}>🏆 Top tables</h2>
          {tables.length ? (
            <ol>{tables.map(([t, amt], i) => <li key={t}><span>{i + 1}. Table {t}</span><b>{compactNaira(amt)}</b></li>)}</ol>
          ) : (
            <p className="small muted">Tables show here when guests scan numbered table cards.</p>
          )}
        </section>
      </div>
    </main>
  );
}
