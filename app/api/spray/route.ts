import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { DENOMINATIONS } from "@/lib/money";

const MESSAGES: Record<string, [string, number]> = {
  INSUFFICIENT: ["Your spray pack is finished. Top up to keep spraying!", 409],
  NOT_PAID: ["Payment not confirmed yet.", 402],
  NOT_FOUND: ["Spray pack not found.", 404],
  INVALID_AMOUNT: ["Invalid note.", 400],
};

export async function POST(req: Request) {
  const { reference, amount } = await req.json().catch(() => ({}));
  const amt = Number(amount);
  if (!reference || !DENOMINATIONS.includes(amt)) {
    return NextResponse.json({ error: "Invalid spray" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin().rpc("spray_note", {
    p_reference: String(reference),
    p_amount: amt,
  });
  if (error) {
    const code = Object.keys(MESSAGES).find((k) => error.message.includes(k));
    const [msg, status] = code ? MESSAGES[code] : ["Something went wrong", 500];
    return NextResponse.json({ error: msg, code }, { status });
  }
  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ remainingNaira: Number(row?.remaining_naira ?? 0) });
}
