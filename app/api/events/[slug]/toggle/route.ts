import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { allow, clientId, safeEqual, tooMany } from "@/lib/security";

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!(await allow(`toggle:${clientId(req.headers)}`, 60, 30))) return tooMany();
  const { key, open } = await req.json().catch(() => ({}));
  const db = supabaseAdmin();
  const { data: ev } = await db.from("events").select("id,host_key").eq("slug", slug).maybeSingle();
  if (!ev || !safeEqual(String(key ?? ""), ev.host_key)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  await db.from("events").update({ is_open: Boolean(open) }).eq("id", ev.id);
  return NextResponse.json({ ok: true, open: Boolean(open) });
}
