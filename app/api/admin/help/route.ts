import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { clientId } from "@/lib/security";

// Admin only: mark a help request done (or open again).
export async function POST(req: Request) {
  if (!(await isAdmin(req.headers.get("x-admin-key"), clientId(req.headers)))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { id, done } = await req.json().catch(() => ({}));
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const { error } = await supabaseAdmin().from("help_requests").update({ status: done ? "done" : "open" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
