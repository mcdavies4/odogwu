import "server-only";
import { supabaseAdmin } from "./supabase-server";
import { verifyTransaction } from "./paystack";
import { logIncident } from "./ops";

export type PaymentRow = {
  id: string;
  event_id: string;
  reference: string;
  guest_name: string;
  amount_kobo: number;
  fee_kobo: number;
  status: "pending" | "success" | "failed";
};

/**
 * Confirms a payment with Paystack (never trusts the browser) and marks it paid.
 * Safe to call repeatedly — used by both the callback page and the webhook.
 */
export async function confirmPayment(reference: string): Promise<PaymentRow | null> {
  const db = supabaseAdmin();
  const { data: payment } = await db
    .from("payments")
    .select("id,event_id,reference,guest_name,amount_kobo,fee_kobo,status")
    .eq("reference", reference)
    .maybeSingle<PaymentRow>();

  if (!payment) return null;
  if (payment.status === "success") return payment;

  const tx = await verifyTransaction(reference);
  const expected = Number(payment.amount_kobo) + Number(payment.fee_kobo);

  if (tx.status === "success" && tx.currency === "NGN" && Number(tx.amount) === expected) {
    const { data: updated } = await db
      .from("payments")
      .update({ status: "success", paid_at: tx.paid_at ?? new Date().toISOString() })
      .eq("id", payment.id)
      .select("id,event_id,reference,guest_name,amount_kobo,fee_kobo,status")
      .single<PaymentRow>();
    return updated ?? { ...payment, status: "success" };
  }

  if (tx.status === "success") {
    // Paid, but not what we asked for: never unlock notes, and tell you.
    await logIncident("amount_mismatch", { reference, expected, got: tx.amount, currency: tx.currency }, {
      title: "A payment came in at the wrong amount",
      lines: [`Reference: ${reference}`, `Expected ${expected / 100} NGN, Paystack says ${Number(tx.amount) / 100} ${tx.currency}.`, "The guest's notes are locked until you check it in Paystack."],
    });
    return payment;
  }

  if (["failed", "abandoned", "reversed"].includes(tx.status)) {
    await db.from("payments").update({ status: "failed" }).eq("id", payment.id);
    return { ...payment, status: "failed" };
  }

  return payment; // still pending (e.g. bank transfer not yet received)
}

export async function sprayedSoFar(paymentId: string): Promise<number> {
  const { data } = await supabaseAdmin().from("sprays").select("amount_naira").eq("payment_id", paymentId);
  return (data ?? []).reduce((s, r) => s + Number(r.amount_naira), 0);
}
