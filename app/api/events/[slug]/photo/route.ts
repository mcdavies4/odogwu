import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { allow, clientId, safeEqual, tooMany } from "@/lib/security";
import { removeSelfies } from "@/lib/selfies";

/** Host or MC only: take a guest's photo off the wall (and delete it). { key, paymentId } */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const who = clientId(req.headers);
  if (!(await allow(`photo:${who}`, 600, 60))) return tooMany();
  const body = await req.json().catch(() => ({}));
  const db = supabaseAdmin();
  const { data: ev } = await db.from("events").select("id,host_key").eq("slug", slug).maybeSingle();
  if (!ev || !safeEqual(String(body.key ?? ""), ev.host_key)) {
    await allow(`hostfail:${who}`, 600, 30);
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const paymentId = String(body.paymentId ?? "");
  if (!/^[0-9a-f-]{20,40}$/i.test(paymentId)) return NextResponse.json({ error: "Photo not found" }, { status: 400 });
  const { data: pay } = await db.from("payments").select("id,photo_url,event_id,guest_name").eq("id", paymentId).maybeSingle();
  if (!pay || pay.event_id !== ev.id) return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  // A guest who bought several packs sent the photo with each one: remove it from all of them.
  const { data: same } = await db.from("payments").select("id,photo_url").eq("event_id", ev.id).eq("guest_name", pay.guest_name).not("photo_url", "is", null).limit(50);
  await removeSelfies(same?.length ? same : [pay]);
  return NextResponse.json({ ok: true });
}
