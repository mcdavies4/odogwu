export const PACKS_NAIRA = [2000, 5000, 10000, 20000, 50000, 100000];
export const MIN_PACK_NAIRA = 1000;
export const MAX_PACK_NAIRA = 1_000_000;
export const DENOMINATIONS = [100, 200, 500, 1000];

export function feePercent(): number {
  const n = Number(process.env.PLATFORM_FEE_PERCENT ?? 5);
  return Number.isFinite(n) && n >= 0 && n <= 20 ? n : 5;
}

/** Service fee in kobo, added on top so the celebrant receives the full pack value. */
export function feeKobo(packNaira: number, pct = feePercent()): number {
  return Math.ceil(packNaira * 100 * (pct / 100));
}

export function naira(n: number): string {
  return "₦" + Math.round(n).toLocaleString("en-NG");
}

export function compactNaira(n: number): string {
  if (n >= 1_000_000) return "₦" + (n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0) + "m";
  if (n >= 1000) return "₦" + (n / 1000).toFixed(n % 1000 ? 1 : 0) + "k";
  return "₦" + n;
}
