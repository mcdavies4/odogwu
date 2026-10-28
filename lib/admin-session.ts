import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "odogwu_admin_session";
const SESSION_SECONDS = 60 * 60 * 12;

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createAdminSessionToken() {
  const secret = process.env.ADMIN_KEY;
  if (!secret || secret.length < 8) throw new Error("ADMIN_KEY is not configured securely.");
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  return `${issuedAt}.${signature(issuedAt, secret)}`;
}

export function verifyAdminSessionToken(token: string | undefined | null) {
  const secret = process.env.ADMIN_KEY;
  if (!secret || secret.length < 8 || !token) return false;
  const [issuedAt, suppliedSignature, extra] = token.split(".");
  if (!issuedAt || !suppliedSignature || extra) return false;
  const issued = Number(issuedAt);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(issued) || issued > now + 60 || now - issued > SESSION_SECONDS) return false;
  const expected = signature(issuedAt, secret);
  const a = Buffer.from(suppliedSignature, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function hasAdminSession() {
  const jar = await cookies();
  return verifyAdminSessionToken(jar.get(ADMIN_COOKIE)?.value);
}

export const ADMIN_SESSION_MAX_AGE = SESSION_SECONDS;
