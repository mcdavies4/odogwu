/**
 * Odogwu spray notes — an original banknote-style set, inspired by the feel of
 * paper money but deliberately NOT copying any real naira design, portrait or
 * central-bank wording.
 */

type Palette = { paper: string; paper2: string; ink: string; tint: string; deep: string; words: string; motif: Motif };
type Motif = "drum" | "adire" | "zuma" | "cowrie" | "crown";

const PALETTES: Record<number, Palette> = {
  50:   { paper: "#e9f7f4", paper2: "#c9ebe4", ink: "#0f4b47", tint: "#1f9e93", deep: "#0f6b63", words: "FIFTY",        motif: "drum" },
  100:  { paper: "#f3ecfa", paper2: "#e0d0f2", ink: "#3d1d63", tint: "#7a4bb5", deep: "#4f2a80", words: "ONE HUNDRED",  motif: "adire" },
  200:  { paper: "#edf6e6", paper2: "#d5ebc6", ink: "#1f4a18", tint: "#4a9a35", deep: "#2c6b20", words: "TWO HUNDRED",  motif: "zuma" },
  500:  { paper: "#e9f0fb", paper2: "#cfdcf5", ink: "#16305e", tint: "#2f66c4", deep: "#1c4790", words: "FIVE HUNDRED", motif: "cowrie" },
  1000: { paper: "#fdf4dd", paper2: "#f6e0a8", ink: "#4d3200", tint: "#d39a12", deep: "#9a6b00", words: "ONE THOUSAND", motif: "crown" },
};

export function palette(amount: number): Palette {
  if (PALETTES[amount]) return PALETTES[amount];
  const keys = Object.keys(PALETTES).map(Number).sort((a, b) => a - b);
  const k = [...keys].reverse().find((v) => v <= amount) ?? keys[0];
  return PALETTES[k];
}

function serial(amount: number) {
  const n = (amount * 7919 + 104729) % 9_000_000 + 1_000_000;
  return `OD ${String(n).padStart(7, "0")}`;
}

/** Motifs drawn around (0,0), roughly 80px across, in a single colour. */
function MotifArt({ motif, color }: { motif: Motif; color: string }) {
  switch (motif) {
    case "drum": // talking drum (gangan)
      return (
        <g fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round">
          <ellipse cx="0" cy="-30" rx="22" ry="6" fill={color} fillOpacity=".25" />
          <ellipse cx="0" cy="30" rx="22" ry="6" fill={color} fillOpacity=".25" />
          <path d="M-22 -30 Q-6 0 -22 30 M22 -30 Q6 0 22 30" />
          {[-16, -8, 0, 8, 16].map((x) => (
            <path key={x} d={`M${x} -27 L${x * 0.35} 0 L${x} 27`} strokeWidth="1.6" />
          ))}
          <path d="M-8 0 h16" strokeWidth="5" />
          <path d="M26 -14 q18 -10 14 -30" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case "adire": // indigo resist-dye sun
      return (
        <g fill="none" stroke={color} strokeWidth="2.6">
          <circle r="12" fill={color} fillOpacity=".3" />
          <circle r="20" />
          <circle r="28" strokeDasharray="4 4" />
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i * Math.PI) / 8;
            return <line key={i} x1={Math.cos(a) * 31} y1={Math.sin(a) * 31} x2={Math.cos(a) * 40} y2={Math.sin(a) * 40} strokeLinecap="round" />;
          })}
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4 + Math.PI / 8;
            return <circle key={i} cx={Math.cos(a) * 20} cy={Math.sin(a) * 20} r="2.5" fill={color} />;
          })}
        </g>
      );
    case "zuma": // Zuma Rock
      return (
        <g stroke={color} strokeWidth="2.6" strokeLinejoin="round" fill="none">
          <path d="M-40 26 L-30 4 L-22 -6 L-14 -20 L-2 -30 L10 -27 L20 -16 L28 -2 L34 12 L40 26 Z" fill={color} fillOpacity=".22" />
          <path d="M-14 -20 Q-10 0 -16 24 M-2 -30 Q2 -4 -2 24 M10 -27 Q14 -2 10 24" strokeWidth="1.8" />
          <path d="M-46 28 H46" strokeWidth="3" strokeLinecap="round" />
          <circle cx="28" cy="-30" r="6" fill={color} fillOpacity=".5" />
        </g>
      );
    case "cowrie": { // three cowrie shells
      const shell = (x: number, y: number, r: number) => (
        <g key={`${x}${y}`} transform={`translate(${x} ${y}) rotate(${r})`}>
          <ellipse rx="11" ry="17" fill={color} fillOpacity=".22" stroke={color} strokeWidth="2.6" />
          <path d="M0 -12 Q-3 0 0 12" fill="none" stroke={color} strokeWidth="2" />
          {[-8, -3, 2, 7].map((t) => (
            <g key={t}><line x1="-3.5" y1={t} x2="-1" y2={t} stroke={color} strokeWidth="1.6" /><line x1="1" y1={t + 1} x2="3.5" y2={t + 1} stroke={color} strokeWidth="1.6" /></g>
          ))}
        </g>
      );
      return <g>{shell(-18, 8, -24)}{shell(18, 8, 24)}{shell(0, -16, 0)}</g>;
    }
    case "crown": // chieftaincy crown
      return (
        <g stroke={color} strokeWidth="2.8" strokeLinejoin="round" fill="none">
          <path d="M-30 16 L-36 -16 L-16 0 L0 -26 L16 0 L36 -16 L30 16 Z" fill={color} fillOpacity=".25" />
          <rect x="-31" y="16" width="62" height="10" rx="3" fill={color} fillOpacity=".4" />
          <circle cx="-36" cy="-18" r="4" fill={color} />
          <circle cx="0" cy="-28" r="4.5" fill={color} />
          <circle cx="36" cy="-18" r="4" fill={color} />
          {[-16, 0, 16].map((x) => <circle key={x} cx={x} cy="21" r="2.4" fill={color} />)}
        </g>
      );
  }
}

/** Fine-line rosette, the classic banknote "guilloche" swirl. */
function Rosette({ r, color, opacity = 0.35 }: { r: number; color: string; opacity?: number }) {
  return (
    <g fill="none" stroke={color} strokeOpacity={opacity} strokeWidth="1">
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse key={i} rx={r} ry={r * 0.36} transform={`rotate(${i * 15})`} />
      ))}
      <circle r={r * 0.36} />
    </g>
  );
}

export function Note({ amount, className, style }: { amount: number; className?: string; style?: React.CSSProperties }) {
  const p = palette(amount);
  const id = `n${amount}`;
  const label = "₦" + amount.toLocaleString("en-NG");
  const big = amount >= 1000 ? 40 : amount >= 200 ? 50 : 54;
  return (
    <svg viewBox="0 0 420 200" className={className} style={style} role="img" aria-label={`${label} spray note`}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.paper} />
          <stop offset="1" stopColor={p.paper2} />
        </linearGradient>
        <pattern id={`${id}w`} width="24" height="10" patternUnits="userSpaceOnUse">
          <path d="M0 5 Q6 0 12 5 T24 5" fill="none" stroke={p.tint} strokeOpacity=".18" strokeWidth="1" />
        </pattern>
        <clipPath id={`${id}c`}><rect x="0" y="0" width="420" height="200" rx="14" /></clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="420" height="200" fill={`url(#${id}g)`} />
        <rect width="420" height="200" fill={`url(#${id}w)`} />
        {/* colour band on the left edge */}
        <rect x="0" y="0" width="58" height="200" fill={p.tint} />
        <rect x="58" y="0" width="5" height="200" fill={p.deep} />
        <g transform="translate(29 100) rotate(-90)">
          <text textAnchor="middle" y="6" fontFamily="Unbounded, sans-serif" fontWeight="800" fontSize="16" fill={p.paper} letterSpacing="3">ODOGWU</text>
        </g>
        {/* medallion */}
        <g transform="translate(335 96)">
          <Rosette r={62} color={p.tint} />
          <circle r="47" fill={p.paper} stroke={p.tint} strokeWidth="3" />
          <circle r="42" fill="none" stroke={p.tint} strokeWidth="1" strokeDasharray="2 3" />
          <MotifArt motif={p.motif} color={p.deep} />
        </g>
      </g>
      {/* frame */}
      <rect x="2" y="2" width="416" height="196" rx="14" fill="none" stroke={p.deep} strokeWidth="4" />
      <rect x="70" y="10" width="340" height="180" rx="8" fill="none" stroke={p.tint} strokeOpacity=".55" strokeWidth="1.2" strokeDasharray="1 3" />
      {/* corner value */}
      <text x="402" y="34" textAnchor="end" fontFamily="Unbounded, sans-serif" fontWeight="800" fontSize="22" fill={p.deep}>{amount}</text>
      {/* main value */}
      <text x="80" y="58" fontFamily="Figtree, sans-serif" fontWeight="700" fontSize="13" letterSpacing="2.5" fill={p.ink} opacity=".75">SPRAY NOTE</text>
      <text x="78" y="122" fontFamily="Unbounded, sans-serif" fontWeight="800" fontSize={big} fill={p.ink}>{label}</text>
      <text x="80" y="150" fontFamily="Figtree, sans-serif" fontWeight="700" fontSize="13" letterSpacing="2" fill={p.deep}>{p.words} NAIRA</text>
      <text x="80" y="180" fontFamily="ui-monospace, Menlo, monospace" fontSize="12" fill={p.deep} opacity=".85">{serial(amount)}</text>
      <text x="270" y="180" fontFamily="Figtree, sans-serif" fontStyle="italic" fontSize="12" fill={p.ink} opacity=".6">Spray with love</text>
    </svg>
  );
}

/** Back of the note, seen when it flips in the air. */
export function NoteBack({ amount, className }: { amount: number; className?: string }) {
  const p = palette(amount);
  const id = `b${amount}`;
  return (
    <svg viewBox="0 0 420 200" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.tint} />
          <stop offset="1" stopColor={p.deep} />
        </linearGradient>
        <pattern id={`${id}d`} width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="14" cy="14" r="8" fill="none" stroke={p.paper} strokeOpacity=".18" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="2.4" fill={p.paper} fillOpacity=".2" />
          <circle cx="28" cy="28" r="2.4" fill={p.paper} fillOpacity=".2" />
        </pattern>
        <clipPath id={`${id}c`}><rect x="0" y="0" width="420" height="200" rx="14" /></clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="420" height="200" fill={`url(#${id}g)`} />
        <rect width="420" height="200" fill={`url(#${id}d)`} />
        <g transform="translate(92 100)">
          <Rosette r={70} color={p.paper} opacity={0.3} />
          <circle r="48" fill={p.deep} stroke={p.paper} strokeOpacity=".7" strokeWidth="3" />
          <MotifArt motif={p.motif} color={p.paper} />
        </g>
      </g>
      <rect x="2" y="2" width="416" height="196" rx="14" fill="none" stroke={p.paper} strokeOpacity=".55" strokeWidth="3" />
      <text x="396" y="118" textAnchor="end" fontFamily="Unbounded, sans-serif" fontWeight="800" fontSize={amount >= 1000 ? 62 : 70} fill={p.paper}>
        {amount.toLocaleString("en-NG")}
      </text>
      <text x="396" y="150" textAnchor="end" fontFamily="Figtree, sans-serif" fontWeight="700" fontSize="13" letterSpacing="2" fill={p.paper} opacity=".85">
        {p.words} NAIRA
      </text>
      <text x="396" y="34" textAnchor="end" fontFamily="Unbounded, sans-serif" fontWeight="800" fontSize="15" letterSpacing="3" fill={p.paper} opacity=".9">ODOGWU</text>
    </svg>
  );
}

export function Logo() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="6" y="14" width="44" height="26" rx="5" fill="#2fa36b" transform="rotate(-14 28 27)" />
      <rect x="14" y="22" width="44" height="26" rx="5" fill="#f2b705" transform="rotate(8 36 35)" />
      <circle cx="41" cy="36" r="6" fill="#2a0820" />
    </svg>
  );
}
