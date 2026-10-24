import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "./supabase-server";

/* ------------------------------------------------------------------ */
/* Secret comparison                                                   */
/* ------------------------------------------------------------------ */

/** Compares two secrets in constant time, so response timing can't leak them. */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb) && a.length === b.length;
}

/* ------------------------------------------------------------------ */
/* Client IP                                                           */
/* ------------------------------------------------------------------ */

type HeaderBag = { get(name: string): string | null };

/** The visitor's IP as Vercel reports it, hashed so we never store raw IPs. */
export function clientId(headers: HeaderBag): string {
  const ip =
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return createHash("sha256").update(ip + (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")).digest("hex").slice(0, 24);
}

/* ------------------------------------------------------------------ */
/* Rate limiting                                                       */
/* ------------------------------------------------------------------ */

// Fallback store used if the database limiter isn't installed or is unreachable.
// Per server instance only, so it's a backstop rather than the main defence.
const memory = new Map<string, { start: number; hits: number }>();

function memoryHit(key: string, windowSec: number, max: number): boolean {
  const now = Date.now();
  const row = memory.get(key);
  if (!row || now - row.start > windowSec * 1000) {
    memory.set(key, { start: now, hits: 1 });
    if (memory.size > 5000) {
      for (const [k, v] of memory) if (now - v.start > 3600_000) memory.delete(k);
    }
    return true;
  }
  row.hits++;
  return row.hits <= max;
}

/**
 * Counts one hit against `key` and says whether it's still within `max` per `windowSec`.
 * Uses the shared database counter (works across all Vercel instances). If that fails,
 * it falls back to memory, and it never blocks a real guest because of an outage.
 */
export async function allow(key: string, windowSec: number, max: number): Promise<boolean> {
  const okMemory = memoryHit(key, windowSec, max);
  try {
    const { data, error } = await supabaseAdmin().rpc("rate_limit_hit", {
      p_key: key,
      p_window_seconds: windowSec,
      p_max: max,
    });
    if (error) return okMemory;
    return data !== false;
  } catch {
    return okMemory;
  }
}

/** True if `key` has already used up `max` hits in the current window (doesn't add a hit). */
export async function blocked(key: string, windowSec: number, max: number): Promise<boolean> {
  const m = memory.get(key);
  const memBlocked = !!m && Date.now() - m.start <= windowSec * 1000 && m.hits >= max;
  try {
    const { data, error } = await supabaseAdmin()
      .from("rate_limits")
      .select("window_start,hits")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return memBlocked;
    const fresh = Date.now() - new Date(data.window_start).getTime() <= windowSec * 1000;
    return fresh && data.hits >= max;
  } catch {
    return memBlocked;
  }
}

export function tooMany(message = "Too many tries. Wait a minute and try again.") {
  return NextResponse.json({ error: message }, { status: 429, headers: { "Retry-After": "60" } });
}

/* ------------------------------------------------------------------ */
/* Text input                                                          */
/* ------------------------------------------------------------------ */

// Invisible / direction-flipping characters that can be used to disguise text.
const INVISIBLE = /[\u0000-\u001F\u007F-\u009F­​-‏‪-‮⁠-⁯﻿]/g;

/** Strips invisible characters, squashes spaces and trims to `max` characters. */
export function cleanText(value: unknown, max = 80): string {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(INVISIBLE, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

// Whole words only, so names like "Dickson" or "Cockburn" are fine.
const BLOCKED = [
  "fuck", "fucker", "fucking", "motherfucker", "shit", "bullshit", "bitch", "cunt", "dickhead",
  "pussy", "cock", "whore", "slut", "bastard", "asshole", "arsehole", "nigger", "nigga", "faggot",
  "retard", "porn", "penis", "vagina", "rape", "rapist",
  "ashawo", "olosho", "werey", "mumu", "oloriburuku", "ewu", "onye ara", "anuofia", "nkita",
  "olodo", "dan iska", "shege",
];
const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i" };

function normalise(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[013457@$!]/g, (c) => LEET[c] ?? c)
    .replace(/[^a-z\s]/g, " ")
    .replace(/(.)\1{2,}/g, "$1$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks a name that will be shown on the big screen. Returns an error message to
 * show the guest, or null if the name is fine.
 */
export function nameProblem(name: string): string | null {
  if (!name) return "Tell the celebrant who's spraying!";
  if (!/\p{L}/u.test(name)) return "Please use your name.";
  if (/https?:|www\.|\.(com|ng|net|org|io|co)\b/i.test(name)) return "Links can't go on the spray wall. Please use your name.";
  if ((name.match(/\d/g) || []).length >= 6) return "Phone numbers can't go on the spray wall. Please use your name.";
  if (/@/.test(name) && /\.\w/.test(name)) return "Please use your name, not an email address.";
  // Join spaced-out letters back up, so "f u c k" or "F*U*C*K" is read as one word.
  const joined: string[] = [];
  let run = "";
  for (const t of normalise(name).split(" ")) {
    if (t.length === 1) { run += t; continue; }
    if (run) { joined.push(run); run = ""; }
    joined.push(t);
  }
  if (run) joined.push(run);
  const words = ` ${joined.join(" ")} `;
  const squashed = normalise(name).replace(/\s/g, "");
  for (const w of BLOCKED) {
    if (words.includes(` ${w} `)) return "That name can't go on the spray wall. Please use your real name.";
    if (w.length >= 5 && !w.includes(" ") && squashed.includes(w)) return "That name can't go on the spray wall. Please use your real name.";
  }
  return null;
}
