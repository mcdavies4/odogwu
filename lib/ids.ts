import "server-only";
import { randomBytes } from "crypto";

const ALPHA = "abcdefghjkmnpqrstuvwxyz23456789";

function pick(len: number): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHA[bytes[i] % ALPHA.length];
  return out;
}

export function makeSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return `${base || "party"}-${pick(4)}`;
}

export const makeHostKey = () => pick(24);
export const makeReference = () => `odg_${Date.now().toString(36)}_${pick(8)}`;
/** Premium-theme payments use their own prefix so the webhook can tell them apart. */
export const makeThemeReference = () => `odt_${Date.now().toString(36)}_${pick(8)}`;
