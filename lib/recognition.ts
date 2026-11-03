// Shared by the browser and the server: table numbers and the big-spray alert levels.

/** Highest table number a card can carry. */
export const MAX_TABLE = 300;

/** "7", "07", "Table 7" → 7. Anything else → null. */
export function tableFrom(value: unknown): number | null {
  const n = Number(String(value ?? "").replace(/\D/g, ""));
  return Number.isInteger(n) && n >= 1 && n <= MAX_TABLE ? n : null;
}

/** Choices for the "ODOGWU ALERT" takeover. 0 switches it off. */
export const BIG_SPRAY_LEVELS = [0, 20_000, 50_000, 100_000, 200_000, 500_000];
export const DEFAULT_BIG_SPRAY = 50_000;

export function bigSprayFrom(value: unknown): number {
  const n = Math.round(Number(value));
  return BIG_SPRAY_LEVELS.includes(n) ? n : DEFAULT_BIG_SPRAY;
}

/** Initials for guests without a photo: "Chief Emeka" → "CE". */
export function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "★";
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

/** Columns the wall reads for each note. The basic set works before supabase/recognition.sql is run. */
export const SPRAY_COLUMNS = "id,guest_name,amount_naira,created_at,table_no,photo_url";
export const SPRAY_COLUMNS_BASIC = "id,guest_name,amount_naira,created_at";
