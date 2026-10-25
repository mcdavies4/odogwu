import "server-only";
import { supabaseAdmin } from "./supabase-server";
import { confirmPayment, sprayedSoFar } from "./payments";

export type PackCheck =
  | { found: false; summary: string }
  | {
      found: true;
      status: "success" | "pending" | "failed";
      slug: string;
      title: string;
      amount: number;
      remaining: number;
      ageMinutes: number;
      summary: string; // one line for you, in the help request
    };

export const REF_RE = /^odg_[a-z0-9]+_[a-z0-9]{6,12}$/i;

/** Pulls an odg_ reference out of whatever the person pasted (a Paystack receipt line, a URL…). */
export function findReference(text: string): string | null {
  const m = text.match(/odg_[a-z0-9]+_[a-z0-9]{6,12}/i);
  return m ? m[0] : null;
}

/**
 * Checks a spray pack with Paystack and fixes our record if Paystack has the money
 * (the same check the spray screen does). Safe to run any number of times.
 */
export async function checkPack(reference: string): Promise<PackCheck> {
  const p = await confirmPayment(reference);
  if (!p) return { found: false, summary: `Reference ${reference} not found` };
  const { data: row } = await supabaseAdmin().from("payments").select("created_at").eq("id", p.id).maybeSingle();
  const { data: ev } = await supabaseAdmin().from("events").select("slug,title").eq("id", p.event_id).maybeSingle();
  const amount = Number(p.amount_kobo) / 100;
  const remaining = p.status === "success" ? amount - (await sprayedSoFar(p.id)) : 0;
  const ageMinutes = row?.created_at ? Math.round((Date.now() - new Date(row.created_at).getTime()) / 60000) : 0;
  return {
    found: true,
    status: p.status,
    slug: ev?.slug ?? "",
    title: ev?.title ?? "",
    amount,
    remaining,
    ageMinutes,
    summary: `${reference}: ${p.status} with Paystack, ₦${amount.toLocaleString()} pack for ${ev?.title ?? "?"}, ₦${remaining.toLocaleString()} unsprayed, started ${ageMinutes} min ago`,
  };
}
