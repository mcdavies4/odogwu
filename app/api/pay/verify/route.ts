import { NextResponse } from "next/server";
import { confirmPayment, sprayedSoFar } from "@/lib/payments";

export async function POST(req: Request) {
  const { reference } = await req.json().catch(() => ({}));
  if (!reference || typeof reference !== "string") {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }
  try {
    const p = await confirmPayment(reference);
    if (!p) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    const total = Number(p.amount_kobo) / 100;
    const used = p.status === "success" ? await sprayedSoFar(p.id) : 0;
    return NextResponse.json({
      status: p.status,
      guestName: p.guest_name,
      totalNaira: total,
      remainingNaira: total - used,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
