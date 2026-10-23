// Party sounds made in the browser — no audio files to host or license.
// Browsers only allow sound after a tap/click, so the wall has a "Sound on" button.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let lastSwish = 0;

export function enableSound(): boolean {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(ctx.destination);
    }
    void ctx.resume();
    return true;
  } catch {
    return false;
  }
}

export function disableSound() {
  void ctx?.suspend();
}

/** Crisp note flick: a short burst of filtered noise. */
export function swish() {
  if (!ctx || !master || ctx.state !== "running") return;
  const now = ctx.currentTime;
  if (now - lastSwish < 0.07) return;
  lastSwish = now;
  const len = 0.18;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(2500 + Math.random() * 1500, now);
  bp.frequency.exponentialRampToValueAtTime(6500, now + len);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + len);
  src.connect(bp).connect(g).connect(master);
  src.start(now);
}

/** Bright rising chime for a hype callout. Higher tier, more notes. */
export function chime(tier: number) {
  if (!ctx || !master || ctx.state !== "running") return;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5].slice(0, 2 + Math.min(tier, 3));
  notes.forEach((f, i) => {
    const o = ctx!.createOscillator();
    const g = ctx!.createGain();
    o.type = "triangle";
    o.frequency.value = f;
    const t = now + i * 0.09;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g).connect(master!);
    o.start(t);
    o.stop(t + 0.55);
  });
}

/** Party horn for milestones. */
export function horn() {
  if (!ctx || !master || ctx.state !== "running") return;
  const now = ctx.currentTime;
  const blasts = [0, 0.32, 0.64];
  blasts.forEach((start, b) => {
    [466.16, 587.33, 698.46].forEach((f) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      const lp = ctx!.createBiquadFilter();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(f * 0.97, now + start);
      o.frequency.linearRampToValueAtTime(f, now + start + 0.06);
      lp.type = "lowpass";
      lp.frequency.value = 2400;
      const dur = b === 2 ? 0.75 : 0.24;
      g.gain.setValueAtTime(0.0001, now + start);
      g.gain.exponentialRampToValueAtTime(0.12, now + start + 0.03);
      g.gain.setValueAtTime(0.12, now + start + dur - 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      o.connect(lp).connect(g).connect(master!);
      o.start(now + start);
      o.stop(now + start + dur + 0.02);
    });
  });
}
