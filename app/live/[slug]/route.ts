import { NextResponse } from "next/server";
import { getPublicEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

// Small public status the spray wall and guests' phones poll: who's dancing, theme, open or closed.
// Cached for a few seconds at Vercel's edge so a full hall polling costs almost nothing.
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ev = await getPublicEvent(slug);
  if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(
    { open: ev.is_open, nowDancing: ev.now_dancing, theme: ev.theme },
    { headers: { "Cache-Control": "public, s-maxage=3, stale-while-revalidate=10" } }
  );
}
