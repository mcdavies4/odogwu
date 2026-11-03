import "server-only";
import { supabaseAdmin } from "./supabase-server";

const BUCKET = "selfies";
const MAX_BYTES = 200_000; // the phone shrinks the photo to ~30 KB before sending

/**
 * Saves a guest's selfie for the spray wall. Takes the small JPEG the phone made
 * (a data: URL) and returns its public address, or null if anything is off.
 * Never throws: a missing photo must never stop a guest from paying.
 */
export async function saveSelfie(eventId: string, reference: string, dataUrl: unknown): Promise<string | null> {
  try {
    if (typeof dataUrl !== "string") return null;
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!m) return null;
    const bytes = Buffer.from(m[1], "base64");
    // Real JPEGs start with FF D8 FF.
    if (bytes.length < 500 || bytes.length > MAX_BYTES || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return null;
    const path = `${eventId}/${reference}.jpg`;
    const store = supabaseAdmin().storage.from(BUCKET);
    const { error } = await store.upload(path, bytes, { contentType: "image/jpeg", upsert: true, cacheControl: "86400" });
    if (error) return null;
    return store.getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

/** The storage path inside the bucket, from a public selfie address. */
export function selfiePath(url: string | null | undefined): string | null {
  if (!url) return null;
  const i = url.indexOf(`/${BUCKET}/`);
  return i < 0 ? null : decodeURIComponent(url.slice(i + BUCKET.length + 2).split("?")[0]);
}

/** Deletes selfies from storage and from the payments and notes that point to them. */
export async function removeSelfies(rows: { id: string; photo_url: string | null }[]): Promise<number> {
  const db = supabaseAdmin();
  const paths = rows.map((r) => selfiePath(r.photo_url)).filter((p): p is string => !!p);
  if (paths.length) {
    try { await db.storage.from(BUCKET).remove(paths); } catch {}
  }
  const ids = rows.map((r) => r.id);
  if (!ids.length) return 0;
  await db.from("payments").update({ photo_url: null }).in("id", ids);
  await db.from("sprays").update({ photo_url: null }).in("payment_id", ids);
  return ids.length;
}
