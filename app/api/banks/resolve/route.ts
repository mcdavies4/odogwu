import { NextResponse } from "next/server";
import { resolveAccount } from "@/lib/paystack";

export async function POST(req: Request) {
  const { accountNumber, bankCode } = await req.json().catch(() => ({}));
  if (!/^\d{10}$/.test(String(accountNumber || "")) || !bankCode) {
    return NextResponse.json({ error: "Enter a 10-digit account number and pick a bank." }, { status: 400 });
  }
  try {
    const r = await resolveAccount(accountNumber, String(bankCode));
    return NextResponse.json({ accountName: r.account_name });
  } catch {
    return NextResponse.json({ error: "We couldn't find that account. Check the number and bank." }, { status: 404 });
  }
}
