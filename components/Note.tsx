/** Odogwu's own spray note — deliberately not a copy of any real banknote design. */
export function Note({ amount, className, style }: { amount: number; className?: string; style?: React.CSSProperties }) {
  const tint = amount >= 1000 ? "#e7a400" : amount >= 500 ? "#2fa36b" : "#d94f7b";
  const label = "₦" + amount.toLocaleString("en-NG");
  return (
    <svg viewBox="0 0 420 200" className={className} style={style} role="img" aria-label={`${label} note`}>
      <defs>
        <linearGradient id={`ng${amount}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff6e2" />
          <stop offset="1" stopColor="#f6dfb3" />
        </linearGradient>
        <pattern id={`np${amount}`} width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="11" cy="11" r="7" fill="none" stroke={tint} strokeOpacity=".22" strokeWidth="2" />
        </pattern>
      </defs>
      <rect x="2" y="2" width="416" height="196" rx="16" fill={`url(#ng${amount})`} stroke={tint} strokeWidth="4" />
      <rect x="14" y="14" width="392" height="172" rx="10" fill={`url(#np${amount})`} />
      <rect x="14" y="14" width="392" height="172" rx="10" fill="none" stroke={tint} strokeOpacity=".5" strokeWidth="2" strokeDasharray="6 6" />
      <circle cx="320" cy="100" r="58" fill={tint} />
      <path d="M320 58 l12 30 32 2 -25 20 9 31 -28 -18 -28 18 9 -31 -25 -20 32 -2z" fill="#fff6e2" opacity=".9" />
      <text x="34" y="78" fontFamily="Unbounded, sans-serif" fontWeight="800" fontSize="22" fill="#2a0820">ODOGWU</text>
      <text x="34" y="150" fontFamily="Unbounded, sans-serif" fontWeight="800" fontSize="54" fill="#2a0820">{label}</text>
      <text x="36" y="176" fontFamily="Figtree, sans-serif" fontSize="14" fill="#2a0820" opacity=".7">Spray with love</text>
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
