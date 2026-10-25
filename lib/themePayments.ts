import "server-only";
import { supabaseAdmin } from "./supabase-server";
import { verifyTransaction } from "./paystack";

/**
 * Confirms a premium-theme payment with Paystack (never trusts the browser) and unlocks the
 * themes on that celebration. Safe to call more than once: used by the return page and the webhook.
 */
export async function confirmThemePayment(reference: string): Promise<{ status: "success" | "pending" | "failed"; slug: string | null }> {
  const db = supabaseAdmin();
  const { data: tp } = await db.from("theme_payments").select("id,event_id,amount_kobo,status").eq("reference", reference).maybeSingle();
  if (!tp) return { status: "failed", slug: null };
  const { data: ev } = await db.from("events").select("slug").eq("id", tp.event_id).maybeSingle();
  const slug = ev?.slug ?? null;
  if (tp.status === "success") return { status: "success", slug };

  const tx = await verifyTransaction(reference);
  if (tx.status === "success" && tx.currency === "NGN" && Number(tx.amount) === Number(tp.amount_kobo)) {
    await db.from("theme_payments").update({ status: "success" }).eq("id", tp.id);
    await db.from("events").update({ themes_unlocked: true }).eq("id", tp.event_id);
    return { status: "success", slug };
  }
  if (["failed", "abandoned", "reversed"].includes(tx.status)) {
    await db.from("theme_payments").update({ status: "failed" }).eq("id", tp.id);
    return { status: "failed", slug };
  }
  return { status: "pending", slug };
}
