import { NextResponse } from "next/server";
import { checkPack, findReference } from "@/lib/helpCheck";
import { allow, clientId, tooMany } from "@/lib/security";

/** "I paid but can't spray": checks the pack with Paystack and says exactly what to do next. */
export async function POST(req: Request) {
  if (!(await allow(`helpcheck:${clientId(req.headers)}`, 600, 30))) return tooMany();
  const body = await req.json().catch(() => ({}));
  const reference = findReference(String(body.reference ?? ""));
  if (!reference) {
    return NextResponse.json({ error: "That doesn't look like a payment reference. It starts with odg_ and is in your Paystack receipt email." }, { status: 400 });
  }
  try {
    const c = await checkPack(reference);
    if (!c.found) return NextResponse.json({ found: false, reference });
    const { summary: _summary, ...safe } = c; // the internal summary is for support only
    void _summary;
    return NextResponse.json({ ...safe, reference });
  } catch (e) {
    console.error("help check failed", e);
    return NextResponse.json({ error: "Couldn't reach Paystack just now. Try again in a minute." }, { status: 502 });
  }
}
