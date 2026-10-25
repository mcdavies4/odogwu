export const PACKS_NAIRA = [2000, 5000, 10000, 20000, 50000, 100000];
export const MIN_PACK_NAIRA = 1000;
export const MAX_PACK_NAIRA = 1_000_000;
export const DENOMINATIONS = [50, 100, 200, 500, 1000];

export function feePercent(): number {
  const n = Number(process.env.PLATFORM_FEE_PERCENT ?? 5);
  return Number.isFinite(n) && n >= 0 && n <= 20 ? n : 5;
}

/** Flat part of the service fee in naira (mirrors Paystack's ₦100 flat charge). */
export function feeFlat(): number {
  const n = Number(process.env.PLATFORM_FEE_FLAT ?? 100);
  return Number.isFinite(n) && n >= 0 && n <= 1000 ? n : 100;
}

/** Service fee in naira: 5% + ₦100, rounded up to the next naira. Same maths on server and phone. */
export function serviceFee(packNaira: number, pct: number, flat: number): number {
  return Math.ceil((packNaira * pct) / 100) + flat;
}

/** Service fee in kobo, added on top so the celebrant receives the full pack value. */
export function feeKobo(packNaira: number, pct = feePercent(), flat = feeFlat()): number {
  return serviceFee(packNaira, pct, flat) * 100;
}

export function naira(n: number): string {
  return "₦" + Math.round(n).toLocaleString("en-NG");
}

export function compactNaira(n: number): string {
  if (n >= 1_000_000) return "₦" + (n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0) + "m";
  if (n >= 1000) return "₦" + (n / 1000).toFixed(n % 1000 ? 1 : 0) + "k";
  return "₦" + n;
}
