import { NextResponse } from "next/server";
import { listBanks } from "@/lib/paystack";

export const revalidate = 86400;

export async function GET() {
  try {
    const banks = await listBanks();
    return NextResponse.json({ banks: banks.map((b) => ({ name: b.name, code: b.code })) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
