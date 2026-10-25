"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Note } from "./Note";
import { FlutterNote } from "./FlutterNote";
import { DENOMINATIONS, naira } from "@/lib/money";
import { ShareCard } from "./ShareCard";
import { useLive } from "@/lib/useLive";

type Phase = "checking" | "pending" | "failed" | "ready" | "error";
type Fly = { id: number; amount: number; left: number; top: number; width: number; flyX: number };
type Spark = { id: number; x: number; y: number; sx: number; sy: number; color: string };

export function SprayScreen({ slug, celebrant, reference, title, nowDancing = null }: {
  slug: string; celebrant: string; reference: string; title: string; nowDancing?: string | null;
}) {
  const isDemo = reference === "demo";
  const live = useLive(isDemo ? null : slug, { open: true, nowDancing, theme: "classic" }, 10000);
  const wallHref = isDemo ? "/demo/wall" : `/e/${slug}/wall`;
  const help = (
    <p className="spray-help">
      Need help? <a href="/contact">Contact us</a>
      {!isDemo && reference && <> · Ref <code>{reference}</code></>}
    </p>
  );
  const [phase, setPhase] = useState<Phase>(reference ? "checking" : "error");
  const [message, setMessage] = useState<string | null>(reference ? null : "We couldn't find your spray pack.");
  const [guest, setGuest] = useState("");
  const [total, setTotal] = useState(0);
  const [serverRemaining, setServerRemaining] = useState(0);
  const [inFlight, setInFlight] = useState(0); // naira sprayed but not yet confirmed
  const [denom, setDenom] = useState(500);
  const [notice, setNotice] = useState<string | null>(null);

  const remaining = serverRemaining - inFlight;

  // 1. Confirm the payment with the server (which asks Paystack). Poll for bank transfers.
  useEffect(() => {
    if (!reference) return;
    if (reference === "demo") {
      setGuest("");
      setTotal(5000);
      setServerRemaining(5000);
      setPhase("ready");
      return;
    }
    let stop = false;
    let tries = 0;
    async function check() {
      try {
        const r = await fetch("/api/pay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference }) });
        const d = await r.json();
        if (stop) return;
        if (!r.ok) { setPhase("error"); setMessage(d.error || "Couldn't check your payment."); return; }
        setGuest(d.guestName);
        if (d.status === "success") {
          setTotal(d.totalNaira);
          setServerRemaining(d.remainingNaira);
          setPhase("ready");
          try { localStorage.setItem(`odogwu:ref:${slug}`, reference); } catch {}
        } else if (d.status === "failed") {
          setPhase("failed");
        } else {
          setPhase("pending");
          if (++tries < 60) setTimeout(check, 4000);
        }
      } catch {
        if (!stop) setTimeout(check, 4000);
      }
    }
    check();
    return () => { stop = true; };
  }, [reference, slug]);

  // Keep the chosen note affordable.
  useEffect(() => {
    if (phase !== "ready") return;
    if (denom > remaining) {
      const fit = [...DENOMINATIONS].reverse().find((d) => d <= remaining);
      if (fit) setDenom(fit);
    }
  }, [remaining, denom, phase]);

  // 2. Send sprays one after another so the server sees them in order.
  const queue = useRef<Promise<void>>(Promise.resolve());
  const spray = useCallback((amount: number) => {
    setInFlight((n) => n + amount);
    try { navigator.vibrate?.(18); } catch {}
    if (reference === "demo") {
      setServerRemaining((n) => n - amount);
      setInFlight((n) => n - amount);
      return;
    }
    queue.current = queue.current.then(async () => {
      try {
        const r = await fetch("/api/spray", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, amount }) });
        const d = await r.json();
        if (r.ok) setServerRemaining(d.remainingNaira);
        else setNotice(d.error || "That note didn't go through.");
      } catch {
        setNotice("No connection. That note didn't go through.");
      } finally {
        setInFlight((n) => n - amount);
      }
    });
  }, [reference]);

  // 3. The fun part: every sprayed note becomes a free-flying, tumbling note.
  const [flying, setFlying] = useState<Fly[]>([]);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const nextId = useRef(1);

  const launch = useCallback((rect: DOMRect, dx: number, amount: number) => {
    const id = nextId.current++;
    setFlying((f) => [...f.slice(-14), { id, amount, left: rect.left, top: rect.top, width: rect.width, flyX: dx * 2.2 + (Math.random() * 120 - 60) }]);
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ["#f2b705", "#2fa36b", "#ff5c8a", "#fcefd9"];
    setSparks((s) => [
      ...s.slice(-40),
      ...Array.from({ length: 10 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
        const d = 60 + Math.random() * 70;
        return { id: id * 100 + i, x: cx, y: cy, sx: Math.cos(a) * d, sy: Math.sin(a) * d - 40, color: colors[i % colors.length] };
      }),
    ]);
    setTimeout(() => setFlying((f) => f.filter((n) => n.id !== id)), 2400);
    setTimeout(() => setSparks((s) => s.filter((p) => Math.floor(p.id / 100) !== id)), 800);
  }, []);

  const sprayWithFx = useCallback((rect: DOMRect | undefined, dx: number) => {
    if (rect) launch(rect, dx, denom);
    spray(denom);
  }, [launch, spray, denom]);

  const fx = (
    <>
      {flying.map((n) => (
        <FlutterNote
          key={n.id}
          seed={n.id * 4099}
          amount={n.amount}
          mode="fly"
          style={{ left: n.left, top: n.top, width: n.width, ["--fly-x" as string]: `${n.flyX}px` } as React.CSSProperties}
        />
      ))}
      {sparks.map((p) => (
        <span key={p.id} className="spark" style={{ left: p.x, top: p.y, background: p.color, ["--sx" as string]: `${p.sx}px`, ["--sy" as string]: `${p.sy}px` } as React.CSSProperties} />
      ))}
    </>
  );

  if (phase === "checking") return <Centered><h1 style={{ fontSize: 26 }}>Confirming your payment…</h1></Centered>;
  if (phase === "pending")
    return (
      <Centered>
        <h1 style={{ fontSize: 26 }}>Waiting for your payment</h1>
        <p className="muted">Paid by bank transfer? It can take a minute to arrive. Keep this page open and your notes will appear.</p>
        {help}
      </Centered>
    );
  if (phase === "failed" || phase === "error")
    return (
      <Centered>
        <h1 style={{ fontSize: 26 }}>{phase === "failed" ? "That payment didn't go through" : "Something's missing"}</h1>
        <p className="muted">{message ?? "No money was taken for this pack. You can try again."}</p>
        <Link className="btn" href={`/e/${slug}`}>Buy a spray pack</Link>
        {help}
      </Centered>
    );

  if (remaining <= 0 && inFlight === 0) {
    return (
      <Centered>
        <Note amount={1000} style={{ width: 220, transform: "rotate(-8deg)" }} />
        <h1 style={{ fontSize: 28 }}>You sprayed {naira(total)}!</h1>
        <p className="muted">{celebrant} will receive it in their bank the next working day.</p>
        <ShareCard celebrant={celebrant} title={title} amount={total} />
        {reference === "demo" ? (
          <>
            <button className="btn btn-block" onClick={() => { setTotal(5000); setServerRemaining(5000); }}>Spray again</button>
            <Link className="btn btn-ghost btn-block" href="/host/new">Create your own celebration</Link>
          </>
        ) : (
          <Link className="btn btn-block" href={`/e/${slug}`}>Buy another pack</Link>
        )}
        {fx}
        {help}
      </Centered>
    );
  }

  return (
    <div className="spray-app">
      <div>
      {live.nowDancing && (
        <div className="spray-dancing" key={live.nowDancing}>💃 On the floor: <strong>{live.nowDancing}</strong></div>
      )}
      <div className="spray-head">
        <div>
          <div className="balance-label">Left to spray</div>
          <div className="balance" aria-live="polite">{naira(Math.max(0, remaining))}</div>
        </div>
        <div className="celebrant">
          <span className="small muted">Spraying</span>
          <strong>{celebrant}</strong>
          <a className="watch-wall" href={wallHref} target="_blank" rel="noopener">📺 Watch the wall</a>
        </div>
      </div>
      </div>

      <SwipeNote amount={denom} disabled={denom > remaining} onSpray={(rect, dx) => sprayWithFx(rect, dx)} />
      {fx}

      <div>
        {notice && <div className="error small" role="alert" onClick={() => setNotice(null)}>{notice}</div>}
        <p className="sprayed-total">{guest ? `${guest}, ` : ""}you&apos;ve sprayed {naira(total - remaining)} of {naira(total)}</p>
        <div className="denoms" role="group" aria-label="Note value">
          {DENOMINATIONS.map((d) => (
            <button key={d} type="button" className="pack" aria-pressed={denom === d} disabled={d > remaining} onClick={() => setDenom(d)}>
              ₦{d.toLocaleString()}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 10 }} disabled={denom > remaining}
          onClick={() => sprayWithFx(document.querySelector(".note-live")?.getBoundingClientRect(), Math.random() * 60 - 30)}>
          Tap to spray {naira(denom)}
        </button>
        {help}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <main className="wrap stack center" style={{ minHeight: "100dvh", display: "grid", alignContent: "center", justifyItems: "center" }}>{children}</main>;
}

/** The note you flick upward. Distance or a quick flick both count. */
function SwipeNote({ amount, disabled, onSpray }: { amount: number; disabled: boolean; onSpray: (rect: DOMRect, dx: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const [cls, setCls] = useState("");
  const [count, setCount] = useState(0);
  const [hinted, setHinted] = useState(true);

  function setT(x: number, y: number, rot: number, opacity = 1) {
    if (ref.current) {
      ref.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;
      ref.current.style.opacity = String(opacity);
    }
  }

  function down(e: React.PointerEvent) {
    if (disabled) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    setCls("dragging");
  }
  function move(e: React.PointerEvent) {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = Math.min(40, e.clientY - start.current.y);
    setT(dx * 0.6, dy, dx / 18);
  }
  function up(e: React.PointerEvent) {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    const v = -dy / Math.max(1, performance.now() - start.current.t);
    start.current = null;
    if (-dy > 90 || (v > 0.55 && -dy > 30)) {
      // Hand the note over to a free-flying copy at exactly where it was released,
      // then put a fresh note back on the stack straight away for rapid spraying.
      const rect = ref.current?.getBoundingClientRect();
      setHinted(false);
      if (rect) onSpray(rect, dx);
      setCls("");
      setT(0, 0, 0, 1);
      setCount((c) => c + 1);
    } else {
      setCls("snap");
      setT(0, 0, 0);
    }
  }

  return (
    <div className="spray-zone">
      {hinted && !disabled && <div className="hint">Swipe the note up to spray</div>}
      <div className="note-stack">
        <Note amount={amount} className="note-under two" />
        <Note amount={amount} className="note-under" />
        <div
          key={count}
          ref={ref}
          className={`note-live ${cls}`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          aria-hidden="true"
          style={{ opacity: disabled ? 0.35 : 1 }}
        >
          <Note amount={amount} style={{ width: "100%", height: "100%", pointerEvents: "none" }} />
        </div>
      </div>
    </div>
  );
}
