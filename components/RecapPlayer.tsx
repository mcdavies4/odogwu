"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { BODY, C, DISPLAY, centerText, drawBackground, drawLogo, drawNote, fitFont, fontsReady, loadNotes, naira, roundRect, shareOrDownload, siteHost, wrapLines } from "@/lib/canvasArt";

export type RecapSummary = {
  title: string;
  celebrant: string;
  date: string | null;
  venue: string | null;
  total: number;
  guests: number;
  notes: number;
  packs: number;
  top: { name: string; amount: number }[];
  flags: string[];
};

const W = 720;
const H = 1280;
const DURATION = 20;

type Notes = Awaited<ReturnType<typeof loadNotes>>;
type Particle = { x: number; speed: number; offset: number; w: number; rot: number; spin: number; flip: number; i: number; back: boolean };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (p: number) => 1 - Math.pow(1 - clamp(p), 3);
/** 0→1→0 visibility of a scene from a to b with short fades. */
const vis = (t: number, a: number, b: number, f = 0.45) => clamp(Math.min((t - a) / f, (b - t) / f));

function particles(): Particle[] {
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 34 }, () => ({
    x: r() * W, speed: 160 + r() * 220, offset: r() * (H + 400), w: 110 + r() * 90,
    rot: r() * Math.PI * 2, spin: (r() - 0.5) * 2.4, flip: 1.5 + r() * 3, i: Math.floor(r() * 5), back: r() < 0.4,
  }));
}

function draw(ctx: CanvasRenderingContext2D, t: number, s: RecapSummary, bg: HTMLCanvasElement, notes: Notes, ps: Particle[]) {
  ctx.drawImage(bg, 0, 0);
  const cx = W / 2;

  // Falling cash: light at the start, heavy while the total climbs, gentle after.
  const density = t < 3.4 ? 0.35 : t < 8.6 ? 1 : t < 18 ? 0.45 : 0.25;
  const count = Math.round(ps.length * density);
  for (let k = 0; k < count; k++) {
    const p = ps[k];
    const y = ((t * p.speed + p.offset) % (H + 400)) - 200;
    const flip = Math.cos(t * p.flip + p.offset);
    const img = (flip < 0) !== p.back ? notes.backs[p.i] : notes.fronts[p.i];
    drawNote(ctx, img, p.x, y, p.w, p.rot + t * p.spin, flip);
  }

  // Soft dark panel behind the words so they always read
  const panel = ctx.createRadialGradient(cx, H * 0.47, 60, cx, H * 0.47, H * 0.55);
  panel.addColorStop(0, "rgba(42,8,32,0.82)");
  panel.addColorStop(1, "rgba(42,8,32,0)");
  ctx.fillStyle = panel;
  ctx.fillRect(0, 0, W, H);

  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 18;

  // 1. Title
  let a = vis(t, 0, 3.6);
  if (a > 0) {
    ctx.globalAlpha = a;
    ctx.fillStyle = C.gold;
    ctx.font = `700 26px ${BODY}`;
    centerText(ctx, ["H I G H L I G H T S"], cx, 360, 30);
    const size = fitFont(ctx, s.title, "800", DISPLAY, 76, 40, W - 100, 3);
    ctx.font = `800 ${size}px ${DISPLAY}`;
    ctx.fillStyle = C.lace;
    const y = centerText(ctx, wrapLines(ctx, s.title, W - 100, 3), cx, 430 + (1 - ease(t / 0.8)) * 30, size * 1.1);
    ctx.font = `600 28px ${BODY}`;
    ctx.fillStyle = C.dim;
    centerText(ctx, [[s.date, s.venue ? `at ${s.venue}` : null].filter(Boolean).join(" · ")], cx, y + 26, 34);
  }

  // 2. Total sprayed, counting up
  a = vis(t, 3.4, 8.6);
  if (a > 0) {
    ctx.globalAlpha = a;
    ctx.fillStyle = C.lace;
    ctx.font = `700 34px ${BODY}`;
    const y = centerText(ctx, wrapLines(ctx, `Sprayed on ${s.celebrant}`, W - 100, 2), cx, 470, 42);
    const shown = s.total * ease((t - 3.6) / 3.6);
    const label = naira(shown);
    const size = fitFont(ctx, naira(s.total), "800", DISPLAY, 120, 54, W - 70, 1);
    ctx.font = `800 ${size}px ${DISPLAY}`;
    ctx.fillStyle = C.gold;
    centerText(ctx, [label], cx, y + 20, size);
    if (t > 7.3) {
      ctx.globalAlpha = a * clamp((t - 7.3) / 0.4);
      ctx.font = `700 40px ${BODY}`;
      ctx.fillStyle = C.lace;
      centerText(ctx, ["🎉 Odogwu! 🎉"], cx, y + size + 60, 48);
    }
  }

  // 3. The numbers
  a = vis(t, 8.4, 11.8);
  if (a > 0) {
    const rows: [string, string][] = [
      [s.guests.toLocaleString("en-NG"), s.guests === 1 ? "guest sprayed" : "guests sprayed"],
      [s.notes.toLocaleString("en-NG"), "notes flew"],
      [s.packs.toLocaleString("en-NG"), s.packs === 1 ? "spray pack" : "spray packs"],
    ];
    rows.forEach(([n, l], i) => {
      const r = clamp((t - 8.5 - i * 0.45) / 0.45);
      if (r <= 0) return;
      ctx.globalAlpha = a * r;
      const y = 380 + i * 190 + (1 - ease(r)) * 30;
      ctx.font = `800 96px ${DISPLAY}`;
      ctx.fillStyle = C.gold;
      centerText(ctx, [n], cx, y, 100);
      ctx.font = `700 34px ${BODY}`;
      ctx.fillStyle = C.lace;
      centerText(ctx, [l], cx, y + 104, 40);
    });
  }

  // 4. Top sprayers
  a = vis(t, 11.6, 16.2);
  if (a > 0 && s.top.length) {
    ctx.globalAlpha = a;
    ctx.font = `800 52px ${DISPLAY}`;
    ctx.fillStyle = C.lace;
    centerText(ctx, ["Top sprayers"], cx, 340, 60);
    s.top.slice(0, 3).forEach((g, i) => {
      const r = clamp((t - 12.1 - (2 - i) * 0.6) / 0.45); // #3 first, the champion last
      if (r <= 0) return;
      ctx.globalAlpha = a * r;
      const y = 450 + i * 150;
      const x = 60;
      const w = W - 120;
      ctx.shadowBlur = 0;
      ctx.fillStyle = i === 0 ? C.gold : "rgba(67,18,53,0.92)";
      roundRect(ctx, x, y + (1 - ease(r)) * 24, w, 122, 26);
      ctx.fill();
      ctx.shadowBlur = 18;
      const ink = i === 0 ? C.wine : C.lace;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.font = `800 44px ${DISPLAY}`;
      ctx.fillStyle = i === 0 ? C.wine : C.gold;
      ctx.fillText(i === 0 ? "👑" : String(i + 1), x + 28, y + 61);
      ctx.fillStyle = ink;
      const nameSize = fitFont(ctx, g.name, "800", DISPLAY, 38, 22, w - 300, 1);
      ctx.font = `800 ${nameSize}px ${DISPLAY}`;
      ctx.fillText(wrapLines(ctx, g.name, w - 300, 1)[0], x + 104, y + 61);
      ctx.textAlign = "right";
      ctx.font = `700 34px ${BODY}`;
      ctx.fillText(naira(g.amount), x + w - 28, y + 61);
    });
  }

  // 5. Where the love came from / thank you
  a = vis(t, 16.0, 18.2);
  if (a > 0) {
    ctx.globalAlpha = a;
    if (s.flags.length > 1) {
      ctx.font = `800 50px ${DISPLAY}`;
      ctx.fillStyle = C.lace;
      centerText(ctx, ["Love came from"], cx, 470, 60);
      ctx.font = `96px ${BODY}`;
      centerText(ctx, wrapLines(ctx, s.flags.join(" "), W - 80, 2), cx, 570, 116);
    } else {
      ctx.font = `800 54px ${DISPLAY}`;
      ctx.fillStyle = C.lace;
      centerText(ctx, ["Thank you for", "the love ❤️"], cx, 520, 70);
    }
  }

  // 6. End card
  a = clamp((t - 18.0) / 0.45);
  if (a > 0) {
    ctx.globalAlpha = a;
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(42,8,32,0.88)";
    ctx.fillRect(0, 0, W, H);
    drawLogo(ctx, cx, 470, 150);
    ctx.font = `800 84px ${DISPLAY}`;
    ctx.fillStyle = C.lace;
    centerText(ctx, ["Odogwu"], cx, 580, 90);
    ctx.font = `700 36px ${BODY}`;
    ctx.fillStyle = C.gold;
    centerText(ctx, ["Spray the money.", "Leave the cash at home."], cx, 700, 46);
    ctx.font = `600 28px ${BODY}`;
    ctx.fillStyle = C.dim;
    centerText(ctx, [siteHost()], cx, 830, 34);
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function pickMime(): string {
  const options = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
  return options.find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) ?? "";
}

/** 20-second highlight reel: plays on screen, and can be saved as a video to post. */
export function RecapPlayer({ summary }: { summary: RecapSummary }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const assets = useRef<{ bg: HTMLCanvasElement; notes: Notes; ps: Particle[] } | null>(null);
  const raf = useRef(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [canRecord, setCanRecord] = useState(true);
  useEffect(() => setCanRecord(typeof MediaRecorder !== "undefined" && !!pickMime()), []);

  // Load fonts and note pictures, then show the first frame.
  useEffect(() => {
    let alive = true;
    (async () => {
      await fontsReady();
      const notes = await loadNotes();
      const bg = document.createElement("canvas");
      bg.width = W;
      bg.height = H;
      drawBackground(bg.getContext("2d")!, W, H, 54);
      if (!alive) return;
      assets.current = { bg, notes, ps: particles() };
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) draw(ctx, 1.6, summary, bg, notes, assets.current.ps);
      setReady(true);
    })().catch(() => setStatus("Couldn't load the reel on this device."));
    return () => { alive = false; cancelAnimationFrame(raf.current); };
  }, [summary]);

  const play = useCallback((onEnd?: () => void, onTick?: (t: number) => void) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !assets.current) return;
    cancelAnimationFrame(raf.current);
    const { bg, notes, ps } = assets.current;
    const start = performance.now();
    setPlaying(true);
    const frame = (now: number) => {
      const t = (now - start) / 1000;
      draw(ctx, Math.min(t, DURATION), summary, bg, notes, ps);
      onTick?.(t);
      if (t < DURATION) raf.current = requestAnimationFrame(frame);
      else { setPlaying(false); onEnd?.(); }
    };
    raf.current = requestAnimationFrame(frame);
  }, [summary]);

  async function record() {
    const canvas = canvasRef.current;
    if (!canvas || !assets.current) return;
    const mime = pickMime();
    const stream = canvas.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const done = new Promise<Blob>((resolve) => { rec.onstop = () => resolve(new Blob(chunks, { type: mime.split(";")[0] })); });
    setStatus(null);
    setRecording(0);
    rec.start(250);
    play(() => setTimeout(() => rec.state !== "inactive" && rec.stop(), 200), (t) => setRecording(Math.min(DURATION, Math.ceil(t))));
    const blob = await done;
    stream.getTracks().forEach((tr) => tr.stop());
    setRecording(null);
    const ext = blob.type.includes("mp4") ? "mp4" : "webm";
    const r = await shareOrDownload(blob, `odogwu-highlights.${ext}`, `${summary.title} highlights on Odogwu 🎉`);
    setStatus(
      r === "shared" ? "Shared! 🎉" :
      r === "downloaded" ? (ext === "webm" ? "Saved. If your app won't accept it, play it here and screen-record instead." : "Saved to your downloads.") :
      null
    );
  }

  return (
    <div className="recap stack">
      <div className="recap-frame">
        <canvas ref={canvasRef} width={W} height={H} aria-label={`Highlight reel for ${summary.title}`} />
        {!playing && ready && recording === null && (
          <button type="button" className="recap-play" onClick={() => play()} aria-label="Play highlight reel">▶</button>
        )}
      </div>
      <div className="row">
        <button type="button" className="btn" onClick={() => play()} disabled={!ready || recording !== null}>{playing ? "Playing…" : "Play"}</button>
        {canRecord ? (
          <button type="button" className="btn btn-ghost" onClick={record} disabled={!ready || recording !== null}>
            {recording !== null ? `Recording… ${recording}s / ${DURATION}s` : "Save video"}
          </button>
        ) : (
          <p className="small muted">This browser can&apos;t save video. Tap Play and use your phone&apos;s screen recorder.</p>
        )}
      </div>
      {recording !== null && <p className="small muted">Keep this screen open while it records.</p>}
      {status && <p className="small muted" role="status">{status}</p>}
    </div>
  );
}
