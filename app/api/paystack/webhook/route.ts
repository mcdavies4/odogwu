import { NextResponse } from "next/server";
import { isValidWebhook } from "@/lib/paystack";
import { confirmPayment } from "@/lib/payments";

// Paystack → Settings → API Keys & Webhooks → Webhook URL: https://YOUR-DOMAIN/api/paystack/webhook
export async function POST(req: Request) {
  const raw = await req.text();
  if (!isValidWebhook(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }
  let event: { event?: string; data?: { reference?: string } } = {};
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }
  if (event.event === "charge.success" && event.data?.reference) {
    try {
      await confirmPayment(event.data.reference); // re-verifies with Paystack
    } catch {
      return NextResponse.json({ error: "retry" }, { status: 500 }); // Paystack will retry
    }
  }
  return NextResponse.json({ ok: true });
}
