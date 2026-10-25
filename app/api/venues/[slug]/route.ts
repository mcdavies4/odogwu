import { NextResponse } from "next/server";
import { venueBySlug } from "@/lib/venues";

// Public: the venue's name, shown on "Create a celebration" when someone uses a venue's link.
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const v = await venueBySlug(slug);
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ name: v.name }, { headers: { "Cache-Control": "public, s-maxage=300" } });
}
