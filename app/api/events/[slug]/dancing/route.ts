import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { allow, cleanText, clientId, nameProblem, safeEqual, tooMany } from "@/lib/security";

// Host sets who's on the dance floor; the wall and guests' phones show it.
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!(await allow(`dancing:${clientId(req.headers)}`, 60, 40))) return tooMany();
  const body = await req.json().catch(() => ({}));
  const text = cleanText(body.text, 50);
  const db = supabaseAdmin();
  const { data: ev } = await db.from("events").select("id,host_key").eq("slug", slug).maybeSingle();
  if (!ev || !safeEqual(String(body.key ?? ""), ev.host_key)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (text) {
    const issue = nameProblem(text);
    if (issue) return NextResponse.json({ error: "That can't go on the spray wall." }, { status: 400 });
  }
  const { error } = await db
    .from("events")
    .update({ now_dancing: text || null, now_dancing_at: text ? new Date().toISOString() : null })
    .eq("id", ev.id);
  if (error) {
    console.error("now dancing", error.message);
    return NextResponse.json({ error: "Run supabase/features.sql in Supabase to turn this on." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, nowDancing: text || null });
}
