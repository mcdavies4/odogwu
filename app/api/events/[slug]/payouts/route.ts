import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { allow, clientId, safeEqual, tooMany } from "@/lib/security";
import { listSubaccountSettlements } from "@/lib/paystack";

/** Host only: Paystack's payouts to the celebrant's bank, so hosts can see for themselves where the money is. */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!(await allow(`payouts:${clientId(req.headers)}`, 60, 20))) return tooMany();
  const { key } = await req.json().catch(() => ({}));
  const db = supabaseAdmin();
  const { data: ev } = await db.from("events").select("id,host_key,subaccount_code").eq("slug", slug).maybeSingle();
  if (!ev || !safeEqual(String(key ?? ""), ev.host_key)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  // Every payout account this celebration has used (changing the account starts a new one).
  const codes = new Set<string>([ev.subaccount_code]);
  try {
    const { data } = await db.from("payout_changes").select("old_subaccount").eq("event_id", ev.id);
    for (const r of data ?? []) codes.add(r.old_subaccount);
  } catch {}

  try {
    const lists = await Promise.all([...codes].map((c) => listSubaccountSettlements(c).catch(() => [])));
    const payouts = lists
      .flat()
      .filter((s, i, all) => all.findIndex((x) => x.id === s.id) === i)
      .map((s) => ({
        id: s.id,
        status: s.status,
        naira: Number(s.effective_amount ?? s.total_amount) / 100,
        date: s.settlement_date ?? s.createdAt ?? null,
      }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return NextResponse.json({ payouts });
  } catch (e) {
    console.error("payouts failed", e);
    return NextResponse.json({ error: "Couldn't load payouts from Paystack just now." }, { status: 502 });
  }
}
