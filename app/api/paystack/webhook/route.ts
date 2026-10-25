import { NextResponse } from "next/server";
import { isValidWebhook } from "@/lib/paystack";
import { confirmPayment } from "@/lib/payments";
import { confirmThemePayment } from "@/lib/themePayments";

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
      const ref = event.data.reference;
      // Both re-verify with Paystack before trusting anything.
      if (ref.startsWith("odt_")) await confirmThemePayment(ref);
      else await confirmPayment(ref);
    } catch {
      return NextResponse.json({ error: "retry" }, { status: 500 }); // Paystack will retry
    }
  }
  return NextResponse.json({ ok: true });
}
