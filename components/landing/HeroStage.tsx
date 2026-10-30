"use client";
import { useEffect, useRef, useState } from "react";
import { FlutterNote } from "../FlutterNote";
import { NoteImg } from "../Note";

// What a real spray wall shows, playing on a loop: who's spraying, the running total, the top sprayers.
const SPRAYS: { name: string; line: string; amount: number }[] = [
  { name: "Chief Emeka", line: "na you biko!", amount: 5000 },
  { name: "Aunty Ngozi", line: "don land!", amount: 2000 },
  { name: "Secret Odogwu", line: "is spraying in secret 🤫", amount: 10000 },
  { name: "Big Segun", line: "is spraying!", amount: 1000 },
  { name: "Ada", line: "don land!", amount: 2000 },
];
const RAIN = [
  { amount: 1000, left: "8%", delay: "0s" },
  { amount: 500, left: "58%", delay: "1.1s" },
  { amount: 200, left: "30%", delay: "2.2s" },
  { amount: 1000, left: "72%", delay: "3.3s" },
  { amount: 500, left: "44%", delay: "4.4s" },
];
const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");

/** The landing page's one moving moment: a spray wall on a screen, and a phone spraying into it. */
export function HeroStage() {
  const [i, setI] = useState(0);
  const [total, setTotal] = useState(845000);
  const [board, setBoard] = useState<Record<string, number>>({ "Chief Emeka": 45000, "Aunty Ngozi": 30000, "Big Segun": 22000 });
  const shown = useRef(845000);
  const [display, setDisplay] = useState(845000);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setI((k) => {
        const next = (k + 1) % SPRAYS.length;
        const s = SPRAYS[next];
        setTotal((v) => v + s.amount);
        setBoard((b) => ({ ...b, [s.name]: (b[s.name] ?? 0) + s.amount }));
        return next;
      });
    }, 2600);
    return () => clearInterval(t);
  }, []);

  // Count the total up smoothly, like the real wall.
  useEffect(() => {
    let raf = 0;
    const from = shown.current, to = total, start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / 900);
      const v = from + (to - from) * (1 - Math.pow(1 - p, 3));
      shown.current = v;
      setDisplay(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [total]);

  const s = SPRAYS[i];
  const top = Object.entries(board).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="lp-stage" aria-label="A spray wall on a projector screen, with a guest spraying from their phone">
      <div className="lp-screen">
        <div className="lp-screen-rain" aria-hidden="true">
          {RAIN.map((r, k) => (
            <FlutterNote key={k} seed={k * 7919 + 13} amount={r.amount} mode="fall" loop
              style={{ left: r.left, ["--delay" as string]: r.delay, ["--dur" as string]: "5.5s" } as React.CSSProperties} />
          ))}
        </div>
        <div className="lp-screen-main">
          <div className="lp-screen-title">Tolu &amp; Chidi&apos;s wedding</div>
          <div className="lp-callout" key={i} aria-live="off">
            <div className="lp-callout-name">{s.name}</div>
            <div className="lp-callout-line">{s.line}</div>
            <div className="lp-callout-amt">{naira(s.amount)}</div>
          </div>
          <div className="lp-total-label">Sprayed on the couple so far</div>
          <div className="lp-total">{naira(display)}</div>
        </div>
        <div className="lp-screen-side" aria-hidden="true">
          <div className="lp-qr" />
          <div className="lp-side-h">Top sprayers</div>
          <ol>
            {top.map(([n, a], k) => (
              <li key={n}><span>{k === 0 ? "👑" : k + 1}</span><span className="lp-side-n">{n}</span><b>{naira(a)}</b></li>
            ))}
          </ol>
        </div>
      </div>
      <div className="lp-screen-stand" aria-hidden="true" />

      <div className="lp-phone" aria-hidden="true">
        <div className="lp-phone-top">
          <span>Left to spray</span>
          <b>₦5,000</b>
        </div>
        <div className="lp-phone-note">
          <NoteImg amount={1000} className="lp-phone-stack" />
          <NoteImg amount={1000} className="lp-phone-fly" key={i} />
        </div>
        <div className="lp-phone-hint">Swipe up to spray</div>
      </div>
    </div>
  );
}
