import "server-only";
import { allow, blocked, safeEqual } from "./security";

/**
 * True only for the right ADMIN_KEY. After 10 wrong guesses from one connection,
 * even the right key is refused for 15 minutes.
 */
export async function isAdmin(key: string | null | undefined, who: string): Promise<boolean> {
  const adminKey = process.env.ADMIN_KEY;
  if (await blocked(`adminfail:${who}`, 900, 10)) return false;
  if (!adminKey || adminKey.length < 8 || !key || !safeEqual(key, adminKey)) {
    await allow(`adminfail:${who}`, 900, 10);
    return false;
  }
  return true;
}
