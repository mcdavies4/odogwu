"use client";
// Drawing helpers shared by the "I sprayed" card and the highlight reel.

export const C = {
  wine: "#2a0820",
  plum: "#431235",
  gold: "#f2b705",
  lace: "#fcefd9",
  dim: "#d9c3b3",
  leaf: "#2fa36b",
  rose: "#ff5c8a",
};

export const DISPLAY = "Unbounded, 'Arial Black', sans-serif";
export const BODY = "Figtree, 'Helvetica Neue', Arial, sans-serif";

const cache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string): Promise<HTMLImageElement> {
  if (!cache.has(src)) {
    cache.set(src, new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    }));
  }
  return cache.get(src)!;
}

export async function loadNotes() {
  const vals = [50, 100, 200, 500, 1000];
  const fronts = await Promise.all(vals.map((v) => loadImage(`/notes/${v}-front.webp`)));
  const backs = await Promise.all(vals.map((v) => loadImage(`/notes/${v}-back.webp`)));
  return { vals, fronts, backs };
}

export async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load(`800 80px Unbounded`),
      document.fonts.load(`700 40px Figtree`),
      document.fonts.load(`400 40px Figtree`),
    ]);
  } catch {
    // fall back to system fonts
  }
}

/** The Ankara-style dot background used across Odogwu. */
export function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, step = 48) {
  ctx.fillStyle = C.wine;
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w / 2, h * 0.38, 40, w / 2, h * 0.38, h * 0.75);
  g.addColorStop(0, "rgba(90,26,71,0.9)");
  g.addColorStop(1, "rgba(42,8,32,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h + step; y += step) {
    for (let x = 0; x < w + step; x += step) {
      ctx.strokeStyle = "rgba(242,183,5,0.07)";
      ctx.lineWidth = step / 24;
      ctx.beginPath();
      ctx.arc(x, y, step * 0.31, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,92,138,0.08)";
      ctx.beginPath();
      ctx.arc(x + step / 2, y + step / 2, step * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** A note at (x, y) centre, width w, rotation r (radians), flip -1..1 squashes it like it's turning over. */
export function drawNote(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, r: number, flip = 1) {
  const h = w * (200 / 420);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(r);
  ctx.scale(1, Math.max(0.04, Math.abs(flip)));
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = w * 0.06;
  ctx.shadowOffsetY = w * 0.03;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/** Odogwu logo mark (two notes) centred at (x, y), size s. */
export function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const k = s / 64;
  const rect = (cx: number, cy: number, rw: number, rh: number, deg: number, color: string) => {
    ctx.save();
    ctx.translate(x + (cx - 32) * k, y + (cy - 32) * k);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.fillStyle = color;
    roundRect(ctx, (-rw / 2) * k, (-rh / 2) * k, rw * k, rh * k, 5 * k);
    ctx.fill();
    ctx.restore();
  };
  rect(28, 27, 44, 26, -14, C.leaf);
  rect(36, 35, 44, 26, 8, C.gold);
  ctx.fillStyle = C.wine;
  ctx.beginPath();
  ctx.arc(x + 9 * k, y + 4 * k, 6 * k, 0, Math.PI * 2);
  ctx.fill();
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Splits text into lines that fit maxWidth with the current font. */
export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 3): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width <= maxWidth || !cur) cur = t;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\s*\S*$/, "") + "…";
    return kept;
  }
  return lines;
}

/** Largest font size (from max down to min) at which text fits in maxLines lines. */
export function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: string, family: string, max: number, min: number, maxWidth: number, maxLines: number) {
  for (let size = max; size >= min; size -= 4) {
    ctx.font = `${weight} ${size}px ${family}`;
    const lines = wrapLines(ctx, text, maxWidth, 99);
    if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxWidth)) return size;
  }
  return min;
}

export function centerText(ctx: CanvasRenderingContext2D, lines: string[], cx: number, top: number, lineHeight: number) {
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  lines.forEach((l, i) => ctx.fillText(l, cx, top + i * lineHeight));
  return top + lines.length * lineHeight;
}

export function naira(n: number) {
  return "₦" + Math.round(n).toLocaleString("en-NG");
}

export function siteHost() {
  return typeof window !== "undefined" ? window.location.host : "odogwu";
}

/** Share a file with the phone's share sheet, or download it if sharing files isn't supported. */
export async function shareOrDownload(blob: Blob, filename: string, text: string): Promise<"shared" | "downloaded" | "cancelled"> {
  const file = new File([blob], filename, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
