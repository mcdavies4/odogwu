"use client";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabaseBrowser } from "@/lib/supabase";
import { naira, compactNaira } from "@/lib/money";
import { crossedMilestone, displayName, kindOf, lineFor, tierFor } from "@/lib/hype";
import { chime, disableSound, enableSound, horn, swish } from "@/lib/wallSound";
import { FlutterNote } from "./FlutterNote";
import { NoteImg } from "./Note";
import { useLive } from "@/lib/useLive";
import type { ThemeId } from "@/lib/themes";

export type Spray = { id: number; guest_name: string; amount_naira: number; created_at: string };
type Falling = { key: number; amount: number; left: number; delay: number };
type Callout = { key: number; name: string; amount: number; tier: number; line: string };
type Milestone = { key: number; amount: number };

const MAX_FALLING = 40;
const PILE_SIZE = 90;
const BURST_WINDOW_MS = 7000;
const CALLOUT_MS = 3600;
const FLUSH_MS = 250;
const NEW_PER_FLUSH = 8;

// Deterministic pseudo-random from a spray id, so server and browser draw the same pile.
function hash(n: number) {
  let x = (n ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967295;
}

function useCountUp(target: number) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    const dur = Math.min(1600, 300 + Math.abs(target - a) / 50);
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const v = a + (target - a) * (1 - Math.pow(1 - p, 3));
      setShown(v);
      from.current = v;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return Math.round(shown);
}

/** Only this small piece re-renders every animation frame while the total counts up. */
function Total({ value }: { value: number }) {
  const shown = useCountUp(value);
  return <div className="wall-total">{naira(shown)}</div>;
}

/** The cash pile on the floor. Memoised so it only redraws when new notes land. */
const Pile = memo(function Pile({ items }: { items: { key: number; amount: number; x: number; y: number; r: number }[] }) {
  return (
    <div className="wall-pile" aria-hidden="true">
      {items.map((p) => (
        <PileNote key={p.key} amount={p.amount} x={p.x} y={p.y} r={p.r} />
      ))}
    </div>
  );
});
const PileNote = memo(function PileNote({ amount, x, y, r }: { amount: number; x: number; y: number; r: number }) {
  return <NoteImg amount={amount} className="pile-note" style={{ left: `${x}%`, bottom: `${y}px`, transform: `rotate(${r}deg)` }} />;
});

/** Falling notes. Memoised so callouts and the leaderboard don't redraw them. */
const Rain = memo(function Rain({ items }: { items: { key: number; amount: number; left: number; delay: number }[] }) {
  return (
    <div className="wall-rain" aria-hidden="true">
      {items.map((f) => (
        <FlutterNote key={f.key} seed={Math.abs(f.key) * 31 + 7} amount={f.amount} mode="fall"
          style={{ left: `${f.left}%`, ["--delay" as string]: `${f.delay}s` } as React.CSSProperties} />
      ))}
    </div>
  );
});

export function SprayWall({ eventId, title, celebrant, guestUrl, initial, payee, demo = false, stress = 0, slug, theme, nowDancing, venueName, open = true }: {
  eventId: string; title: string; celebrant: string; guestUrl: string; initial: Spray[]; payee?: string; demo?: boolean; stress?: number;
  slug?: string; theme?: ThemeId; nowDancing?: string | null; venueName?: string | null; open?: boolean;
}) {
  // Who's dancing, the theme and open/closed update live from the host's dashboard.
  const live = useLive(demo ? null : slug ?? null, { open, nowDancing: nowDancing ?? null, theme: theme ?? "classic" }, 4000);
  const [demoDancing, setDemoDancing] = useState<string | null>(demo ? nowDancing ?? null : null);
  const dancing = demo ? demoDancing : live.nowDancing;
  const [sprays, setSprays] = useState<Spray[]>(initial);
  const [falling, setFalling] = useState<Falling[]>([]);
  const [callout, setCallout] = useState<Callout | null>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [leaderFlash, setLeaderFlash] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const seen = useRef(new Set(initial.map((s) => s.id)));
  const lastId = useRef(initial.length ? initial[initial.length - 1].id : 0);
  const bursts = useRef(new Map<string, { name: string; amount: number; last: number }>());
  const queue = useRef<Callout[]>([]);
  const current = useRef<Callout | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalRef = useRef(initial.reduce((s, r) => s + r.amount_naira, 0));
  const leaderRef = useRef<string | null>(null);
  const soundRef = useRef(false);
  const counter = useRef(1);

  // ---------- Hype callouts: one at a time, the current guest's streak keeps growing ----------
  const showNext = useCallback(() => {
    const next = queue.current.shift() ?? null;
    current.current = next;
    setCallout(next);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (next) {
      if (soundRef.current) chime(next.tier);
      hideTimer.current = setTimeout(showNext, CALLOUT_MS);
    }
  }, []);

  const hype = useCallback((name: string, amount: number) => {
    const tier = tierFor(amount);
    if (tier < 0) return;
    const cur = current.current;
    if (cur && cur.name === name) {
      const upgraded = tier > cur.tier;
      const updated = { ...cur, amount, tier, line: upgraded ? lineFor(tier, counter.current++, kindOf(name)) : cur.line };
      current.current = updated;
      setCallout(updated);
      if (upgraded && soundRef.current) chime(tier);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(showNext, CALLOUT_MS);
      return;
    }
    const entry: Callout = { key: counter.current++, name, amount, tier, line: lineFor(tier, counter.current, kindOf(name)) };
    const i = queue.current.findIndex((q) => q.name === name);
    if (i >= 0) queue.current[i] = { ...entry, key: queue.current[i].key };
    else queue.current.push(entry);
    // At a busy party only the biggest streaks wait in line.
    if (queue.current.length > 3) {
      queue.current.sort((a, b) => b.amount - a.amount);
      queue.current.length = 3;
    }
    if (!cur) showNext();
  }, [showNext]);

  // ---------- New sprays arrive (realtime, catch-up poll, or demo) ----------
  // They're buffered and drawn together 4 times a second: looks identical, far lighter.
  const pending = useRef<Spray[]>([]);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processRef = useRef<(rows: Spray[]) => void>(() => {});
  const addSprays = useCallback((rows: Spray[]) => {
    pending.current.push(...rows);
    if (flushTimer.current) return;
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null;
      const batch = pending.current.splice(0);
      if (batch.length) processRef.current(batch);
    }, FLUSH_MS);
  }, []);
  useEffect(() => () => { if (flushTimer.current) clearTimeout(flushTimer.current); }, []);

  const processBatch = useCallback((rows: Spray[]) => {
    const fresh = rows.filter((s) => !seen.current.has(s.id));
    if (!fresh.length) return;
    const now = Date.now();
    for (const s of fresh) {
      seen.current.add(s.id);
      lastId.current = Math.max(lastId.current, s.id);
      const k = s.guest_name.trim().toLowerCase();
      const b = bursts.current.get(k);
      const streak = b && now - b.last < BURST_WINDOW_MS ? b.amount + s.amount_naira : s.amount_naira;
      bursts.current.set(k, { name: displayName(s.guest_name), amount: streak, last: now });
    }
    setSprays((prev) => [...prev, ...fresh]);
    setFalling((prev) => {
      const add = fresh.slice(-NEW_PER_FLUSH).map((s, i) => ({ key: s.id, amount: s.amount_naira, left: hash(s.id) * 84, delay: i * 0.05 }));
      return [...prev, ...add].slice(-MAX_FALLING);
    });
    if (soundRef.current) fresh.slice(-6).forEach((_, i) => setTimeout(swish, i * 90));

    // The latest guest's streak drives the callout.
    const last = fresh[fresh.length - 1];
    const b = bursts.current.get(last.guest_name.trim().toLowerCase());
    if (b) hype(b.name, b.amount);

    // Milestones
    const added = fresh.reduce((s, r) => s + r.amount_naira, 0);
    const before = totalRef.current;
    totalRef.current += added;
    const hit = crossedMilestone(before, totalRef.current);
    if (hit) {
      setMilestone({ key: now, amount: hit });
      if (soundRef.current) horn();
      setFalling((prev) => {
        const shower = Array.from({ length: 22 }, (_, i) => ({
          key: -(now + i), amount: [1000, 500, 200, 1000, 100, 50][i % 6], left: hash(now + i) * 90, delay: i * 0.07,
        }));
        return [...prev, ...shower].slice(-MAX_FALLING - 22);
      });
      setTimeout(() => setMilestone((m) => (m && m.key === now ? null : m)), 4200);
    }
  }, [hype]);
  processRef.current = processBatch;

  // ---------- Live data ----------
  useEffect(() => {
    if (demo) return;
    const sb = supabaseBrowser();
    const channel = sb
      .channel(`wall:${eventId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sprays", filter: `event_id=eq.${eventId}` },
        (payload) => addSprays([payload.new as Spray]))
      .subscribe();
    // Safety net for flaky venue Wi-Fi: catch up on anything realtime missed.
    const poll = setInterval(async () => {
      const { data } = await sb
        .from("sprays")
        .select("id,guest_name,amount_naira,created_at")
        .eq("event_id", eventId)
        .gt("id", lastId.current)
        .order("id", { ascending: true })
        .limit(500);
      if (data?.length) addSprays(data as Spray[]);
    }, 8000);
    return () => { sb.removeChannel(channel); clearInterval(poll); };
  }, [eventId, demo, addSprays]);

  // ---------- Demo party: fake guests spraying in bursts ----------
  useEffect(() => {
    if (!demo) return;
    const guests = ["Aunty Ngozi", "Chief Emeka", "Tunde", "Amaka", "Uncle Bayo", "Kemi", "Ifeanyi", "Big Segun", "Funmi", "Obinna", "Anonymous", "Anonymous", "Aunty Ngozi 🇬🇧", "Uche 🇺🇸", "Bisi 🇨🇦"];
    let id = 1;
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Stress test: /demo/wall?stress=60 fires 60 sprays a second from 300 different guests.
    if (stress > 0) {
      const perTick = Math.max(1, Math.round(stress / 20));
      const iv = setInterval(() => {
        const rows: Spray[] = [];
        for (let i = 0; i < perTick; i++) {
          const g = Math.random() < 0.3 ? guests[Math.floor(Math.random() * guests.length)] : `Guest ${1 + Math.floor(Math.random() * 300)}`;
          rows.push({ id: id++, guest_name: g, amount_naira: [50, 100, 200, 500, 1000][Math.floor(Math.random() * 5)], created_at: new Date().toISOString() });
        }
        rows.forEach((r) => addSprays([r])); // one at a time, exactly like realtime delivers them
      }, 50);
      return () => clearInterval(iv);
    }

    function burst() {
      if (!alive) return;
      const big = Math.random() < 0.18;
      const name = big ? (Math.random() < 0.5 ? "Chief Emeka" : "Big Segun") : guests[Math.floor(Math.random() * guests.length)];
      const notes = big ? 10 + Math.floor(Math.random() * 16) : 2 + Math.floor(Math.random() * 7);
      const denom = big ? 1000 : [50, 100, 200, 500, 500, 1000][Math.floor(Math.random() * 6)];
      for (let i = 0; i < notes; i++) {
        timers.push(setTimeout(() => {
          addSprays([{ id: id++, guest_name: name, amount_naira: denom, created_at: new Date().toISOString() }]);
        }, i * (140 + Math.random() * 120)));
      }
      timers.push(setTimeout(burst, notes * 200 + 900 + Math.random() * 1800));
    }
    timers.push(setTimeout(burst, 800));
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, [demo, stress, addSprays]);

  // ---------- Derived ----------
  const total = useMemo(() => sprays.reduce((s, r) => s + r.amount_naira, 0), [sprays]);
  const board = useMemo(() => {
    const m = new Map<string, { name: string; amt: number }>();
    for (const s of sprays) {
      const k = s.guest_name.trim().toLowerCase();
      const cur = m.get(k) ?? { name: displayName(s.guest_name), amt: 0 };
      cur.amt += s.amount_naira;
      m.set(k, cur);
    }
    return [...m.values()].sort((a, b) => b.amt - a.amt).slice(0, 7);
  }, [sprays]);

  // New leader alert
  useEffect(() => {
    const leader = board[0]?.name ?? null;
    if (leader && leaderRef.current && leader !== leaderRef.current) {
      setLeaderFlash(leader);
      const t = setTimeout(() => setLeaderFlash(null), 3500);
      leaderRef.current = leader;
      return () => clearTimeout(t);
    }
    leaderRef.current = leader;
  }, [board]);

  // The pile of cash on the floor: the most recent notes, stacked higher as the night goes on.
  const pile = useMemo(() => {
    const recent = sprays.slice(-PILE_SIZE);
    const height = Math.min(1, sprays.length / 160);
    return recent.map((s, i) => ({
      key: s.id,
      amount: s.amount_naira,
      x: hash(s.id) * 96 - 4,
      y: (i / Math.max(1, recent.length)) * height * 70 + hash(s.id * 7) * 18,
      r: hash(s.id * 13) * 70 - 35,
    }));
  }, [sprays]);

  // ---------- Demo: rotate who's on the dance floor ----------
  useEffect(() => {
    if (!demo || stress) return;
    const floor = ["The couple", "The bride's family", "The groom's friends", "Everybody!"];
    let i = 0;
    const iv = setInterval(() => { i = (i + 1) % floor.length; setDemoDancing(floor[i]); }, 15000);
    return () => clearInterval(iv);
  }, [demo, stress]);

  // ---------- Keep the projector laptop awake for the whole party ----------
  useEffect(() => {
    type Sentinel = { release: () => Promise<void> };
    let lock: Sentinel | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<Sentinel> } };
    async function grab() {
      try {
        if (nav.wakeLock && document.visibilityState === "visible") lock = await nav.wakeLock.request("screen");
      } catch {
        // not supported or not allowed; the laptop's own sleep settings apply
      }
    }
    void grab();
    const again = () => { if (document.visibilityState === "visible") void grab(); };
    document.addEventListener("visibilitychange", again);
    return () => { document.removeEventListener("visibilitychange", again); void lock?.release().catch(() => {}); };
  }, []);

  // ---------- Controls: sound + full screen, fade away when the mouse is idle ----------
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const wake = () => {
      setControlsVisible(true);
      clearTimeout(t);
      t = setTimeout(() => setControlsVisible(false), 3000);
    };
    wake();
    window.addEventListener("mousemove", wake);
    window.addEventListener("touchstart", wake);
    return () => { clearTimeout(t); window.removeEventListener("mousemove", wake); window.removeEventListener("touchstart", wake); };
  }, []);

  function toggleSound() {
    if (soundOn) { disableSound(); soundRef.current = false; setSoundOn(false); return; }
    if (enableSound()) { soundRef.current = true; setSoundOn(true); chime(1); }
  }
  function fullScreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }

  return (
    <div className={`wall pattern${milestone ? " wall-shake" : ""}`} data-theme={live.theme}>
      <Pile items={pile} />
      <Rain items={falling} />

      <main className="wall-main">
        <h1>{title}</h1>
        {venueName && <p className="wall-venue">at {venueName}</p>}
        {demo && <p className="muted">Demo party: these sprays are pretend.</p>}
        {dancing && (
          <div className="now-dancing" key={dancing} aria-live="polite">
            <span className="nd-label">💃 Now dancing</span>
            <span className="nd-who">{dancing}</span>
          </div>
        )}

        <div className="callout-zone" aria-live="polite">
          {callout && (
            <div className={`callout tier-${callout.tier}`} key={callout.key}>
              <div className="callout-name">{callout.name}</div>
              <div className="callout-line">{callout.line}</div>
              <div className="callout-amount" key={callout.amount}>{naira(callout.amount)}</div>
            </div>
          )}
        </div>

        <div className="wall-total-label">Sprayed on {celebrant} so far</div>
        <Total value={total} />
      </main>

      <aside className="wall-side">
        {live.open ? (
          <div className="qr-box">
            <QRCodeSVG value={guestUrl} size={120} bgColor="#fcefd9" fgColor="#2a0820" marginSize={0} />
            <div>Scan to spray {celebrant}<small>{guestUrl.replace(/^https?:\/\//, "")}</small></div>
          </div>
        ) : (
          <div className="qr-box closed">Spraying has closed. Thank you for the love! ❤️</div>
        )}
        {payee && (
          <p className="payee">
            Money goes to <strong>{payee}</strong>. Check your phone shows the same name before you pay.
          </p>
        )}
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>Top sprayers</h2>
          {leaderFlash && <div className="leader-flash" key={leaderFlash}>New top sprayer: {leaderFlash}!</div>}
          {board.length === 0 ? (
            <p className="muted">Who&apos;s going first?</p>
          ) : (
            <ol className="board">
              {board.map((b, i) => (
                <li key={b.name} className={i === 0 ? "lead" : undefined}>
                  <span className="pos">{i === 0 ? "👑" : i + 1}</span>
                  <span className="who">{b.name}</span>
                  <span className="amt">{compactNaira(b.amt)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>

      {milestone && (
        <div className="milestone" key={milestone.key} role="status">
          <div className="milestone-amount">{naira(milestone.amount)}</div>
          <div className="milestone-line">sprayed on {celebrant}! 🎉</div>
        </div>
      )}

      <div className={`wall-controls${controlsVisible ? "" : " hidden"}`}>
        <button type="button" className="btn btn-ghost" onClick={toggleSound}>{soundOn ? "Sound off" : "Sound on"}</button>
        <button type="button" className="btn btn-ghost" onClick={fullScreen}>Full screen</button>
      </div>
    </div>
  );
}
