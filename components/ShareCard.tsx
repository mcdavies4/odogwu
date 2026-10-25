"use client";
import { useEffect, useRef, useState } from "react";
import { BODY, C, DISPLAY, centerText, drawBackground, drawLogo, drawNote, fitFont, fontsReady, loadNotes, naira, roundRect, shareOrDownload, siteHost, wrapLines } from "@/lib/canvasArt";

const W = 1080;
const H = 1920;

async function makeCard(celebrant: string, title: string, amount: number | null): Promise<Blob> {
  await fontsReady();
  const notes = await loadNotes();
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  drawBackground(ctx, W, H, 72);

  // A shower of notes across the top
  const scatter: [number, number, number, number, number][] = [
    [4, 180, 210, 360, -0.35], [3, 520, 140, 330, 0.22], [2, 860, 250, 300, -0.12],
    [4, 340, 430, 380, 0.15], [1, 760, 520, 300, -0.4], [3, 130, 600, 280, 0.3], [0, 980, 720, 240, 0.5],
  ];
  scatter.forEach(([i, x, y, w, r], n) => drawNote(ctx, n % 3 === 2 ? notes.backs[i] : notes.fronts[i], x, y, w, r, n % 4 === 1 ? 0.55 : 1));

  const cx = W / 2;
  let y = 900;
  ctx.fillStyle = C.lace;
  ctx.font = `700 64px ${BODY}`;
  y = centerText(ctx, ["I sprayed"], cx, y, 80) + 10;

  const size = fitFont(ctx, celebrant, "800", DISPLAY, 128, 64, W - 160, 2);
  ctx.font = `800 ${size}px ${DISPLAY}`;
  ctx.fillStyle = C.gold;
  y = centerText(ctx, wrapLines(ctx, celebrant, W - 160, 2), cx, y, size * 1.08) + 24;

  ctx.font = `600 46px ${BODY}`;
  ctx.fillStyle = C.dim;
  y = centerText(ctx, wrapLines(ctx, `at ${title}`, W - 200, 2), cx, y, 58) + 40;

  if (amount !== null) {
    ctx.font = `800 96px ${DISPLAY}`;
    const label = naira(amount);
    const tw = ctx.measureText(label).width + 110;
    ctx.fillStyle = C.gold;
    roundRect(ctx, cx - tw / 2, y, tw, 150, 75);
    ctx.fill();
    ctx.fillStyle = C.wine;
    centerText(ctx, [label], cx, y + 24, 100);
    y += 190;
  }

  ctx.font = `700 52px ${BODY}`;
  ctx.fillStyle = C.lace;
  centerText(ctx, ["No cash. Just love. 🎉"], cx, Math.max(y + 10, 1480), 60);

  // Footer brand
  drawLogo(ctx, cx - 150, 1700, 92);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = C.lace;
  ctx.font = `800 64px ${DISPLAY}`;
  ctx.fillText("Odogwu", cx - 90, 1700);
  ctx.textAlign = "center";
  ctx.font = `600 36px ${BODY}`;
  ctx.fillStyle = C.dim;
  ctx.fillText(`Spray money from your phone · ${siteHost()}`, cx, 1800);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
}

/** After spraying: a story-sized image guests can post to WhatsApp status, Instagram or TikTok. */
export function ShareCard({ celebrant, title, amount }: { celebrant: string; title: string; amount: number }) {
  const [showAmount, setShowAmount] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const blob = useRef<Blob | null>(null);

  useEffect(() => {
    let url: string | null = null;
    let alive = true;
    makeCard(celebrant, title, showAmount ? amount : null)
      .then((b) => {
        if (!alive) return;
        blob.current = b;
        url = URL.createObjectURL(b);
        setPreview(url);
      })
      .catch(() => setStatus("Couldn't make the picture on this phone."));
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [celebrant, title, amount, showAmount]);

  async function share() {
    if (!blob.current) return;
    const r = await shareOrDownload(blob.current, "i-sprayed-odogwu.png", `I sprayed ${celebrant} on Odogwu 🎉`);
    setStatus(r === "downloaded" ? "Saved. Post it to your status!" : r === "shared" ? "Shared! 🎉" : null);
  }

  return (
    <div className="share-card stack">
      <div className="share-preview">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={`I sprayed ${celebrant} share picture`} />
        ) : (
          <div className="share-skeleton" aria-hidden="true" />
        )}
      </div>
      <label className="ink-toggle">
        <input type="checkbox" checked={showAmount} onChange={(e) => setShowAmount(e.target.checked)} /> Show how much I sprayed
      </label>
      <button type="button" className="btn btn-block" onClick={share} disabled={!preview}>Share to my status</button>
      {status && <p className="small muted" role="status">{status}</p>}
    </div>
  );
}
