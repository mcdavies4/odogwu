import { NextResponse } from "next/server";
import { confirmPayment, sprayedSoFar } from "@/lib/payments";
import { allow, clientId, tooMany } from "@/lib/security";

export async function POST(req: Request) {
  const { reference } = await req.json().catch(() => ({}));
  if (typeof reference !== "string" || !/^[A-Za-z0-9_-]{6,100}$/.test(reference)) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }
  if (!(await allow(`verify:r:${reference}`, 60, 40)) || !(await allow(`verify:ip:${clientId(req.headers)}`, 60, 600))) return tooMany();
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
    console.error("verify failed", e);
    return NextResponse.json({ error: "Couldn't reach the payment provider. Trying again…" }, { status: 502 });
  }
}
