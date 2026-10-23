import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const { key, open } = await req.json().catch(() => ({}));
  const db = supabaseAdmin();
  const { data: ev } = await db.from("events").select("id,host_key").eq("slug", slug).maybeSingle();
  if (!ev || !key || ev.host_key !== key) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  await db.from("events").update({ is_open: Boolean(open) }).eq("id", ev.id);
  return NextResponse.json({ ok: true, open: Boolean(open) });
}
