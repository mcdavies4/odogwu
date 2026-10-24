import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { allow, clientId, tooMany } from "@/lib/security";

export const dynamic = "force-dynamic";

// Called once a day by Vercel Cron (see vercel.json). The small database read stops
// Supabase's free plan from pausing the project, and housekeeping clears old records.
export async function GET(req: Request) {
  if (!(await allow(`health:${clientId(req.headers)}`, 60, 10))) return tooMany();
  const db = supabaseAdmin();
  const { error } = await db.from("events").select("id", { head: true, count: "exact" }).limit(1);
  try {
    await db.rpc("housekeeping");
  } catch {
    // housekeeping is optional; security.sql may not be installed yet
  }
  return NextResponse.json({ ok: !error, at: new Date().toISOString() }, { status: error ? 503 : 200 });
}
